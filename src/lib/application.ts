// The application workspace: the real YC application questions, grouped the
// way the actual application is, with per-question coaching. Everything is
// persisted to localStorage so the whole app (dashboard, review, chancing,
// partner chat) shares one source of truth.

export type SectionId =
  | "founders"
  | "company"
  | "progress"
  | "idea"
  | "equity"
  | "others";

export interface Section {
  id: SectionId;
  title: string;
  blurb: string;
}

export type CheckKind =
  | "numbers"
  | "competitors"
  | "equity"
  | "insight"
  | "generic";

export interface Question {
  id: string;
  section: SectionId;
  label: string;
  tip: string;
  kind: "input" | "oneliner" | "long";
  rows?: number;
  checks: CheckKind[];
  core?: boolean;
}

export const SECTIONS: Section[] = [
  {
    id: "founders",
    title: "Founders",
    blurb: "Who you are, how you met, and proof you get things done.",
  },
  {
    id: "company",
    title: "Company",
    blurb: "The one-liner and what you're actually building.",
  },
  {
    id: "progress",
    title: "Progress",
    blurb: "The section partners weight most. Numbers win.",
  },
  {
    id: "idea",
    title: "Idea",
    blurb: "Why this, why you, why now, and who else is trying.",
  },
  {
    id: "equity",
    title: "Equity",
    blurb: "Ownership, investment, and fundraising status. State it plainly.",
  },
  {
    id: "others",
    title: "Curious",
    blurb: "Other ideas, other accelerators, and how you found YC.",
  },
];

export const QUESTIONS: Question[] = [
  // ----- Founders -----
  {
    id: "video_script",
    section: "founders",
    label:
      "Founder video: what will you say in your 1-minute intro? (paste your script or bullet points)",
    tip: "Partners watch this before reading anything else. Structure: who you are, one plain sentence on what you make, your sharpest number or insight. No slides, no production value, just clarity and energy.",
    kind: "long",
    rows: 4,
    checks: ["generic"],
  },
  {
    id: "how_met",
    section: "founders",
    label:
      "How long have the founders known one another and how did you meet? Have any of the founders not met in person?",
    tip: "This is a breakup-risk question. Long history working together beats long friendship. If you met recently or online, show evidence you've already shipped something together.",
    kind: "long",
    rows: 3,
    checks: ["generic"],
  },
  {
    id: "who_codes",
    section: "founders",
    label:
      "Who writes code, or does other technical work on your product? Was any of it done by a non-founder?",
    tip: "Partners want the product built by founders. Outsourced code is a red flag. If a non-founder built parts, be honest and explain how that changes.",
    kind: "long",
    rows: 3,
    checks: ["generic"],
  },
  {
    id: "hacked_system",
    section: "founders",
    label:
      "Please tell us about a time you most successfully hacked some (non-computer) system to your advantage.",
    tip: "This is really asking: are you resourceful and a little relentless? Pick a story with a concrete outcome, not a personality claim. Small and real beats grand and vague.",
    kind: "long",
    rows: 4,
    checks: ["insight"],
  },
  // ----- Company -----
  {
    id: "company_name",
    section: "company",
    label: "Company name",
    tip: "Short, spellable, sayable. Don't burn days here.",
    kind: "input",
    checks: [],
  },
  {
    id: "one_liner",
    section: "company",
    label: "Describe what your company does in 50 characters or less.",
    tip: 'The most-read sentence in your application. Formula that works: "[Product] is [what] for [who]." A partner should be able to repeat it after one read.',
    kind: "oneliner",
    checks: ["generic"],
    core: true,
  },
  {
    id: "company_url",
    section: "company",
    label: "Company URL, if any",
    tip: "A live URL, even rough, is progress evidence. If it's not live, leave it blank rather than linking a dead page.",
    kind: "input",
    checks: [],
  },
  {
    id: "product_description",
    section: "company",
    label:
      "What is your company going to make? Please describe your product and what it does or will do.",
    tip: "Describe what a user literally sees and does, in plain words. No adjectives, no vision statements. If a smart friend couldn't sketch your product after reading this, rewrite it.",
    kind: "long",
    rows: 5,
    checks: ["generic"],
    core: true,
  },
  {
    id: "location",
    section: "company",
    label:
      "Where do you live now, and where would the company be based after YC?",
    tip: "Just answer it. If you'd relocate, say so plainly.",
    kind: "long",
    rows: 2,
    checks: [],
  },
  // ----- Progress -----
  {
    id: "how_far",
    section: "progress",
    label: "How far along are you?",
    tip: "The answer partners weight most. Lead with your single strongest number. Launched or not, say exactly what exists today. Small honest numbers beat impressive adjectives.",
    kind: "long",
    rows: 4,
    checks: ["numbers"],
    core: true,
  },
  {
    id: "tech_stack",
    section: "progress",
    label:
      "What tech stack are you using, or planning to use, to build this product?",
    tip: "A plain list is fine. Partners scan for whether the team can actually build this.",
    kind: "long",
    rows: 2,
    checks: [],
  },
  {
    id: "users",
    section: "progress",
    label:
      "Are people using your product? How many active users or customers do you have?",
    tip: "Give the real number and define it (weekly actives, paying teams). A precisely-defined small number reads better than a vague big one.",
    kind: "long",
    rows: 3,
    checks: ["numbers"],
  },
  {
    id: "revenue",
    section: "progress",
    label: "Do you have revenue? How much?",
    tip: "State it plainly with the period (MRR, total). If zero, say zero and what would change that. Never dress it up.",
    kind: "long",
    rows: 2,
    checks: ["numbers"],
  },
  {
    id: "work_duration",
    section: "progress",
    label:
      "How long have each of you been working on this? How much of that has been full-time?",
    tip: "This is a velocity question: partners divide your progress by this answer. A lot built in a short time is the best possible signal.",
    kind: "long",
    rows: 2,
    checks: ["numbers"],
  },
  // ----- Idea -----
  {
    id: "why_idea",
    section: "idea",
    label:
      "Why did you pick this idea to work on? Do you have domain expertise in this area? How do you know people need what you're making?",
    tip: 'Founder-market fit lives here. The strongest answers start with lived experience: "When I was X, I saw Y." Cite real conversations with users, not market-size logic.',
    kind: "long",
    rows: 5,
    checks: ["insight"],
    core: true,
  },
  {
    id: "whats_new",
    section: "idea",
    label:
      "What's new about what you're making? What substitutes do people resort to because it doesn't exist yet (or they don't know about it)?",
    tip: "Naming the substitute (a spreadsheet, a manual process, a worse tool) proves the need is real. If there is no substitute, partners wonder if there is no need.",
    kind: "long",
    rows: 4,
    checks: ["insight"],
  },
  {
    id: "competitors",
    section: "idea",
    label:
      "Who are your competitors? What do you understand about your business that they don't?",
    tip: 'Never say "no competitors": it reads as "hasn\'t looked" or "no market." Name the closest ones, then give the one insight you have that they don\'t act on.',
    kind: "long",
    rows: 4,
    checks: ["competitors", "insight"],
  },
  {
    id: "money",
    section: "idea",
    label: "How do or will you make money? How much could you make?",
    tip: "A simple, concrete mechanism beats a complicated one. Show the napkin math for how this gets big: price times plausible customer count.",
    kind: "long",
    rows: 3,
    checks: ["numbers"],
  },
  {
    id: "category",
    section: "idea",
    label: "Which category best applies to your company?",
    tip: "One or two words (B2B SaaS, fintech, devtools, consumer, healthcare...).",
    kind: "input",
    checks: [],
  },
  // ----- Equity -----
  {
    id: "legal_entity",
    section: "equity",
    label: "Have you formed ANY legal entity yet? If so, describe it.",
    tip: "Just the facts: entity type, where, who owns it. Messy structures are fixable; hiding them is not.",
    kind: "long",
    rows: 2,
    checks: ["equity"],
  },
  {
    id: "equity_split",
    section: "equity",
    label:
      "Describe the breakdown of the equity ownership among the founders, employees and any other stockholders.",
    tip: "State the split plainly and why. Heavily unequal splits get probed in interviews; defensive or evasive wording here reads worse than the split itself.",
    kind: "long",
    rows: 2,
    checks: ["equity"],
  },
  {
    id: "investment",
    section: "equity",
    label:
      "Have you taken any investment yet? From whom, how much, and on what terms?",
    tip: "List amounts, instruments (SAFE, priced), and caps. Partners check this against your equity answer for consistency.",
    kind: "long",
    rows: 2,
    checks: ["equity", "numbers"],
  },
  {
    id: "fundraising",
    section: "equity",
    label: "Are you currently fundraising?",
    tip: "Yes or no, plus the round if yes. No spin needed.",
    kind: "long",
    rows: 2,
    checks: ["equity"],
  },
  // ----- Curious -----
  {
    id: "other_ideas",
    section: "others",
    label:
      "If you had any other ideas you considered applying with, please list them.",
    tip: "A place to show idea quality and taste. One or two crisp alternatives is plenty.",
    kind: "long",
    rows: 3,
    checks: [],
  },
  {
    id: "other_accelerators",
    section: "others",
    label:
      "Have you applied to or participated in any other startup accelerators or incubators?",
    tip: "Be straightforwardly honest; this is verifiable.",
    kind: "long",
    rows: 2,
    checks: [],
  },
  {
    id: "how_heard",
    section: "others",
    label: "How did you hear about Y Combinator?",
    tip: "One sentence. Nobody was ever rejected for this answer.",
    kind: "long",
    rows: 2,
    checks: [],
  },
];

export const questionsFor = (sectionId: SectionId) =>
  QUESTIONS.filter((q) => q.section === sectionId);

export const coreQuestionIds = QUESTIONS.filter((q) => q.core).map((q) => q.id);

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export interface InterviewMastery {
  reps: number;
  sum: number; // sum of self-ratings, each 1-4
}

export interface AppData {
  answers: Record<string, string>;
  deadline?: string; // ISO date the user sets for their target batch
  strength?: number; // last whole-application review total
  strengthAt?: string;
  interview: Record<string, InterviewMastery>;
  chancing: Record<string, string>;
}

const STORAGE_KEY = "batchize-app";

const EMPTY: AppData = { answers: {}, interview: {}, chancing: {} };

export function loadApp(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(EMPTY);
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      answers: parsed.answers ?? {},
      deadline: parsed.deadline,
      strength: parsed.strength,
      strengthAt: parsed.strengthAt,
      interview: parsed.interview ?? {},
      chancing: parsed.chancing ?? {},
    };
  } catch {
    return structuredClone(EMPTY);
  }
}

export function saveApp(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function updateApp(mutate: (d: AppData) => void): AppData {
  const d = loadApp();
  mutate(d);
  saveApp(d);
  return d;
}

export function answeredCount(data: AppData): number {
  return QUESTIONS.filter((q) => (data.answers[q.id] ?? "").trim()).length;
}

export function firstUnanswered(data: AppData): Question | null {
  return QUESTIONS.find((q) => !(data.answers[q.id] ?? "").trim()) ?? null;
}
