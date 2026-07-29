import { useState } from "react";
import {
  loadApp,
  updateApp,
  answeredCount,
  firstUnanswered,
  QUESTIONS,
  SECTIONS,
  questionsFor,
} from "@/lib/application";
import { CATEGORIES, masteryPct } from "@/lib/interview";
import { Card, Donut } from "@/components/app/shared";
import { DataControls } from "@/components/app/DataControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

export function Dashboard() {
  const [data, setData] = useState(loadApp);
  const reload = () => setData(loadApp());
  const answered = answeredCount(data);
  const next = firstUnanswered(data);
  const pct = Math.round((answered / QUESTIONS.length) * 100);

  const daysLeft = data.deadline
    ? Math.ceil(
        (new Date(data.deadline + "T23:59:59").getTime() - Date.now()) /
          86400000
      )
    : null;

  const drilled = Object.values(data.interview).reduce(
    (s, m) => s + m.reps,
    0
  );

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Your application journey
        </h1>
        <p className="mt-1 text-muted-foreground">
          Everything is saved in this browser as you type. Nothing is uploaded.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* progress */}
        <Card>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Application
          </p>
          <div className="flex items-center gap-4">
            <Donut total={pct} label="Complete" size={88} />
            <div className="text-sm text-muted-foreground">
              <b className="text-foreground">
                {answered}/{QUESTIONS.length}
              </b>{" "}
              questions answered
            </div>
          </div>
        </Card>

        {/* strength */}
        <Card>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Strength
          </p>
          {data.strength !== undefined ? (
            <div className="flex items-center gap-4">
              <Donut total={data.strength} size={88} />
              <div className="text-sm text-muted-foreground">
                from your last whole-application review
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No review yet.{" "}
              <a href="#/app/review" className="font-semibold text-primary underline">
                Run one
              </a>{" "}
              to get your score.
            </div>
          )}
        </Card>

        {/* deadline */}
        <Card>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Batch deadline
          </p>
          {daysLeft !== null ? (
            <div>
              <div className="text-3xl font-extrabold">
                {daysLeft >= 0 ? daysLeft : 0}
                <span className="ml-1 text-sm font-semibold text-muted-foreground">
                  days left
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {daysLeft < 0 ? "This deadline has passed." : data.deadline}
              </p>
            </div>
          ) : (
            <p className="mb-2 text-xs text-muted-foreground">
              Set your target deadline from{" "}
              <a
                href="https://www.ycombinator.com/apply"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-primary"
              >
                ycombinator.com/apply
              </a>
              :
            </p>
          )}
          <Input
            type="date"
            aria-label="Target batch deadline"
            className="mt-2"
            value={data.deadline ?? ""}
            onChange={(e) =>
              setData(updateApp((d) => (d.deadline = e.target.value || undefined)))
            }
          />
        </Card>

        {/* interview */}
        <Card>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Interview prep
          </p>
          <div className="text-3xl font-extrabold">
            {drilled}
            <span className="ml-1 text-sm font-semibold text-muted-foreground">
              questions drilled
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {CATEGORIES.slice(0, 3).map((c) => {
              const m = masteryPct(data.interview[c.id]);
              return (
                <div key={c.id} className="flex items-center gap-2 text-xs">
                  <span className="w-24 shrink-0 text-muted-foreground">
                    {c.title}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${m ?? 0}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-semibold">
                    {m === null ? "–" : `${m}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* quick score entry */}
      {answered < 5 && (
        <Card className="mt-5 border-primary/40 bg-accent/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold">Short on time?</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Answer eleven short questions instead and get a score in about
                a minute. You can send those answers straight into this
                application afterwards.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-xl">
              <a href="#/app/quick">
                Get a quick score <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </Card>
      )}

      {/* jump back in */}
      <Card className="mt-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Jump back in
        </p>
        {next ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{next.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{next.tip}</p>
            </div>
            <Button asChild className="rounded-xl">
              <a href={`#/app/application?focus=${next.id}`}>
                Answer it <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Every question is answered. Run a whole-application review, then drill the
              interview.
            </p>
            <Button asChild className="rounded-xl">
              <a href="#/app/review">
                Review it all <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
      </Card>

      <DataControls onChanged={reload} />

      {/* sections overview */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => {
          const qs = questionsFor(s.id);
          const done = qs.filter((q) => (data.answers[q.id] ?? "").trim()).length;
          return (
            <a
              key={s.id}
              href={`#/app/application?section=${s.id}`}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-semibold">{s.title}</h3>
                <span className="text-xs font-bold text-muted-foreground">
                  {done}/{qs.length}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {s.blurb}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(done / qs.length) * 100}%` }}
                />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
