import { useState } from "react";
import {
  rewriteAnswer,
  brainstormFor,
  oneLinerIdeas,
  BRAINSTORMABLE,
} from "@/lib/rewrite";
import type { AppData } from "@/lib/application";
import { Button } from "@/components/ui/button";
import { Check, Lightbulb, Wand2 } from "lucide-react";

export function Coach({
  questionId,
  value,
  data,
  onApply,
}: {
  questionId: string;
  value: string;
  data: AppData;
  onApply: (next: string) => void;
}) {
  const [tab, setTab] = useState<"none" | "rewrite" | "brainstorm">("none");
  const [applied, setApplied] = useState(false);

  const canBrainstorm = BRAINSTORMABLE.includes(questionId);
  const rewrite = tab === "rewrite" ? rewriteAnswer(questionId, value) : null;
  const pack = tab === "brainstorm" ? brainstormFor(questionId, data) : null;
  const ideas =
    tab === "brainstorm" && questionId === "one_liner"
      ? oneLinerIdeas(data)
      : [];

  return (
    <div className="pt-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setTab(tab === "rewrite" ? "none" : "rewrite");
            setApplied(false);
          }}
          disabled={!value.trim()}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-40"
        >
          <Wand2 className="h-3.5 w-3.5" /> Tighten this
        </button>
        {canBrainstorm && (
          <button
            type="button"
            onClick={() => setTab(tab === "brainstorm" ? "none" : "brainstorm")}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <Lightbulb className="h-3.5 w-3.5" /> Stuck? Brainstorm
          </button>
        )}
      </div>

      {rewrite && (
        <div className="mt-3 rounded-xl border border-border bg-background p-4">
          {!rewrite.changed ? (
            <p className="text-sm text-muted-foreground">
              Nothing to tighten. This answer is already free of filler,
              hedging, and hype.
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Suggested rewrite
              </p>
              <p className="whitespace-pre-wrap rounded-lg bg-card p-3 text-sm leading-relaxed">
                {rewrite.after}
              </p>
              <ul className="mt-3 space-y-1.5">
                {rewrite.steps.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    <b className="text-foreground">{s.label}.</b> {s.detail}
                  </li>
                ))}
              </ul>
              {rewrite.placeholders > 0 && (
                <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  {rewrite.placeholders} bracket
                  {rewrite.placeholders === 1 ? "" : "s"} mark where a real
                  fact belongs. Only you know those, so they are left for you
                  rather than invented.
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  className="rounded-lg"
                  onClick={() => {
                    onApply(rewrite.after);
                    setApplied(true);
                  }}
                >
                  Use this rewrite
                </Button>
                {applied && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Applied
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {pack && (
        <div className="mt-3 rounded-xl border border-border bg-background p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            An outline that works
          </p>
          <ol className="mb-4 space-y-1">
            {pack.outline.map((o, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                <b className="text-foreground">{i + 1}.</b> {o}
              </li>
            ))}
          </ol>

          {ideas.length > 0 && (
            <>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Built from your own description
              </p>
              <div className="mb-4 space-y-1.5">
                {ideas.map((idea, i) => (
                  <button
                    key={i}
                    onClick={() => onApply(idea.text)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary"
                  >
                    <span className="text-sm font-medium">{idea.text}</span>
                    <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
                      {idea.text.length}ch · {idea.shape}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                These are starting shapes assembled from words you already
                wrote, not finished pitches. Click one to use it, then make it
                yours.
              </p>
            </>
          )}

          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Questions to answer out loud
          </p>
          <div className="space-y-2.5">
            {pack.prompts.map((p, i) => (
              <div key={i}>
                <p className="text-sm font-medium">{p.q}</p>
                <p className="text-xs text-muted-foreground">{p.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
