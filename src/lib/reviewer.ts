// Rule-based YC application answer reviewer. Runs fully client-side.

export interface Flag {
  sev: "red" | "amber" | "green";
  title: string;
  body: string;
}

export interface ReviewResult {
  clarity: number;
  evidence: number;
  insight: number;
  ambition: number;
  total: number;
  verdictTitle: string;
  verdictBody: string;
  flags: Flag[];
  reviewer: "rules" | "claude" | "local";
}

// ---------------------------------------------------------------------------
// Lexicons. Multi-word phrases match as substrings with word boundaries at
// both ends; single words match whole words only (so "all" never matches
// inside "small", and "every" never matches inside "everyone").
// ---------------------------------------------------------------------------

const BUZZWORDS = [
  "revolutionary", "revolutionize", "revolutionise", "disrupt", "disruptive",
  "disrupting", "synergy", "synergies", "cutting-edge", "cutting edge",
  "game-changing", "game changer", "next-generation", "next generation",
  "next-gen", "seamless", "seamlessly", "frictionless", "innovative",
  "innovation", "leverage", "leveraging", "empower", "empowering",
  "world-class", "best-in-class", "state-of-the-art", "paradigm", "holistic",
  "robust", "turnkey", "bleeding-edge", "scalable solution",
  "solutions provider", "ecosystem play", "ai-powered platform",
  "one-stop shop", "in today's fast-paced world", "unlock the power",
  "transform the way", "reimagine", "reimagining", "supercharge",
  "democratize", "democratizing", "10x better",
];

const MISSION_SPEAK = [
  "our mission", "our vision", "we are passionate", "we're passionate",
  "we believe in a world", "on a mission to", "our purpose",
];

const HEDGES = [
  "hopefully", "we think", "we believe", "we hope", "we feel", "we imagine",
  "trying to", "we aim to", "we intend to", "we plan to eventually", "maybe",
  "might be able", "could potentially", "we're hoping", "should be able to",
  "we would like to", "possibly", "perhaps",
];

const INSIGHT_MARKERS = [
  "we noticed", "we learned", "we realized", "we realised", "i noticed",
  "i learned", "i realized", "i realised", "we discovered", "i discovered",
  "surprised", "surprising", "turns out", "the insight", "counterintuitive",
  "because", "when i was", "when we were", "at my last job", "at my previous",
  "in my previous", "i spent", "we spent", "i worked", "we worked", "i built",
  "we built", "i ran", "we ran", "i managed", "we managed", "firsthand",
  "first-hand", "myself", "ourselves", "talked to", "spoke to", "spoke with",
  "interviewed", "customer interviews", "user interviews", "we sold", "i sold",
  "we shipped", "i shipped", "our own problem", "my own problem",
  "scratching our own itch",
];

const AMBITION_MARKERS = [
  "every", "all", "billion", "billions", "million", "millions", "trillion",
  "entire", "anyone", "everyone", "everybody", "the whole", "replace",
  "become the", "standard", "default", "category", "eventually", "expand",
  "long term", "long-term", "wedge",
];

const TRACTION_MARKERS = [
  "launched", "launch", "live", "shipped", "users", "customers", "clients",
  "revenue", "mrr", "arr", "gmv", "waitlist", "signed", "paying", "paid",
  "pilot", "pilots", "loi", "lois", "retention", "churn", "week", "weekly",
  "daily", "monthly", "growing", "growth", "downloads", "installs", "signups",
  "sign-ups", "active", "demo", "prototype", "beta",
];

const VAGUE_CATEGORY_WORDS = ["platform", "solution", "solutions", "ecosystem"];

// Nouns used for the cross-answer consistency check ("1,200 users" in one
// answer vs "2,000 users" in another).
const COUNTED_NOUNS = [
  "users", "customers", "clients", "brokers", "teams", "companies", "schools",
  "students", "subscribers", "merchants", "drivers", "restaurants", "pilots",
  "downloads", "installs", "signups",
];

// ---------------------------------------------------------------------------
// Matching helpers
// ---------------------------------------------------------------------------

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const TERM_CACHE = new Map<string, RegExp>();
function termRe(term: string): RegExp {
  let re = TERM_CACHE.get(term);
  if (!re) {
    const startsWord = /^[a-z0-9]/i.test(term);
    const endsWord = /[a-z0-9]$/i.test(term);
    re = new RegExp(
      (startsWord ? "\\b" : "") + escapeRe(term) + (endsWord ? "\\b" : ""),
      "i"
    );
    TERM_CACHE.set(term, re);
  }
  return re;
}

function found(text: string, list: string[]): string[] {
  return list.filter((w) => termRe(w).test(text));
}

const hasNumbers = (text: string) => /\d/.test(text) || /%|\$/.test(text);
const numberCount = (text: string) =>
  (text.match(/\d[\d,.]*\s*(%|k|m\b)?|\$\s?\d/gi) || []).length;
const wordCount = (text: string) =>
  text.split(/\s+/).filter(Boolean).length;

function avgSentenceLen(text: string): number {
  // Split on sentence enders followed by whitespace/end, so "9.2k" and
  // "$1.4M" don't inflate the sentence count.
  const sents = text
    .split(/[.!?]+(?=\s|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!sents.length) return 0;
  return sents.reduce((a, s) => a + s.split(/\s+/).length, 0) / sents.length;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

// Extract "<number> <noun>" pairs for consistency checking.
function countedNouns(text: string): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const re = new RegExp(
    "(\\d[\\d,]*(?:\\.\\d+)?[km]?)\\s+(?:\\w+\\s+)?(" +
      COUNTED_NOUNS.join("|") +
      ")\\b",
    "gi"
  );
  for (const m of text.matchAll(re)) {
    const noun = m[2].toLowerCase();
    const num = m[1].toLowerCase().replace(/,/g, "");
    if (!out.has(noun)) out.set(noun, new Set());
    out.get(noun)!.add(num);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The reviewer
// ---------------------------------------------------------------------------

export function review(
  one: string,
  make: string,
  why: string,
  far: string
): ReviewResult {
  one = one.trim();
  make = make.trim();
  why = why.trim();
  far = far.trim();
  const all = [one, make, why, far].join(" ");
  const flags: Flag[] = [];

  // ----- Clarity -----
  let clarity = 8.5;
  const buzz = found(all, BUZZWORDS);
  clarity -= Math.min(4.5, buzz.length * 1.5);
  if (buzz.length) {
    flags.push({
      sev: "red",
      title: "Buzzwords detected:",
      body: `"${[...new Set(buzz)].slice(0, 4).join('", "')}". Partners skim past adjectives. Say what it literally does, in words a smart friend would use.`,
    });
  }
  const mission = found(one + " " + make, MISSION_SPEAK);
  if (mission.length) {
    clarity -= 1.5;
    flags.push({
      sev: "red",
      title: "Mission-statement language:",
      body: `"${mission[0]}". The question asks what the company does, not why it exists. Describe the product a user actually touches.`,
    });
  }
  if (one && one.length > 50) {
    clarity -= 1.5;
    flags.push({
      sev: "red",
      title: `One-liner is ${one.length} characters.`,
      body: 'The application caps this at 50. Cut it down: "[Product] is [what] for [who]."',
    });
  } else if (one && one.length <= 50) {
    flags.push({
      sev: "green",
      title: "One-liner fits in 50 characters.",
      body: "Now stress-test it: could a partner repeat it to another partner after one read?",
    });
  }
  const vagueInOneLiner = one ? found(one, VAGUE_CATEGORY_WORDS) : [];
  if (vagueInOneLiner.length) {
    clarity -= 1;
    flags.push({
      sev: "amber",
      title: `"${vagueInOneLiner[0]}" in your one-liner.`,
      body: 'Category words hide what the product does. "Stripe: payment processing API for developers" beats "payments platform."',
    });
  }
  const asl = avgSentenceLen(make + ". " + why);
  if (asl > 26) {
    clarity -= 1.5;
    flags.push({
      sev: "amber",
      title: "Long sentences:",
      body: `yours average ${Math.round(asl)} words. Partners read fast. Break them up. One idea per sentence.`,
    });
  }
  const hedges = found(all, HEDGES);
  if (hedges.length) {
    clarity -= Math.min(2, hedges.length * 0.7);
    flags.push({
      sev: "amber",
      title: "Hedging language:",
      body: `"${[...new Set(hedges)].slice(0, 3).join('", "')}". Confidence reads as competence. State facts, not hopes.`,
    });
  }
  if (make && wordCount(make) < 15) {
    clarity -= 1;
    flags.push({
      sev: "amber",
      title: '"What will you make?" is very thin.',
      body: `${wordCount(make)} words. Describe what a user literally sees and does. Two or three concrete sentences beat one abstract one.`,
    });
  }

  // ----- Evidence -----
  let evidence = 3;
  const nums = numberCount(far) + numberCount(make);
  evidence += Math.min(5, nums * 1.4);
  const traction = found(far, TRACTION_MARKERS);
  evidence += Math.min(2, traction.length * 0.5);
  if (far && !hasNumbers(far)) {
    flags.push({
      sev: "red",
      title: "No numbers in your traction answer.",
      body: '"Growing fast" is invisible; "14% w/w for 9 weeks" is unforgettable. Even small honest numbers beat adjectives.',
    });
  } else if (nums >= 3) {
    flags.push({
      sev: "green",
      title: `${nums} metrics found.`,
      body: "Numbers are the first thing partners scan for. Lead with your single strongest one.",
    });
  }
  if (!far) {
    flags.push({
      sev: "amber",
      title: '"How far along are you?" is empty.',
      body: "This is the answer partners weight most. Launched or not, say exactly what exists today.",
    });
  }

  // Cross-answer consistency: the same noun counted with different numbers
  // in different answers is the classic narrative-check catch.
  const crossFlags = crossConsistencyFlags([one, make, why, far]);
  if (crossFlags.length) {
    evidence -= 3;
    flags.push(crossFlags[0]);
  }

  // ----- Insight -----
  let insight = 3.5;
  const ins = found(why + " " + make, INSIGHT_MARKERS);
  insight += Math.min(5, ins.length * 1.1);
  if (why && ins.length === 0) {
    flags.push({
      sev: "amber",
      title: 'No personal connection in "why this idea."',
      body: 'Partners look for founder-market fit: what did you see firsthand that others missed? Start with "When I was..."',
    });
  } else if (ins.length >= 2) {
    flags.push({
      sev: "green",
      title: "Founder-market fit signal detected.",
      body: 'You connect the idea to lived experience. That\'s exactly what "why you?" is really asking.',
    });
  }
  if (/no (direct )?competitors|no competition|nobody else is doing/i.test(all)) {
    insight -= 2;
    flags.push({
      sev: "red",
      title: '"No competitors" claim.',
      body: 'To a partner this reads as "hasn\'t looked" or "no market." Name the closest alternative, even if it\'s a spreadsheet.',
    });
  }
  if (why && wordCount(why) < 15) {
    insight -= 1;
    flags.push({
      sev: "amber",
      title: '"Why this idea?" is very thin.',
      body: "This is where partners look for your unfair advantage. What do you know about this problem that most people don't?",
    });
  }

  // ----- Ambition -----
  let ambition = 4;
  const amb = found(all, AMBITION_MARKERS);
  ambition += Math.min(4, amb.length * 0.9);
  if (hasNumbers(all)) ambition += 1;
  if ((make + why).length > 0 && amb.length === 0) {
    flags.push({
      sev: "amber",
      title: "Scope reads small.",
      body: "YC funds companies that could be huge. One sentence on what this becomes if it works. Who uses it in 10 years?",
    });
  }

  // ----- fill guard -----
  const filled = [one, make, why, far].filter(Boolean).length;
  if (filled < 2) {
    flags.unshift({
      sev: "amber",
      title: "Partial review:",
      body: "fill in more answers for a real read. Scores reflect only what you've written so far.",
    });
  }

  clarity = clamp(clarity, 1, 10);
  evidence = clamp(evidence, 1, 10);
  insight = clamp(insight, 1, 10);
  ambition = clamp(ambition, 1, 10);

  // An application is only as strong as what's actually filled in. The
  // baselines above assume there is text to judge.
  const completeness = [0.45, 0.6, 0.8, 1][Math.max(0, filled - 1)] ?? 1;
  const total = Math.round(
    totalFromScores(clarity, evidence, insight, ambition) * completeness
  );
  const [verdictTitle, verdictBody] = verdictForTotal(total);

  sortFlags(flags);

  return {
    clarity,
    evidence,
    insight,
    ambition,
    total,
    verdictTitle,
    verdictBody,
    flags,
    reviewer: "rules",
  };
}

// Shared by the rule engine and the Claude reviewer so both modes produce
// the same donut math and verdict tiers.
export function totalFromScores(
  clarity: number,
  evidence: number,
  insight: number,
  ambition: number
): number {
  return Math.round(
    (clarity * 0.3 + evidence * 0.3 + insight * 0.25 + ambition * 0.15) * 10
  );
}

export function verdictForTotal(total: number): [string, string] {
  return total >= 80
    ? ["Partner-ready", "This reads like an application a partner forwards to the group. Keep the numbers current and rehearse the interview."]
    : total >= 60
    ? ["Strong, with gaps", "The bones are good. Fix the flags below. Most are one-sentence fixes that change how a partner reads you."]
    : total >= 40
    ? ["Needs sharpening", "A partner would skim this and move on. The fixes below are exactly where to spend your next hour."]
    : ["Not ready to submit", "Right now this application undersells you. Work through every flag, then run it again."];
}

export function sortFlags(flags: Flag[]): void {
  const order = { red: 0, amber: 1, green: 2 } as const;
  flags.sort((a, b) => order[a.sev] - order[b.sev]);
}

// ---------------------------------------------------------------------------
// Per-question checks, used by the full-application workspace. Each check is
// the same lexicon machinery as the core reviewer, applied to one answer.
// ---------------------------------------------------------------------------

export interface QuickCheckOpts {
  charCap?: number;
  expectNumbers?: boolean;
  competitors?: boolean;
  equity?: boolean;
  insight?: boolean;
}

export function quickFlags(text: string, opts: QuickCheckOpts = {}): Flag[] {
  const t = text.trim();
  if (!t) return [];
  const flags: Flag[] = [];

  const buzz = found(t, BUZZWORDS);
  if (buzz.length) {
    flags.push({
      sev: "red",
      title: "Buzzwords:",
      body: `"${[...new Set(buzz)].slice(0, 3).join('", "')}". Say what it literally is instead.`,
    });
  }
  const mission = found(t, MISSION_SPEAK);
  if (mission.length) {
    flags.push({
      sev: "red",
      title: "Mission-statement language:",
      body: `"${mission[0]}". Answer the question literally, not with why the company exists.`,
    });
  }
  const hedges = found(t, HEDGES);
  if (hedges.length) {
    flags.push({
      sev: opts.equity ? "red" : "amber",
      title: opts.equity ? "Reads defensive:" : "Hedging:",
      body: opts.equity
        ? `"${hedges[0]}". Equity answers get probed in interviews; state the facts plainly, without softening.`
        : `"${[...new Set(hedges)].slice(0, 2).join('", "')}". State facts, not hopes.`,
    });
  }
  if (opts.charCap && t.length > opts.charCap) {
    flags.push({
      sev: "red",
      title: `${t.length} characters (cap is ${opts.charCap}).`,
      body: "The application enforces this limit. Cut it down now, not at submit time.",
    });
  }
  if (opts.expectNumbers && !hasNumbers(t)) {
    flags.push({
      sev: "amber",
      title: "No numbers.",
      body: "This answer is scanned for metrics first. Even a small honest number beats an adjective.",
    });
  }
  if (opts.competitors && /no (direct )?competitors|no competition|nobody else is doing/i.test(t)) {
    flags.push({
      sev: "red",
      title: '"No competitors" claim.',
      body: 'Reads as "hasn\'t looked" or "no market." Name the closest alternative, even a spreadsheet.',
    });
  }
  if (opts.insight && found(t, INSIGHT_MARKERS).length === 0) {
    flags.push({
      sev: "amber",
      title: "No personal connection.",
      body: 'Partners look for lived experience here. "When I was X, I saw Y" beats market logic.',
    });
  }
  sortFlags(flags);
  return flags;
}

// Same-noun-different-number detection across any set of answers.
export function crossConsistencyFlags(texts: string[]): Flag[] {
  const filled = texts.filter((t) => t && t.trim());
  if (filled.length < 2) return [];
  const merged = new Map<string, Set<string>>();
  for (const a of filled) {
    for (const [noun, numsSet] of countedNouns(a)) {
      if (!merged.has(noun)) merged.set(noun, new Set());
      for (const n of numsSet) merged.get(noun)!.add(n);
    }
  }
  const flags: Flag[] = [];
  for (const [noun, numsSet] of merged) {
    if (numsSet.size >= 2) {
      flags.push({
        sev: "red",
        title: `Inconsistent numbers for "${noun}".`,
        body: `Your answers mention ${[...numsSet].join(" and ")} ${noun}. Partners cross-check claims; pick the real number and use it everywhere.`,
      });
      if (flags.length >= 2) break;
    }
  }
  return flags;
}
