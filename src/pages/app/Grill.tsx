import { useMemo, useState } from "react";
import { ChevronDown, Flame } from "lucide-react";
import { buildGrill, summariseGrill } from "@/lib/grill";
import { loadApp } from "@/lib/application";
import { ProGate } from "@/components/app/ProGate";
import { PRO_FEATURES } from "@/lib/pro";

const feature = PRO_FEATURES.find((f) => f.id === "grill")!;

function GrillInner() {
  const questions = useMemo(() => buildGrill(loadApp()), []);
  const summary = useMemo(() => summariseGrill(questions), [questions]);
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Partner grill</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {summary.fromYourApplication > 0 ? (
            <>
              {summary.fromYourApplication} of these came out of your own
              answers, hardest first. Say each one out loud before you look at
              what it is testing. If you hesitate, the fix is in the answer it
              came from, not in the practice.
            </>
          ) : (
            <>
              Your application left nothing obvious to attack, so what is left
              is what nearly every founder gets asked. Say each one out loud
              before you look at what it is testing.
            </>
          )}
        </p>
      </header>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-start gap-3 p-5 text-left transition-colors hover:bg-accent/40"
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  q.weight >= 8
                    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                    : q.weight >= 5
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {q.weight >= 8 ? <Flame className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{q.ask}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  From: {q.sourceLabel}
                </span>
              </span>
              <ChevronDown
                className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                  open === i ? "rotate-180" : ""
                }`}
              />
            </button>
            {open === i && (
              <div className="space-y-3 border-t border-border p-5 pt-4">
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    What they are testing
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {q.probing}
                  </p>
                </div>
                {q.evidence && (
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      What invited it
                    </p>
                    <p className="rounded-lg bg-muted/60 p-3 text-sm italic leading-relaxed">
                      “{q.evidence}”
                    </p>
                  </div>
                )}
                {q.sourceQuestionId && (
                  <a
                    href={`#/app/application?q=${q.sourceQuestionId}`}
                    className="inline-block text-sm font-semibold text-primary hover:underline"
                  >
                    Go fix the answer this came from →
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Grill() {
  return (
    <ProGate name={feature.name} blurb={feature.blurb} why={feature.why}>
      <GrillInner />
    </ProGate>
  );
}
