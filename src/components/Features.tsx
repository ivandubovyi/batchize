import {
  BookOpen,
  MessageCircle,
  ClipboardList,
  Gauge,
  Mic,
  SearchCheck,
  Wand2,
  Wrench,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Quick score in a minute",
    href: "#/app/quick",
    body: "Not ready to write essays? Answer eleven short questions, mostly numbers and yes/no, and get a score, a breakdown of what is helping, and the single highest-leverage thing to fix. Your answers can seed the full application.",
  },
  {
    icon: ClipboardList,
    title: "Application workspace",
    body: "The real YC application questions in one place, auto-saved locally, with what each question is actually asking and live red-flag checks as you type.",
  },
  {
    icon: SearchCheck,
    title: "Full check, no key needed",
    body: "Every answer checked against what that question is really asking, with the exact words that cause each problem quoted back to you, plus contradictions across the whole application. Runs instantly with no API key or sign-up.",
  },
  {
    icon: Wand2,
    title: "Tighten and brainstorm",
    body: "Stuck on a blank answer? Get an outline and questions to answer out loud. Written something bloated? One click cuts the filler and hedging and shows every edit it made, using only your own words.",
  },
  {
    icon: BookOpen,
    title: "Story and spike",
    body: "Checks whether your founder story actually connects to the product you're building, and names the single strongest card in your application so you can lead with it everywhere.",
  },
  {
    icon: Mic,
    title: "Interview prep",
    body: "Drill rapid-fire questions by topic (traction, product, market, team), see what each question is really probing, and track your mastery per topic rep by rep.",
  },
  {
    icon: Gauge,
    title: "Chancing & accelerator list",
    body: "A transparent readiness score from the factors partners weigh, plus a balanced reach/target list of real accelerators. Labeled honestly: a heuristic, not a prediction.",
  },
  {
    icon: MessageCircle,
    title: "Batchize Partner",
    body: "A coach that has read your saved application and answers with specifics from it: what your weakest answer is, what to fix first, how to tighten a specific answer, what partners will push on. Free and instant, with no account or key required.",
  },
  {
    icon: Wrench,
    title: "Founder tools",
    body: "SAFE dilution math, runway, equity split sanity checks, and a one-liner tester. The numbers your interview will ask about, computed locally.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-24 md:px-6">
      <div className="mx-auto mb-16 max-w-2xl text-center">
        <p className="mb-3 text-sm font-medium text-primary">Features</p>
        <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
          Your whole application, in one place
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Write it, pressure-test it, drill the interview, and know your odds.
          Everything saves locally in your browser.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <a
            href={(f as { href?: string }).href ?? "#/app"}
            key={f.title}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {f.body}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
