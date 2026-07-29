// Shortened application: ten short questions that produce a score in about a
// minute, without writing a single essay. Same engine underneath as the full
// check, so the two agree with each other.

import { QUESTIONS } from "./application";
import { auditAnswer, type Finding } from "./analyzer";
import { verdictForTotal } from "./reviewer";

export type FieldKind = "text" | "oneliner" | "number" | "yesno";

export interface QuickField {
  id: string;
  label: string;
  hint: string;
  kind: FieldKind;
  placeholder?: string;
  /** Question in the full application this maps to, for the import button. */
  mapsTo?: string;
}

export const QUICK_FIELDS: QuickField[] = [
  {
    id: "one_liner",
    label: "What does your company do?",
    hint: "50 characters max, the way you'd say it to a friend.",
    kind: "oneliner",
    placeholder: "Stripe for freight invoices",
    mapsTo: "one_liner",
  },
  {
    id: "launched",
    label: "Have you launched?",
    hint: "Anything real people can use today counts.",
    kind: "yesno",
  },
  {
    id: "users",
    label: "How many people use it?",
    hint: "Active users, not signups or waitlist.",
    kind: "number",
    placeholder: "0",
  },
  {
    id: "paying",
    label: "How many pay you?",
    hint: "People or teams paying real money.",
    kind: "number",
    placeholder: "0",
  },
  {
    id: "revenue",
    label: "Monthly revenue ($)",
    hint: "MRR today. Zero is a fine answer.",
    kind: "number",
    placeholder: "0",
  },
  {
    id: "growth",
    label: "Weekly growth (%)",
    hint: "Of your main metric, week over week.",
    kind: "number",
    placeholder: "0",
  },
  {
    id: "weeks",
    label: "How many weeks have you been working on it?",
    hint: "Partners divide your progress by this.",
    kind: "number",
    placeholder: "0",
  },
  {
    id: "fulltime",
    label: "Is anyone full-time?",
    hint: "At least one founder, right now.",
    kind: "yesno",
  },
  {
    id: "technical",
    label: "Does a founder build the product?",
    hint: "Not an agency or a contractor.",
    kind: "yesno",
  },
  {
    id: "why",
    label: "Why you? One sentence.",
    hint: "What you saw or lived that others haven't.",
    kind: "text",
    placeholder: "I ran ops at a 40-truck carrier and chased invoices every Friday.",
    mapsTo: "why_idea",
  },
  {
    id: "competitor",
    label: "What do people use instead today?",
    hint: "Name it, even if it's a spreadsheet.",
    kind: "text",
    placeholder: "TriumphPay, or Excel plus email threads.",
    mapsTo: "competitors",
  },
];

export type QuickAnswers = Record<string, string>;

export interface ScoreLine {
  label: string;
  points: number;
  max: number;
  note: string;
  good: boolean;
}

export interface QuickResult {
  total: number;
  verdictTitle: string;
  verdictBody: string;
  traction: ScoreLine[];
  team: ScoreLine[];
  writing: ScoreLine[];
  findings: Finding[];
  answeredCount: number;
  /** The single highest-leverage thing to change next. */
  nextMove: string;
}

const num = (v: string | undefined) => {
  const n = parseFloat((v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const yes = (v: string | undefined) => v === "yes";

export function scoreQuick(a: QuickAnswers): QuickResult {
  const users = num(a.users);
  const paying = num(a.paying);
  const revenue = num(a.revenue);
  const growth = num(a.growth);
  const weeks = num(a.weeks);

  // ---- Traction: 45 points ----
  const traction: ScoreLine[] = [];

  traction.push(
    yes(a.launched)
      ? { label: "Launched", points: 12, max: 12, note: "Real people can use it today.", good: true }
      : { label: "Launched", points: 0, max: 12, note: "Nothing beats shipping something people can touch.", good: false }
  );

  const usersPts = users >= 100 ? 10 : users >= 20 ? 7 : users >= 1 ? 4 : 0;
  traction.push({
    label: "Users",
    points: usersPts,
    max: 10,
    note:
      users === 0
        ? "No users yet. Ten people who come back weekly would change this answer."
        : `${users} using it.${users < 20 ? " Small is fine if they keep coming back." : ""}`,
    good: usersPts >= 7,
  });

  const payPts = paying >= 10 ? 10 : paying >= 1 ? 7 : 0;
  traction.push({
    label: "Paying customers",
    points: payPts,
    max: 10,
    note:
      paying === 0
        ? "Nobody pays yet. One paying customer is worth more than a hundred free ones here."
        : `${paying} paying. This is the hardest signal to fake, so lead with it.`,
    good: payPts >= 7,
  });

  const growthPts = growth >= 10 ? 8 : growth >= 5 ? 6 : growth > 0 ? 3 : 0;
  traction.push({
    label: "Weekly growth",
    points: growthPts,
    max: 8,
    note:
      growth === 0
        ? "No growth rate given. Partners care more about the rate than the level."
        : `${growth}% week over week.${growth >= 10 ? " That is the number to lead with." : ""}`,
    good: growthPts >= 6,
  });

  // Velocity: progress relative to how long you have been at it.
  const velocity = weeks > 0 ? (users + paying * 5) / weeks : 0;
  const velPts = velocity >= 5 ? 5 : velocity >= 1 ? 3 : weeks > 0 ? 1 : 0;
  traction.push({
    label: "Velocity",
    points: velPts,
    max: 5,
    note:
      weeks === 0
        ? "Say how long you have been at it so progress can be read in context."
        : velocity >= 5
        ? `Strong progress for ${weeks} weeks of work.`
        : `Modest progress for ${weeks} weeks. Partners divide everything by time.`,
    good: velPts >= 3,
  });

  // ---- Team: 25 points ----
  const team: ScoreLine[] = [
    yes(a.fulltime)
      ? { label: "Full-time", points: 13, max: 13, note: "Committed. This matters more than founders expect.", good: true }
      : { label: "Full-time", points: 0, max: 13, note: "Nobody full-time yet. Name the specific condition that changes it.", good: false },
    yes(a.technical)
      ? { label: "Founder builds it", points: 12, max: 12, note: "You can ship without waiting on anyone.", good: true }
      : { label: "Founder builds it", points: 0, max: 12, note: "Outsourced product is a serious flag. Partners want builders.", good: false },
  ];

  // ---- Writing: 30 points, judged by the same engine as the full check ----
  const findings: Finding[] = [];
  const writing: ScoreLine[] = [];
  const q = (id: string) => QUESTIONS.find((x) => x.id === id)!;

  const gradeText = (
    label: string,
    text: string,
    questionId: string,
    max: number
  ): ScoreLine => {
    const trimmed = (text ?? "").trim();
    if (!trimmed) {
      return { label, points: 0, max, note: "Left blank.", good: false };
    }
    // This form explicitly asks for one short sentence, so it would be unfair
    // to dock the same answer for being short.
    const relevant = auditAnswer(q(questionId), trimmed).findings.filter(
      (f) => !/^Only \d+ words/.test(f.title)
    );
    findings.push(...relevant);
    const reds = relevant.filter((f) => f.sev === "red").length;
    const ambers = relevant.filter((f) => f.sev === "amber").length;
    const pts = Math.max(0, Math.round(max - reds * (max / 2) - ambers * (max / 5)));
    return {
      label,
      points: pts,
      max,
      note:
        reds > 0
          ? relevant.find((f) => f.sev === "red")!.title
          : ambers > 0
          ? relevant.find((f) => f.sev === "amber")!.title
          : "Clean.",
      good: pts >= max * 0.7,
    };
  };

  writing.push(gradeText("One-liner", a.one_liner, "one_liner", 12));
  writing.push(gradeText("Why you", a.why, "why_idea", 9));
  writing.push(gradeText("Alternatives", a.competitor, "competitors", 9));

  const sum = (xs: ScoreLine[]) => xs.reduce((s, x) => s + x.points, 0);
  const total = Math.min(100, sum(traction) + sum(team) + sum(writing));
  const [verdictTitle, verdictBody] = verdictForTotal(total);

  const answeredCount = QUICK_FIELDS.filter((f) =>
    (a[f.id] ?? "").toString().trim()
  ).length;

  // Biggest single gap, by points left on the table.
  const all = [...traction, ...team, ...writing];
  const worst = all
    .filter((l) => l.points < l.max)
    .sort((x, y) => y.max - y.points - (x.max - x.points))[0];
  const nextMove = worst
    ? `${worst.label}: ${worst.note}`
    : "Nothing obvious left. Move to the full application and pressure-test every answer.";

  return {
    total,
    verdictTitle,
    verdictBody,
    traction,
    team,
    writing,
    findings,
    answeredCount,
    nextMove,
  };
}

/** Short answers that can seed the full application. */
export function quickToFullAnswers(a: QuickAnswers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of QUICK_FIELDS) {
    if (!f.mapsTo) continue;
    const v = (a[f.id] ?? "").trim();
    if (v) out[f.mapsTo] = v;
  }
  // Build a first draft of the traction answer from the numbers given.
  const bits: string[] = [];
  if (a.launched === "yes") {
    bits.push(
      num(a.weeks) > 0 ? `Launched, ${num(a.weeks)} weeks in.` : "Launched."
    );
  } else if (a.launched === "no") {
    bits.push("Not launched yet.");
  }
  if (num(a.users) > 0) bits.push(`${num(a.users)} people use it.`);
  if (num(a.paying) > 0) bits.push(`${num(a.paying)} pay us.`);
  if (num(a.revenue) > 0) bits.push(`$${num(a.revenue).toLocaleString()} MRR.`);
  if (num(a.growth) > 0) bits.push(`Growing ${num(a.growth)}% week over week.`);
  if (bits.length) out.how_far = bits.join(" ");
  return out;
}
