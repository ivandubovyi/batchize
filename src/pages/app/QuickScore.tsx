import { useMemo, useState } from "react";
import {
  QUICK_FIELDS,
  scoreQuick,
  quickToFullAnswers,
  type QuickAnswers,
  type ScoreLine,
} from "@/lib/quickScore";
import { loadApp, updateApp } from "@/lib/application";
import { Card, Donut } from "@/components/app/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check, RotateCcw, Zap } from "lucide-react";

const STORE = "batchize-quick";

function Line({ line }: { line: ScoreLine }) {
  const pct = line.max ? (line.points / line.max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-36 shrink-0 text-sm font-semibold">{line.label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${line.good ? "bg-emerald-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-xs font-bold text-muted-foreground">
        {line.points}/{line.max}
      </span>
    </div>
  );
}

export function QuickScore() {
  const [answers, setAnswers] = useState<QuickAnswers>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORE) ?? "{}");
    } catch {
      return {};
    }
  });
  const [submitted, setSubmitted] = useState(false);
  const [imported, setImported] = useState(false);

  const result = useMemo(() => scoreQuick(answers), [answers]);

  const set = (id: string, v: string) => {
    const next = { ...answers, [id]: v };
    setAnswers(next);
    localStorage.setItem(STORE, JSON.stringify(next));
  };

  const importToFull = () => {
    const mapped = quickToFullAnswers(answers);
    updateApp((d) => {
      for (const [k, v] of Object.entries(mapped)) {
        if (!(d.answers[k] ?? "").trim()) d.answers[k] = v;
      }
    });
    setImported(true);
  };

  const reset = () => {
    setAnswers({});
    localStorage.removeItem(STORE);
    setSubmitted(false);
    setImported(false);
  };

  const existing = loadApp();
  const wouldOverwrite = Object.keys(quickToFullAnswers(answers)).filter((k) =>
    (existing.answers[k] ?? "").trim()
  );

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Quick score</h1>
        <p className="mt-1 text-muted-foreground">
          The short version: eleven quick questions, no essays, about a minute.
          You get a score, what is helping, and the single highest-leverage
          thing to fix next.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* form */}
        <Card className="md:p-8">
          <div className="space-y-5">
            {QUICK_FIELDS.map((f) => {
              const v = answers[f.id] ?? "";
              return (
                <div
                  key={f.id}
                  className="grid items-center gap-2 sm:grid-cols-[1fr_220px]"
                >
                  <div>
                    <Label htmlFor={`q-${f.id}`}>{f.label}</Label>
                    <p className="text-xs text-muted-foreground">{f.hint}</p>
                  </div>
                  {f.kind === "yesno" ? (
                    <div className="grid grid-cols-2 gap-2">
                      {["yes", "no"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => set(f.id, opt)}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition-colors ${
                            v === opt
                              ? "border-primary bg-accent text-accent-foreground"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <Input
                        id={`q-${f.id}`}
                        type={f.kind === "number" ? "number" : "text"}
                        min={f.kind === "number" ? 0 : undefined}
                        value={v}
                        placeholder={f.placeholder}
                        maxLength={f.kind === "oneliner" ? 120 : undefined}
                        onChange={(e) => set(f.id, e.target.value)}
                      />
                      {f.kind === "oneliner" && (
                        <p
                          className={`mt-1 text-right text-xs font-semibold ${
                            v.length === 0
                              ? "text-muted-foreground"
                              : v.length > 50
                              ? "text-red-500"
                              : "text-emerald-600"
                          }`}
                        >
                          {v.length} / 50
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              className="rounded-xl"
              disabled={result.answeredCount === 0}
              onClick={() => setSubmitted(true)}
            >
              <Zap className="mr-1.5 h-4 w-4" /> Score me
            </Button>
            {result.answeredCount > 0 && (
              <button
                onClick={reset}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <span className="text-xs text-muted-foreground">
              {result.answeredCount}/{QUICK_FIELDS.length} answered
            </span>
          </div>
        </Card>

        {/* result */}
        <div className="space-y-5 lg:sticky lg:top-24">
          {!submitted ? (
            <Card className="py-14 text-center">
              <Zap className="mx-auto mb-4 h-9 w-9 text-primary/60" />
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                Answer what you can and hit Score me. Blank answers just score
                zero for that line, so a partial score still tells you
                something.
              </p>
            </Card>
          ) : (
            <>
              <Card>
                <div className="mb-4 flex items-center gap-5">
                  <Donut total={result.total} />
                  <div>
                    <h2 className="text-lg font-bold">{result.verdictTitle}</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {result.verdictBody}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-primary/40 bg-accent/40 p-3">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Do this next
                  </p>
                  <p className="text-sm leading-relaxed">{result.nextMove}</p>
                </div>
              </Card>

              <Card>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Traction
                </p>
                {result.traction.map((l) => (
                  <Line key={l.label} line={l} />
                ))}
                <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Team
                </p>
                {result.team.map((l) => (
                  <Line key={l.label} line={l} />
                ))}
                <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  How you say it
                </p>
                {result.writing.map((l) => (
                  <Line key={l.label} line={l} />
                ))}
                <div className="mt-4 space-y-1.5 border-t border-border pt-3">
                  {[...result.traction, ...result.team, ...result.writing]
                    .filter((l) => !l.good)
                    .slice(0, 4)
                    .map((l) => (
                      <p key={l.label} className="text-xs text-muted-foreground">
                        <b className="text-foreground">{l.label}:</b> {l.note}
                      </p>
                    ))}
                </div>
              </Card>

              <Card>
                <h3 className="mb-1 font-bold">Keep going</h3>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  This is a fast read on eleven signals. The full application
                  checks all 26 questions, cross-references your numbers, and
                  drills the interview.
                </p>
                {wouldOverwrite.length > 0 && !imported && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    Your full application already has answers for{" "}
                    {wouldOverwrite.length} of these. Importing will not touch
                    those.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={importToFull}
                    disabled={imported}
                  >
                    {imported ? (
                      <>
                        <Check className="mr-1.5 h-4 w-4" /> Imported
                      </>
                    ) : (
                      "Send these to the full application"
                    )}
                  </Button>
                  <Button asChild className="rounded-xl">
                    <a href="#/app/application">
                      Open it <ArrowRight className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
