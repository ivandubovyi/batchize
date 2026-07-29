import { useState } from "react";
import { loadApp, updateApp } from "@/lib/application";
import { Card, Donut } from "@/components/app/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";

interface Factor {
  id: string;
  label: string;
  kind: "bool" | "number";
  hint: string;
  max: number;
  score: (v: string) => number;
}

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const FACTORS: Factor[] = [
  {
    id: "launched",
    label: "Launched to real users?",
    kind: "bool",
    hint: "Anything real people can use today counts.",
    max: 20,
    score: (v) => (v === "yes" ? 20 : 0),
  },
  {
    id: "growth",
    label: "Weekly growth (%)",
    kind: "number",
    hint: "Of your primary metric, week over week.",
    max: 15,
    score: (v) => (num(v) >= 10 ? 15 : num(v) >= 5 ? 10 : num(v) > 0 ? 5 : 0),
  },
  {
    id: "paying",
    label: "Paying customers",
    kind: "number",
    hint: "People or teams that pay real money.",
    max: 15,
    score: (v) => (num(v) >= 10 ? 15 : num(v) >= 1 ? 10 : 0),
  },
  {
    id: "fulltime",
    label: "Working on it full-time?",
    kind: "bool",
    hint: "At least one founder, right now.",
    max: 15,
    score: (v) => (v === "yes" ? 15 : 0),
  },
  {
    id: "technical",
    label: "Technical founder on the team?",
    kind: "bool",
    hint: "A founder builds the product themselves.",
    max: 15,
    score: (v) => (v === "yes" ? 15 : 0),
  },
  {
    id: "domain",
    label: "Years of domain experience",
    kind: "number",
    hint: "Living the problem you're solving.",
    max: 10,
    score: (v) => (num(v) >= 3 ? 10 : num(v) >= 1 ? 5 : 0),
  },
  {
    id: "talked",
    label: "Users you've talked to",
    kind: "number",
    hint: "Real conversations, not surveys.",
    max: 10,
    score: (v) => (num(v) >= 20 ? 10 : num(v) >= 5 ? 5 : 0),
  },
];

// Real programs with their official sites. Selectivity notes are qualitative
// on purpose: we don't publish acceptance-rate numbers we can't verify.
const ACCELERATORS = [
  { name: "Y Combinator", url: "https://www.ycombinator.com", note: "The most selective and best-known accelerator. A reach for every applicant, by design.", tier: 3 },
  { name: "HF0", url: "https://www.hf0.com", note: "Live-in residency aimed at repeat and deeply technical founders.", tier: 3 },
  { name: "Neo", url: "https://neo.com", note: "Small, selective accelerator and community for standout technologists.", tier: 3 },
  { name: "PearX", url: "https://pear.vc", note: "Small-batch accelerator run by Pear VC.", tier: 2 },
  { name: "Entrepreneur First", url: "https://www.joinef.com", note: "Talent-first: you can join pre-idea and meet a cofounder there.", tier: 2 },
  { name: "Techstars", url: "https://www.techstars.com", note: "Global network of mentorship-driven programs across cities and verticals.", tier: 1 },
  { name: "500 Global", url: "https://500.co", note: "Large global early-stage program and fund.", tier: 1 },
  { name: "South Park Commons", url: "https://www.southparkcommons.com", note: "Community and fund for the minus-one-to-zero stage, before the idea is fixed.", tier: 1 },
];

export function Chancing() {
  const [data, setData] = useState(loadApp);
  const v = (id: string) => data.chancing[id] ?? "";
  const set = (id: string, value: string) =>
    setData(updateApp((d) => (d.chancing[id] = value)));

  const readiness = FACTORS.reduce((s, f) => s + f.score(v(f.id)), 0);

  const bucket = (tier: number): { label: string; cls: string } => {
    // Tier 3 programs are a reach for everyone; below that, your readiness
    // shifts what's realistic to anchor a batch application list around.
    if (tier === 3) return { label: "Reach", cls: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" };
    if (tier === 2)
      return readiness >= 55
        ? { label: "Target", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" }
        : { label: "Reach", cls: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" };
    return readiness >= 40
      ? { label: "Target", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" }
      : { label: "Worth a look", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" };
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Chancing</h1>
        <p className="mt-1 text-muted-foreground">
          A transparent readiness score from the factors partners actually
          weigh, plus a balanced accelerator list. This is a heuristic from
          what you enter below. It is not admissions data and predicts
          nothing.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="md:p-8">
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Your profile
          </p>
          <div className="space-y-5">
            {FACTORS.map((f) => (
              <div key={f.id} className="grid items-center gap-2 sm:grid-cols-[1fr_180px]">
                <div>
                  <Label>{f.label}</Label>
                  <p className="text-xs text-muted-foreground">{f.hint}</p>
                </div>
                {f.kind === "bool" ? (
                  <div className="grid grid-cols-2 gap-2">
                    {["yes", "no"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => set(f.id, opt)}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition-colors ${
                          v(f.id) === opt
                            ? "border-primary bg-accent text-accent-foreground"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <Input
                    type="number"
                    min={0}
                    value={v(f.id)}
                    onChange={(e) => set(f.id, e.target.value)}
                    placeholder="0"
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Readiness
            </p>
            <div className="flex items-center gap-5">
              <Donut total={readiness} label="Readiness" />
              <div className="flex-1 space-y-1.5">
                {FACTORS.map((f) => {
                  const s = f.score(v(f.id));
                  return (
                    <div key={f.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className={`font-bold ${s === f.max ? "text-emerald-600" : s > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {s}/{f.max}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
              The lowest-scoring factor is usually the highest-leverage thing
              to fix before you submit.
            </p>
          </Card>

          <Card>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Your accelerator list
            </p>
            <div className="space-y-3">
              {ACCELERATORS.map((a) => {
                const b = bucket(a.tier);
                return (
                  <div key={a.name} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm font-bold hover:text-primary"
                      >
                        {a.name} <ExternalLink className="h-3 w-3" />
                      </a>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${b.cls}`}>
                        {b.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {a.note}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              Labels shift with your readiness score above. Apply to reaches
              anyway; the application itself makes your company better.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
