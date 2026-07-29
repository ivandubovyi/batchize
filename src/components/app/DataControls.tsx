import { useRef, useState } from "react";
import {
  downloadBackup,
  parseBackup,
  applyBackup,
  readFileText,
  ImportError,
} from "@/lib/backup";
import { exampleAppData, EXAMPLE_QUICK, EXAMPLE_COMPANY } from "@/lib/example";
import { loadApp, saveApp, answeredCount } from "@/lib/application";
import { Card } from "@/components/app/shared";
import { Button } from "@/components/ui/button";
import { Download, FlaskConical, Upload } from "lucide-react";

export function DataControls({ onChanged }: { onChanged?: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirmExample, setConfirmExample] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const existing = answeredCount(loadApp());

  const doImport = async (file: File) => {
    setErr(null);
    setMsg(null);
    try {
      const { file: parsed, summary } = parseBackup(await readFileText(file));
      applyBackup(parsed);
      setMsg(
        `Restored ${summary.answers} answer${summary.answers === 1 ? "" : "s"}${
          summary.exportedAt
            ? ` from the export made on ${summary.exportedAt.slice(0, 10)}`
            : ""
        }.`
      );
      onChanged?.();
    } catch (e) {
      setErr(e instanceof ImportError ? e.message : "That file could not be imported.");
    }
  };

  const loadExample = () => {
    const current = loadApp();
    // Never overwrite real work without asking.
    if (answeredCount(current) > 0 && !confirmExample) {
      setConfirmExample(true);
      setErr(null);
      setMsg(null);
      return;
    }
    saveApp(exampleAppData());
    localStorage.setItem("batchize-quick", JSON.stringify(EXAMPLE_QUICK));
    setConfirmExample(false);
    setMsg(
      `Loaded the ${EXAMPLE_COMPANY} example. Every tab now shows what a strong application looks like. Export or clear it before writing your own.`
    );
    onChanged?.();
  };

  return (
    <Card className="mt-5">
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Your data
      </p>
      <p className="mb-4 text-sm text-muted-foreground">
        Your application is saved in this browser only. Export it to keep a copy
        you own, or to move it to another computer.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            downloadBackup();
            setErr(null);
            setMsg("Downloaded a JSON copy of your application.");
          }}
          disabled={existing === 0}
        >
          <Download className="mr-1.5 h-4 w-4" /> Export
        </Button>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="mr-1.5 h-4 w-4" /> Import
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doImport(f);
            e.target.value = "";
          }}
        />
        <Button variant="outline" className="rounded-xl" onClick={loadExample}>
          <FlaskConical className="mr-1.5 h-4 w-4" />
          {confirmExample ? "Overwrite with the example?" : "Load example"}
        </Button>
      </div>

      {confirmExample && (
        <p className="mt-3 text-xs font-semibold text-amber-600 dark:text-amber-400">
          You have {existing} answer{existing === 1 ? "" : "s"} written. Loading
          the example replaces them. Export first if you want to keep them, then
          press the button again.
        </p>
      )}
      {msg && (
        <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {msg}
        </p>
      )}
      {err && (
        <p className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">
          {err}
        </p>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        The example is a fictional company written to show what strong answers
        look like. It is not a real startup and not anyone's result.
      </p>
    </Card>
  );
}
