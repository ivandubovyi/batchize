import { useMemo, useState } from "react";
import { Check, Copy, Printer, X } from "lucide-react";
import { buildPack, packToText } from "@/lib/submission";
import { loadApp } from "@/lib/application";
import { ProGate } from "@/components/app/ProGate";
import { PRO_FEATURES } from "@/lib/pro";

const feature = PRO_FEATURES.find((f) => f.id === "submit")!;

function SubmitInner() {
  const pack = useMemo(() => buildPack(loadApp()), []);
  const [copied, setCopied] = useState(false);

  const copyAll = async () => {
    await navigator.clipboard.writeText(packToText(pack));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const open = pack.checklist.filter((c) => !c.done);

  return (
    <div className="space-y-6">
      <header className="print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Submission pack</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every answer in the order the form asks for it, with the counts that
          matter. Print this or keep it open in a second tab while you paste.
        </p>
      </header>

      <div className="flex flex-wrap gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Printer className="h-4 w-4" /> Print or save as PDF
        </button>
        <button
          onClick={copyAll}
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
        >
          <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy as plain text"}
        </button>
      </div>

      <section
        className={`rounded-2xl border p-6 shadow-sm ${
          pack.ready
            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
            : "border-border bg-card"
        }`}
      >
        <h2 className="mb-1 text-lg font-bold">
          {pack.ready
            ? "Nothing left on the checklist"
            : `${open.length} thing${open.length === 1 ? "" : "s"} to look at before you submit`}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Every item here is checked against what you actually wrote.
        </p>
        <ul className="space-y-2.5">
          {pack.checklist.map((c) => (
            <li key={c.label} className="flex items-start gap-2.5 text-sm">
              {c.done ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              )}
              <span>
                <b className={c.done ? "text-muted-foreground" : ""}>{c.label}.</b>{" "}
                <span className="text-muted-foreground">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-8">
        {pack.sections.map((s) => (
          <section key={s.id}>
            <h2 className="mb-3 border-b border-border pb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {s.title}
            </h2>
            <div className="space-y-5">
              {s.answers.map((a) => (
                <div key={a.id}>
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold">{a.label}</h3>
                    <span
                      className={`shrink-0 text-xs ${
                        a.overHard
                          ? "font-bold text-red-600"
                          : a.overSoft
                            ? "text-amber-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      {a.chars} characters
                      {a.hardCap !== undefined && ` / ${a.hardCap} limit`}
                      {a.hardCap === undefined && a.softTarget !== undefined && a.overSoft && " (long)"}
                    </span>
                  </div>
                  <p
                    className={`whitespace-pre-wrap rounded-xl border p-3.5 text-sm leading-relaxed ${
                      a.empty
                        ? "border-dashed border-border text-muted-foreground"
                        : "border-border bg-card"
                    }`}
                  >
                    {a.text || "Not answered."}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="text-xs text-muted-foreground print:hidden">
        {pack.totalWords} words in total. Batchize is not affiliated with Y
        Combinator, and this pack is your own writing, unaltered.
      </p>
    </div>
  );
}

export function Submit() {
  return (
    <ProGate name={feature.name} blurb={feature.blurb} why={feature.why}>
      <SubmitInner />
    </ProGate>
  );
}
