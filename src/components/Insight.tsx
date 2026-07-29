import { GitCompareArrows, Quote, WifiOff } from "lucide-react";

const POINTS = [
  {
    icon: GitCompareArrows,
    title: "It reads your answers against each other",
    body: "Most feedback judges one answer at a time, which is exactly how the worst mistakes survive. Batchize catches a user count in one answer that contradicts another, revenue claimed where you said you have no users, a launch date that doesn't match how long you say you've been building, and a sentence pasted into two answers. A partner cross-references. So does this.",
  },
  {
    icon: Quote,
    title: "It quotes the words that cost you",
    body: "Generic advice is easy to nod at and impossible to act on. Every finding here points at the exact phrase that triggered it and says what belongs there instead. When it suggests a rewrite, it uses only words you already wrote, and leaves a bracket wherever a fact is missing rather than inventing one.",
  },
  {
    icon: WifiOff,
    title: "It does not depend on a server",
    body: "The whole engine runs in your browser. That means no account, no key, no bill and no rate limit, and nothing you write is uploaded anywhere unless you create an account and press Upload. That includes the thing you are least likely to want sitting on someone else's server: the honest version of your traction.",
  },
];

export function Insight() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-24 md:px-6">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="mb-3 text-sm font-medium text-primary">Why it catches more</p>
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
          The mistakes that sink applications are invisible one answer at a time
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Partners skim thousands of applications and check them against
          themselves. Reading your own answers one by one is precisely the way
          to miss what they will notice first.
        </p>
      </div>

      <div className="space-y-5">
        {POINTS.map((p) => (
          <div
            key={p.title}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-start"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <p.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="mb-1.5 text-lg font-semibold">{p.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {p.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <a
        href={`${import.meta.env.BASE_URL}questions/`}
        className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-accent/40 p-6 transition-colors hover:bg-accent sm:flex-row"
      >
        <span>
          <span className="block font-semibold">
            All 26 questions, and what each one is really asking
          </span>
          <span className="block text-sm text-muted-foreground">
            What a strong answer contains, question by question. Free to read,
            nothing to sign up for.
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-primary">Read it →</span>
      </a>

      <a
        href={`${import.meta.env.BASE_URL}red-flags/`}
        className="mt-3 flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-accent/40 p-6 transition-colors hover:bg-accent sm:flex-row"
      >
        <span>
          <span className="block font-semibold">
            Every red flag it looks for, written out
          </span>
          <span className="block text-sm text-muted-foreground">
            Generated from the checker itself, so it is what actually runs
            rather than a description of it.
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-primary">Read it →</span>
      </a>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Also free to read:{" "}
        <a
          className="font-semibold text-primary hover:underline"
          href={`${import.meta.env.BASE_URL}example/`}
        >
          a worked example of strong answers
        </a>{" "}
        and{" "}
        <a
          className="font-semibold text-primary hover:underline"
          href={`${import.meta.env.BASE_URL}interview-questions/`}
        >
          the interview questions that come next
        </a>
        . Two instant tools need no application at all: the{" "}
        <a
          className="font-semibold text-primary hover:underline"
          href={`${import.meta.env.BASE_URL}one-liner-tester/`}
        >
          one-liner tester
        </a>{" "}
        and the{" "}
        <a
          className="font-semibold text-primary hover:underline"
          href={`${import.meta.env.BASE_URL}safe-calculator/`}
        >
          SAFE dilution calculator
        </a>
        .
      </p>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
        The checks are tuned against a labelled corpus of realistic answers and
        measured on both what they catch and what they wrongly flag, because a
        checker that cries wolf sends you off fixing things that were already
        fine. The corpus ships in the repository.
      </p>
    </section>
  );
}
