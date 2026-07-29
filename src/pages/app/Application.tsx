import { useEffect, useMemo, useState } from "react";
import {
  loadApp,
  updateApp,
  SECTIONS,
  questionsFor,
  type AppData,
  type Question,
} from "@/lib/application";
import { quickFlags, type Flag } from "@/lib/reviewer";
import { Card, FlagItem } from "@/components/app/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchCheck } from "lucide-react";
import { Coach } from "@/components/app/Coach";

function checksFor(q: Question) {
  return {
    charCap: q.kind === "oneliner" ? 50 : undefined,
    expectNumbers: q.checks.includes("numbers"),
    competitors: q.checks.includes("competitors"),
    equity: q.checks.includes("equity"),
    insight: q.checks.includes("insight"),
  };
}

function QuestionField({
  q,
  value,
  data,
  onChange,
}: {
  q: Question;
  value: string;
  data: AppData;
  onChange: (v: string) => void;
}) {
  const flags: Flag[] = useMemo(
    () => (value.trim() ? quickFlags(value, checksFor(q)) : []),
    [q, value]
  );

  return (
    <div id={`q-${q.id}`} className="mb-7 space-y-2 scroll-mt-28">
      <Label htmlFor={q.id}>{q.label}</Label>
      <p className="text-xs leading-relaxed text-muted-foreground">{q.tip}</p>
      {q.kind === "input" || q.kind === "oneliner" ? (
        <Input
          id={q.id}
          value={value}
          maxLength={q.kind === "oneliner" ? 120 : undefined}
          onChange={(e) => onChange(e.target.value)}
                  />
      ) : (
        <Textarea
          id={q.id}
          rows={q.rows ?? 4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
                  />
      )}
      {q.kind === "oneliner" && (
        <p
          className={`text-right text-xs font-semibold ${
            value.length === 0
              ? "text-muted-foreground"
              : value.length > 50
              ? "text-red-500"
              : "text-emerald-600"
          }`}
        >
          {value.length} / 50
        </p>
      )}
      {flags.length > 0 && (
        <div className="space-y-2 pt-1">
          {flags.map((f, i) => (
            <FlagItem key={i} flag={f} />
          ))}
        </div>
      )}
      <Coach
        questionId={q.id}
        value={value}
        data={data}
        onApply={(next) => onChange(next)}
      />
    </div>
  );
}

export function Application({ query }: { query: URLSearchParams }) {
  const [data, setData] = useState(loadApp);

  // Deep links from the dashboard: ?section=idea or ?focus=<question id>
  useEffect(() => {
    const focus = query.get("focus");
    const section = query.get("section");
    const target = focus
      ? `q-${focus}`
      : section
      ? `s-${section}`
      : null;
    if (target) {
      setTimeout(
        () =>
          document
            .getElementById(target)
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        50
      );
    }
  }, [query]);

  const setAnswer = (id: string, v: string) =>
    setData(updateApp((d) => (d.answers[id] = v)));

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your application</h1>
          <p className="mt-1 text-muted-foreground">
            The real YC application questions, with what each one is actually
            asking. Auto-saved locally as you type.
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <a href="#/app/review">
            <SearchCheck className="mr-1.5 h-4 w-4" /> Run wholistic review
          </a>
        </Button>
      </header>

      <div className="space-y-8">
        {SECTIONS.map((s) => (
          <Card key={s.id} className="md:p-8">
            <div id={`s-${s.id}`} className="mb-6 scroll-mt-28">
              <h2 className="text-xl font-bold">{s.title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{s.blurb}</p>
            </div>
            {questionsFor(s.id).map((q) => (
              <QuestionField
                key={q.id}
                q={q}
                value={data.answers[q.id] ?? ""}
                data={data}
                onChange={(v) => setAnswer(q.id, v)}
              />
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
