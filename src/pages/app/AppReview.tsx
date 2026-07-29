import { useEffect, useMemo, useState } from "react";
import { loadApp, updateApp, QUESTIONS } from "@/lib/application";
import { auditApplication, type FullAudit, type Finding } from "@/lib/analyzer";
import { narrativeCheck } from "@/lib/rewrite";
import { Card, Donut, ScoreBar } from "@/components/app/shared";
import { Button } from "@/components/ui/button";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { ShareResult } from "@/components/app/ShareResult";
import { reportUrl } from "@/lib/feedback";

const SEV_STYLES: Record<string, string> = {
  red: "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
  amber: "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
  green: "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
};
const SEV_ICONS: Record<string, string> = { red: "🚩", amber: "⚠️", green: "✅" };

function FindingCard({
  f,
  href,
  questionLabel,
}: {
  f: Finding;
  href?: string;
  questionLabel?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-3 text-sm leading-relaxed ${SEV_STYLES[f.sev]}`}
    >
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
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            {href && (
              <a href={href} className="text-xs font-semibold text-primary underline">
                Fix this answer
              </a>
            )}
            {f.sev !== "green" && (
              <a
                href={reportUrl({ title: f.title, questionLabel })}
                target="_blank"
                rel="noopener noreferrer"
                title="Opens a prefilled GitHub issue. It carries the finding, never your answer."
                className="text-xs text-muted-foreground underline decoration-dotted hover:text-foreground"
              >
                This flag is wrong
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppReview() {
  const [data] = useState(loadApp);
  const [audit, setAudit] = useState<FullAudit | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const answered = QUESTIONS.filter((q) =>
    (data.answers[q.id] ?? "").trim()
  ).length;
  const narrative = useMemo(() => narrativeCheck(data), [data]);

  // Run the complete check immediately: no key, no setup, no waiting.
  useEffect(() => {
    const result = auditApplication(data);
    setAudit(result);
    updateApp((d) => {
      d.strength = result.total;
      d.strengthAt = new Date().toISOString();
    });
  }, [data]);



  if (!audit) return null;

  if (answered === 0) {
    return (
      <div>
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Full check</h1>
          <p className="mt-1 text-muted-foreground">
            Every answer in your application, checked automatically.
          </p>
        </header>
        <Card className="py-16 text-center">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-primary/60" />
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            Nothing to check yet. Answer some questions on the Application tab
            and your full check runs here automatically, with no key or setup.
          </p>
          <Button asChild className="mt-5 rounded-xl">
            <a href="#/app/application">Start your application</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Full check</h1>
        <p className="mt-1 text-muted-foreground">
          Every one of your {answered} answers checked against what that
          question is really asking, plus contradictions across the whole
          application. No API key, no sign-up, nothing uploaded unless you ask.
        </p>
      </header>

      {/* headline */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-6">
          <Donut total={audit.total} />
          <div className="min-w-52 flex-1">
            <h2 className="text-xl font-bold">{audit.verdictTitle}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {audit.verdictBody}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
              <span className="text-red-600 dark:text-red-400">
                {audit.reds} red {audit.reds === 1 ? "flag" : "flags"}
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                {audit.ambers} to tighten
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {audit.greens} working well
              </span>
              <span className="text-muted-foreground">
                {audit.coverage}% of questions answered
              </span>
            </div>
          </div>
          <div className="w-full max-w-xs">
            <ScoreBar label="Clarity" value={audit.clarity} />
            <ScoreBar label="Evidence" value={audit.evidence} />
            <ScoreBar label="Insight" value={audit.insight} />
            <ScoreBar label="Ambition" value={audit.ambition} />
          </div>
        </div>
      </Card>

      {audit.coverage > 0 && <ShareResult audit={audit} />}

      {/* priorities */}
      {audit.priorities.length > 0 && (
        <Card className="mb-5">
          <h2 className="mb-1 text-lg font-bold">Fix these first</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            The highest-impact problems in your application, worst first.
          </p>
          <div className="space-y-2.5">
            {audit.priorities.map((p, i) => (
              <div key={i}>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                  {p.label.length > 80 ? p.label.slice(0, 80) + "…" : p.label}
                </p>
                <FindingCard
                  f={p.finding}
                  questionLabel={p.label}
                  href={
                    p.questionId
                      ? `#/app/application?focus=${p.questionId}`
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* narrative */}
      {(narrative.spike || narrative.notes.length > 0) && (
        <Card className="mb-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Your story</h2>
              <p className="text-sm text-muted-foreground">
                What a partner remembers after closing the tab.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${narrative.threadStrength}%` }}
                />
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {narrative.threadStrength}% thread
              </span>
            </div>
          </div>
          <div className="space-y-2.5">
            {narrative.notes.map((n, i) => (
              <FindingCard key={i} f={n as Finding} />
            ))}
          </div>
        </Card>
      )}

      {/* cross-application */}
      {audit.crossFindings.length > 0 && (
        <Card className="mb-5">
          <h2 className="mb-1 text-lg font-bold">Across the whole application</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Partners read your answers against each other, and against your
            video. These are the places yours disagree.
          </p>
          <div className="space-y-2.5">
            {audit.crossFindings.map((f, i) => (
              <FindingCard key={i} f={f} />
            ))}
          </div>
        </Card>
      )}

      {/* per-section detail */}
      <div className="mb-5 space-y-3">
        {audit.sections.map((s) => {
          const open = openSections[s.id] ?? false;
          const withFindings = s.audits.filter(
            (a) => a.answered && a.findings.length > 0
          );
          return (
            <Card key={s.id} className="p-0">
              <button
                onClick={() =>
                  setOpenSections((o) => ({ ...o, [s.id]: !open }))
                }
                className="flex w-full items-center justify-between gap-3 p-5 text-left"
              >
                <div>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {s.answered}/{s.total} answered
                    {withFindings.length > 0 &&
                      ` · ${withFindings.length} answer${withFindings.length === 1 ? "" : "s"} with notes`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold">
                    {s.score.toFixed(1)}
                    <span className="text-xs font-semibold text-muted-foreground">
                      /10
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
              {open && (
                <div className="space-y-4 border-t border-border p-5">
                  {s.audits.map((a) => (
                    <div key={a.question.id}>
                      <div className="mb-1.5 flex items-start justify-between gap-3">
                        <a
                          href={`#/app/application?focus=${a.question.id}`}
                          className="text-xs font-semibold text-primary underline"
                        >
                          {a.question.label.length > 75
                            ? a.question.label.slice(0, 75) + "…"
                            : a.question.label}
                        </a>
                        <span className="shrink-0 text-xs font-bold text-muted-foreground">
                          {a.answered ? `${a.score.toFixed(1)}/10` : "blank"}
                        </span>
                      </div>
                      {!a.answered ? (
                        <p className="text-xs text-muted-foreground">
                          Not answered yet.
                        </p>
                      ) : a.findings.length === 0 ? (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          No problems found in this answer.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {a.findings.map((f, i) => (
                            <FindingCard key={i} f={f} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

    </div>
  );
}
