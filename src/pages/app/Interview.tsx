import { useMemo, useState } from "react";
import { loadApp, updateApp } from "@/lib/application";
import {
  CATEGORIES,
  QUESTION_BANK,
  questionsInCat,
  masteryPct,
  RATING_LABELS,
  type CatId,
  type InterviewQ,
} from "@/lib/interview";
import { Card } from "@/components/app/shared";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw } from "lucide-react";

function pick(qs: InterviewQ[], excludeId?: string): InterviewQ {
  const pool = qs.length > 1 ? qs.filter((q) => q.id !== excludeId) : qs;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function Interview() {
  const [data, setData] = useState(loadApp);
  const [cat, setCat] = useState<CatId | "all">("all");
  const [current, setCurrent] = useState<InterviewQ>(() =>
    pick(QUESTION_BANK)
  );
  const [revealed, setRevealed] = useState(false);

  const pool = useMemo(() => questionsInCat(cat), [cat]);

  const next = (fromCat?: CatId | "all") => {
    setCurrent(pick(questionsInCat(fromCat ?? cat), current.id));
    setRevealed(false);
  };

  const rate = (rating: number) => {
    setData(
      updateApp((d) => {
        const m = d.interview[current.cat] ?? { reps: 0, sum: 0 };
        m.reps += 1;
        m.sum += rating;
        d.interview[current.cat] = m;
      })
    );
    next();
  };

  const totalReps = Object.values(data.interview).reduce(
    (s, m) => s + m.reps,
    0
  );

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Interview prep</h1>
        <p className="mt-1 text-muted-foreground">
          The YC interview is 10 minutes of rapid-fire questions. Drill by
          topic, answer out loud in under 30 seconds, then rate yourself
          honestly. Mastery tracks your own ratings per topic.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {/* category filter */}
          <div className="mb-4 flex flex-wrap gap-2">
            {(["all", ...CATEGORIES.map((c) => c.id)] as (CatId | "all")[]).map(
              (id) => (
                <button
                  key={id}
                  onClick={() => {
                    setCat(id);
                    next(id);
                  }}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    cat === id
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {id === "all"
                    ? "All topics"
                    : CATEGORIES.find((c) => c.id === id)!.title}
                </button>
              )
            )}
          </div>

          {/* drill card */}
          <Card className="md:p-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
              {CATEGORIES.find((c) => c.id === current.cat)!.title}
            </p>
            <h2 className="text-2xl font-bold leading-snug">{current.q}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Answer out loud. Aim for under 30 seconds, leading with your
              strongest specific.
            </p>

            {revealed ? (
              <div className="mt-5 rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-muted-foreground">
                <b className="text-foreground">What they're really probing: </b>
                {current.probe}
              </div>
            ) : (
              <Button
                variant="outline"
                className="mt-5 rounded-xl"
                onClick={() => setRevealed(true)}
              >
                <Eye className="mr-1.5 h-4 w-4" /> Reveal what they're probing
              </Button>
            )}

            <div className="mt-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                How did that rep go?
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RATING_LABELS.map((label, i) => (
                  <button
                    key={label}
                    onClick={() => rate(i + 1)}
                    className="rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => next()}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Skip without rating
              </button>
            </div>
          </Card>

          <p className="mt-3 text-xs text-muted-foreground">
            {pool.length} questions in this topic pool. These are the kinds of
            questions partners are widely reported to ask; the exact interview
            varies.
          </p>
        </div>

        {/* mastery sidebar */}
        <Card>
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Mastery by topic
          </p>
          <div className="space-y-4">
            {CATEGORIES.map((c) => {
              const m = data.interview[c.id];
              const pct = masteryPct(m);
              return (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold">{c.title}</span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {pct === null ? "no reps yet" : `${pct}% · ${m!.reps} reps`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
            <b className="text-foreground">{totalReps}</b> total reps. Mastery
            is your own honest self-rating; it improves when your answers do.
          </div>
        </Card>
      </div>
    </div>
  );
}
