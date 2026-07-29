import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QUESTIONS, type AppData } from "@/lib/application";
import { auditApplication, type Finding } from "@/lib/analyzer";
import { Card, Donut, ScoreBar } from "@/components/app/shared";
import { ArrowRight, ShieldCheck } from "lucide-react";

const CORE = ["one_liner", "product_description", "why_idea", "how_far"];

const SEV_STYLES: Record<string, string> = {
  red: "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
  amber: "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
  green: "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
};
const SEV_ICONS: Record<string, string> = { red: "🚩", amber: "⚠️", green: "✅" };

function FindingCard({ f }: { f: Finding }) {
  return (
    <div className={`rounded-xl border p-3 text-sm leading-relaxed ${SEV_STYLES[f.sev]}`}>
      <div className="flex items-start gap-2.5">
        <span className="shrink-0">{SEV_ICONS[f.sev]}</span>
        <div className="min-w-0">
          <p className="text-muted-foreground">
            <b className="text-foreground">{f.title}</b> {f.body}
          </p>
          {f.evidence && (
            <p className="mt-1.5 border-l-2 border-current/30 pl-2 text-xs italic text-muted-foreground/90">
              {f.evidence}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function Review() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ran, setRan] = useState(false);

  const data: AppData = useMemo(
    () => ({ answers, interview: {}, chancing: {} }),
    [answers]
  );
  const audit = useMemo(() => auditApplication(data), [data]);
  const filled = CORE.filter((id) => (answers[id] ?? "").trim()).length;

  // Only the four core answers are on this page, so score them on their own
  // terms rather than penalising the 22 questions this page never asks.
  const coreAudits = audit.sections
    .flatMap((s) => s.audits)
    .filter((a) => CORE.includes(a.question.id) && a.answered);
  const coreScore = coreAudits.length
    ? Math.round(
        (coreAudits.reduce((s, a) => s + a.score, 0) / coreAudits.length) * 10
      )
    : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-6">
      <header className="mx-auto mb-12 max-w-2xl text-center">
        <p className="mb-3 text-sm font-medium text-primary">Quick check</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Score your application like a partner would
        </h1>
        <p className="mt-4 text-muted-foreground">
          The four answers partners read first, checked instantly. No API key,
          no sign-up, nothing uploaded. For all 26 questions plus interview
          prep, open the{" "}
          <a href="#/app" className="font-semibold text-primary underline">
            full app
          </a>
          .
        </p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="md:p-8">
          <h2 className="text-lg font-semibold">Your answers</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            These are the actual questions from the YC application.
          </p>
          {CORE.map((id) => {
            const q = QUESTIONS.find((x) => x.id === id)!;
            const value = answers[id] ?? "";
            return (
              <div key={id} className="mb-6 space-y-2">
                <Label htmlFor={id}>{q.label}</Label>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {q.tip}
                </p>
                {q.kind === "oneliner" ? (
                  <>
                    <Input
                      id={id}
                      maxLength={120}
                      value={value}
                      onChange={(e) =>
                        setAnswers((a) => ({ ...a, [id]: e.target.value }))
                      }
                    />
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
                  </>
                ) : (
                  <Textarea
                    id={id}
                    rows={q.rows ?? 4}
                    value={value}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [id]: e.target.value }))
                    }
                  />
                )}
              </div>
            );
          })}
          <Button
            className="w-full rounded-xl py-6 text-base font-semibold"
            onClick={() => setRan(true)}
            disabled={filled === 0}
          >
            Check my answers
          </Button>
        </Card>

        <div className="space-y-5 lg:sticky lg:top-24">
          {!ran ? (
            <Card className="py-16 text-center">
              <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-primary/60" />
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                Your scores and red flags appear here, with the exact words that
                cause each problem quoted back to you.
              </p>
            </Card>
          ) : (
            <>
              <Card>
                <div className="mb-5 flex items-center gap-5">
                  <Donut total={coreScore} />
                  <div>
                    <h3 className="text-lg font-bold">
                      {coreScore >= 80
                        ? "Partner-ready"
                        : coreScore >= 60
                        ? "Strong, with gaps"
                        : coreScore >= 40
                        ? "Needs sharpening"
                        : "Not ready to submit"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {filled}/4 core answers checked
                    </p>
                  </div>
                </div>
                <ScoreBar label="Clarity" value={audit.clarity} />
                <ScoreBar label="Evidence" value={audit.evidence} />
                <ScoreBar label="Insight" value={audit.insight} />
                <ScoreBar label="Ambition" value={audit.ambition} />
              </Card>

              {audit.crossFindings.length > 0 && (
                <Card>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Across your answers
                  </h3>
                  <div className="space-y-2">
                    {audit.crossFindings.map((f, i) => (
                      <FindingCard key={i} f={f} />
                    ))}
                  </div>
                </Card>
              )}

              {coreAudits.map((a) => (
                <Card key={a.question.id}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold">
                      {a.question.label.length > 60
                        ? a.question.label.slice(0, 60) + "…"
                        : a.question.label}
                    </h3>
                    <span className="shrink-0 text-xs font-bold text-muted-foreground">
                      {a.score.toFixed(1)}/10
                    </span>
                  </div>
                  {a.findings.length === 0 ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      No problems found in this answer.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {a.findings.map((f, i) => (
                        <FindingCard key={i} f={f} />
                      ))}
                    </div>
                  )}
                </Card>
              ))}

              <Card className="bg-accent/40">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  This checks 4 of the 26 questions YC asks. The full app
                  checks all of them, cross-references your numbers, and drills
                  the interview.
                </p>
                <Button asChild className="mt-3 rounded-xl">
                  <a href="#/app">
                    Open the full app <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
              </Card>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
