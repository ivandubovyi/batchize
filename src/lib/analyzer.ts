// Batchize Analyzer: the keyless engine that fully checks every answer in a
// YC application. No API key, no token, no model download, no network. It
// reads each answer against what that specific question is asking, quotes the
// exact words that cause a problem, and cross-checks the whole application
// for contradictions and repetition.

import { QUESTIONS, SECTIONS, type Question, type AppData } from "./application";
import { totalFromScores, verdictForTotal } from "./reviewer";

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

export type Sev = "red" | "amber" | "green";

export interface Finding {
  sev: Sev;
  title: string;
  body: string;
  /** Exact words from the answer that triggered this finding. */
  evidence?: string;
  /** Rubric dimension this finding pushes on. */
  dim?: "clarity" | "evidence" | "insight" | "ambition";
}

// ---------------------------------------------------------------------------
// Lexicons
// ---------------------------------------------------------------------------

/**
 * Buzzword stems, matched with any suffix, so "revolutionary",
 * "Revolutionizing" and "revolutionise" are all caught by one entry.
 */
const BUZZ_STEMS = [
  "revolutionar", "revolutioniz", "revolutionis", "disrupt", "synerg",
  "seamless", "frictionless", "innovat", "leverag", "empower", "paradigm",
  "holistic", "turnkey", "reimagin", "supercharg", "democratiz",
  "gamechang", "bleeding-edge", "world-class", "best-in-class",
  "state-of-the-art", "cutting-edge", "next-gen", "hyper-growth",
  "mission-critical", "value-add",
];

const BUZZ_PHRASES = [
  "cutting edge", "game-changing", "game changer", "next generation",
  "scalable solution", "solutions provider", "ecosystem play",
  "ai-powered platform", "one-stop shop", "unlock the power",
  "transform the way", "end-to-end solution", "best of breed",
];

const MISSION_SPEAK = [
  "our mission", "our vision", "we are passionate", "we're passionate",
  "we believe in a world", "on a mission to", "our purpose", "we envision",
  "we dream of", "our north star",
];

const HEDGES = [
  "hopefully", "we think", "we believe", "we hope", "we feel", "we imagine",
  "trying to", "we aim to", "we intend to", "we plan to eventually", "maybe",
  "might be able", "could potentially", "we're hoping", "should be able to",
  "we would like to", "possibly", "perhaps", "sort of", "kind of",
  "more or less", "we're looking to", "we want to eventually",
];

const FILLER = [
  "in order to", "at the end of the day", "it is important to note",
  "it's important to note", "needless to say", "as you know", "basically",
  "essentially", "very unique", "really really", "literally", "obviously",
  "in today's world", "in today's fast-paced world", "the fact of the matter",
  "when it comes to", "in terms of", "at this point in time",
];

const WEASEL = [
  "some people", "a lot of people", "many people", "most people",
  "several companies", "various", "numerous", "industry experts",
  "studies show", "research shows", "everyone knows", "it is well known",
  "people say", "a lot of", "tons of", "countless",
];

const SUPERLATIVES = [
  "the best", "the only", "first ever", "the first", "the largest",
  "the leading", "world's best", "unrivaled", "unmatched", "perfect",
  "guaranteed", "never fails", "always works", "10x better", "100x",
];

const COMPARATIVES = [
  "faster", "better", "cheaper", "easier", "simpler", "more efficient",
  "more accurate", "more powerful", "superior", "smarter", "quicker",
  "more reliable", "more scalable",
];

const INSIGHT_MARKERS = [
  "we noticed", "we learned", "we realized", "we realised", "i noticed",
  "i learned", "i realized", "i realised", "we discovered", "i discovered",
  "surprised", "surprising", "turns out", "the insight", "counterintuitive",
  "when i was", "when we were", "at my last job", "at my previous",
  "in my previous", "i spent", "we spent", "i worked", "we worked", "i built",
  "we built", "i ran", "we ran", "i managed", "we managed", "firsthand",
  "first-hand", "myself", "ourselves", "talked to", "spoke to", "spoke with",
  "interviewed", "customer interviews", "user interviews", "we sold", "i sold",
  "we shipped", "i shipped", "our own problem", "my own problem",
  "scratching our own itch", "i experienced", "we experienced",
];

const AMBITION_MARKERS = [
  "every", "all", "billion", "billions", "million", "millions", "trillion",
  "entire", "anyone", "everyone", "everybody", "the whole", "replace",
  "become the", "standard", "default", "category", "expand",
  "long term", "long-term", "wedge", "worldwide", "globally", "industry",
];

/** Timing words that sound like progress but pin down nothing. */
const VAGUE_TIME = [
  "recently", "soon", "shortly", "lately", "in the near future",
  "a while ago", "some time ago", "at some point", "any day now",
  "in the coming weeks", "in the coming months", "just launched",
];

/** Numbers written as words still count as evidence. */
const WORD_NUMBERS =
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|dozen|couple|few)\b/i;

/** An honest zero is a real answer, not a missing number. */
const EXPLICIT_ZERO =
  /\b(no|zero|none|nothing|not yet|haven't|have not|pre-?launch|pre-?revenue|don't have any|do not have any)\b/i;

/** Passive constructions that hide who actually did the work. */
const PASSIVE =
  /\b(was|were|has been|have been|had been|is being|are being)\s+(\w+ed|built|written|made|created|designed|developed|shipped|launched|maintained|handled)\b/gi;

/** Signup-style words that are not the same as active usage. */
const SOFT_USAGE =
  /\bwaitlist\b|\bsigned up\b|\bsign-?ups?\b|\bregistered\b|\bcreated an account\b|\bemail list\b|\binterested\b/i;

const REAL_USAGE =
  /\bactive\b|\bpaying\b|\bweekly\b|\bdaily\b|\bmonthly\b|\bretention\b|\breturning\b|\busing it\b|\blogged? in\b/i;

const PRODUCT_VERBS = [
  "users can", "you can", "customers can", "lets", "let them", "allows",
  "shows", "sends", "creates", "generates", "connects", "syncs", "tracks",
  "uploads", "imports", "exports", "clicks", "types", "logs in", "signs up",
  "dashboard", "api", "app", "click", "screen", "page", "workflow",
];

const TIME_UNITS = [
  "week", "weeks", "weekly", "month", "months", "monthly", "day", "days",
  "daily", "year", "years", "quarter", "w/w", "m/m", "mom", "wow", "annually",
];

const MONEY_UNITS = ["mrr", "arr", "revenue", "$", "usd", "gmv", "per month", "per year", "/mo", "/month", "/yr"];

// ---------------------------------------------------------------------------
// Matching helpers
// ---------------------------------------------------------------------------

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const RE_CACHE = new Map<string, RegExp>();
function termRe(term: string, flags = "i"): RegExp {
  const key = flags + "|" + term;
  let re = RE_CACHE.get(key);
  if (!re) {
    const startsWord = /^[a-z0-9]/i.test(term);
    const endsWord = /[a-z0-9]$/i.test(term);
    re = new RegExp(
      (startsWord ? "\\b" : "") + escapeRe(term) + (endsWord ? "\\b" : ""),
      flags
    );
    RE_CACHE.set(key, re);
  }
  return re;
}

function hits(text: string, list: string[]): string[] {
  return list.filter((w) => termRe(w).test(text));
}

/** Matches a stem plus any suffix: "disrupt" catches "disrupting", "disrupts". */
function stemHits(text: string, stems: string[]): string[] {
  const out: string[] = [];
  for (const stem of stems) {
    const re = new RegExp("\\b" + escapeRe(stem) + "\\w*", "i");
    const m = re.exec(text);
    if (m) out.push(m[0].toLowerCase());
  }
  return out;
}

/** Every buzzword in the text, stems and phrases together. */
function buzzHits(text: string): string[] {
  return [...new Set([...stemHits(text, BUZZ_STEMS), ...hits(text, BUZZ_PHRASES)])];
}

const hasDigit = (t: string) => /\d/.test(t);

/** Digits or spelled-out numbers. */
const hasAnyNumber = (t: string) => hasDigit(t) || WORD_NUMBERS.test(t);

/** Distinct all-caps acronyms, a proxy for unexplained jargon. */
function acronyms(text: string): string[] {
  const found = text.match(/\b[A-Z]{2,6}\b/g) ?? [];
  const common = new Set([
    "AI", "API", "US", "UK", "EU", "SAAS", "B2B", "B2C", "CEO", "CTO", "MVP",
    "YC", "USD", "MRR", "ARR", "GMV", "OK", "ID", "IT", "PDF", "CSV", "URL",
  ]);
  return [...new Set(found.filter((a) => !common.has(a)))];
}

function numberTokens(text: string): string[] {
  return text.match(/\$?\d[\d,]*(?:\.\d+)?\s*(?:%|k\b|m\b|bn?\b)?/gi) ?? [];
}

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z(])|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Capitalized tokens mid-sentence: a cheap proper-noun proxy. */
function properNouns(text: string): string[] {
  const out: string[] = [];
  for (const sent of sentences(text)) {
    const toks = sent.split(/\s+/);
    toks.slice(1).forEach((t) => {
      const clean = t.replace(/[^A-Za-z0-9&.+-]/g, "");
      if (/^[A-Z][A-Za-z0-9&.+-]{1,}$/.test(clean) && !/^I$/.test(clean)) {
        out.push(clean);
      }
    });
  }
  return [...new Set(out)];
}

/** A short quoted span around the first match, for evidence. */
function quoteAround(text: string, term: string, span = 60): string {
  const m = termRe(term).exec(text);
  if (!m) return "";
  const start = Math.max(0, m.index - Math.floor(span / 3));
  const end = Math.min(text.length, m.index + term.length + span);
  return (
    (start > 0 ? "…" : "") +
    text.slice(start, end).trim() +
    (end < text.length ? "…" : "")
  );
}

const list = (xs: string[], n = 3) =>
  xs.slice(0, n).map((x) => `"${x}"`).join(", ");

// ---------------------------------------------------------------------------
// Per-question expectations: what a good answer to THIS question contains.
// ---------------------------------------------------------------------------

interface Expectation {
  /** Minimum useful length in words. */
  minWords?: number;
  /** Hard character cap enforced by the application itself. */
  charCap?: number;
  /** This answer is scanned for metrics first. */
  wantsNumbers?: boolean;
  /** Should name real alternatives/competitors. */
  wantsNamedAlternatives?: boolean;
  /** Should show lived experience. */
  wantsPersonal?: boolean;
  /** Should describe concrete product mechanics. */
  wantsProductMechanics?: boolean;
  /** Should contain a time period (weeks/months). */
  wantsDuration?: boolean;
  /** Should contain percentages. */
  wantsPercent?: boolean;
  /** Equity/legal answers: defensiveness reads worse than the facts. */
  factual?: boolean;
  /** A short label for what the question is really after. */
  wants: string;
}

const EXPECT: Record<string, Expectation> = {
  video_script: { minWords: 15, wants: "who you are, one plain sentence on the product, your sharpest number" },
  how_met: { minWords: 6, wantsDuration: true, wants: "how long you've known each other and what you've built together" },
  who_codes: { minWords: 4, wants: "which founder builds the product" },
  hacked_system: { minWords: 15, wantsPersonal: true, wants: "one concrete story with an outcome" },
  company_name: { wants: "the name" },
  one_liner: { charCap: 50, wants: "what the product literally is, in under 50 characters" },
  company_url: { wants: "a live URL" },
  product_description: { minWords: 15, wantsProductMechanics: true, wants: "what a user literally sees and does" },
  location: { minWords: 4, wants: "where you are and where you'd be after YC" },
  how_far: { minWords: 10, wantsNumbers: true, wants: "exactly what exists today, with numbers" },
  tech_stack: { minWords: 3, wants: "the actual stack" },
  users: { minWords: 3, wantsNumbers: true, wants: "a real, defined user count" },
  revenue: { minWords: 3, wantsNumbers: true, wants: "the number and the period, or an honest zero" },
  work_duration: { minWords: 4, wantsDuration: true, wantsNumbers: true, wants: "how long, and how much of it full-time" },
  why_idea: { minWords: 18, wantsPersonal: true, wants: "lived experience and evidence people need this" },
  whats_new: { minWords: 12, wantsNamedAlternatives: true, wants: "the substitute people use today" },
  competitors: { minWords: 10, wantsNamedAlternatives: true, wants: "named competitors plus your insight" },
  money: { minWords: 8, wantsNumbers: true, wants: "the mechanism and the napkin math" },
  category: { wants: "one or two words" },
  legal_entity: { minWords: 4, factual: true, wants: "the entity, plainly" },
  equity_split: { minWords: 4, factual: true, wantsPercent: true, wants: "the split, plainly, with reasoning" },
  investment: { minWords: 3, factual: true, wants: "amounts and terms, or an honest none" },
  fundraising: { minWords: 2, factual: true, wants: "yes or no" },
  other_ideas: { wants: "one or two alternatives" },
  other_accelerators: { wants: "a straight answer" },
  how_heard: { wants: "one sentence" },
};

// ---------------------------------------------------------------------------
// The per-answer audit
// ---------------------------------------------------------------------------

export interface QuestionAudit {
  question: Question;
  answered: boolean;
  findings: Finding[];
  /** 0-10 quality of this single answer. */
  score: number;
  wordCount: number;
}

export function auditAnswer(q: Question, raw: string): QuestionAudit {
  const text = raw.trim();
  const exp = EXPECT[q.id] ?? { wants: "a direct answer" };
  const findings: Finding[] = [];
  const w = words(text);
  const wc = w.length;

  if (!text) {
    return { question: q, answered: false, findings, score: 0, wordCount: 0 };
  }

  // --- hard cap ---
  if (exp.charCap && text.length > exp.charCap) {
    findings.push({
      sev: "red",
      dim: "clarity",
      title: `${text.length} characters, cap is ${exp.charCap}.`,
      body: "The application enforces this limit, so this gets truncated or rejected at submit time. Cut it now.",
      evidence: text.slice(0, 90),
    });
  }

  // --- too thin to be an answer ---
  if (exp.minWords && wc < exp.minWords) {
    findings.push({
      sev: wc < Math.max(3, exp.minWords / 3) ? "red" : "amber",
      dim: "clarity",
      title: `Only ${wc} words.`,
      body: `A partner is looking for ${exp.wants}. This is too thin to show it.`,
    });
  }

  // --- buzzwords ---
  const buzz = buzzHits(text);
  if (buzz.length) {
    findings.push({
      sev: "red",
      dim: "clarity",
      title: `Buzzwords: ${list(buzz)}.`,
      body: "Partners skim past adjectives looking for what the thing actually is. Replace each one with the literal fact underneath it.",
      evidence: quoteAround(text, buzz[0]),
    });
  }

  // --- mission speak where a product description belongs ---
  const mission = hits(text, MISSION_SPEAK);
  if (mission.length && (q.id === "one_liner" || q.id === "product_description")) {
    findings.push({
      sev: "red",
      dim: "clarity",
      title: `Mission statement, not a product: ${list(mission, 1)}.`,
      body: "This question asks what the company does, not why it exists. Describe the thing a user touches.",
      evidence: quoteAround(text, mission[0]),
    });
  }

  // --- hedging ---
  const hedges = hits(text, HEDGES);
  if (hedges.length) {
    findings.push({
      sev: exp.factual ? "red" : "amber",
      dim: "clarity",
      title: exp.factual
        ? `Reads evasive: ${list(hedges, 2)}.`
        : `Hedging: ${list(hedges, 2)}.`,
      body: exp.factual
        ? "Equity, investment, and legal answers get cross-checked in the interview. Softening them reads worse than any answer you could give plainly."
        : "Confidence reads as competence. State what is true, not what you hope.",
      evidence: quoteAround(text, hedges[0]),
    });
  }

  // --- filler and weasel words ---
  const filler = hits(text, FILLER);
  if (filler.length >= 2) {
    findings.push({
      sev: "amber",
      dim: "clarity",
      title: `Filler phrases: ${list(filler)}.`,
      body: "These add length without adding information. Deleting them makes the real content easier to find.",
      evidence: quoteAround(text, filler[0]),
    });
  }
  const weasel = hits(text, WEASEL);
  if (weasel.length) {
    findings.push({
      sev: "amber",
      dim: "evidence",
      title: `Unquantified claim: ${list(weasel, 2)}.`,
      body: "Replace with the actual count, even if it is small. A real number you measured beats a vague many.",
      evidence: quoteAround(text, weasel[0]),
    });
  }

  // --- superlatives without proof ---
  const supers = hits(text, SUPERLATIVES);
  if (supers.length && !hasDigit(text)) {
    findings.push({
      sev: "amber",
      dim: "evidence",
      title: `Unsupported superlative: ${list(supers, 2)}.`,
      body: "A claim this strong invites a partner to disprove it. Either back it with a number or drop it.",
      evidence: quoteAround(text, supers[0]),
    });
  }

  // --- comparatives with no baseline ---
  const comps = hits(text, COMPARATIVES);
  if (comps.length && !hasDigit(text)) {
    findings.push({
      sev: "amber",
      dim: "evidence",
      title: `"${comps[0]}" than what?`,
      body: "Comparatives need a baseline and a number to mean anything. How much faster, measured against what people do today?",
      evidence: quoteAround(text, comps[0]),
    });
  }

  // --- vague timing ---
  const vague = hits(text, VAGUE_TIME);
  if (vague.length && (exp.wantsNumbers || exp.wantsDuration)) {
    findings.push({
      sev: "amber",
      dim: "evidence",
      title: `Vague timing: ${list(vague, 2)}.`,
      body: 'Partners are measuring your velocity, so a fuzzy time word tells them nothing. Give the actual date or count: "launched 8 weeks ago".',
      evidence: quoteAround(text, vague[0]),
    });
  }

  // --- passive voice hiding who did the work ---
  const passives = text.match(PASSIVE) ?? [];
  const firstPassive = passives[0]?.trim();
  if (
    firstPassive &&
    (q.id === "who_codes" || q.id === "hacked_system" || passives.length >= 2)
  ) {
    findings.push({
      sev: "amber",
      dim: "clarity",
      title: `Passive voice hides who did it: "${firstPassive}".`,
      body: "Partners are evaluating people, not events. Name the person: who built it, who decided, who shipped it.",
      evidence: quoteAround(text, firstPassive),
    });
  }

  // --- unexplained jargon ---
  const acr = acronyms(text);
  if (acr.length >= 4) {
    findings.push({
      sev: "amber",
      dim: "clarity",
      title: `Heavy jargon: ${list(acr, 4)}.`,
      body: "A partner outside your industry reads this in seconds and should still understand it. Keep one or two acronyms at most and spell out the rest.",
      evidence: quoteAround(text, acr[0]),
    });
  }

  // --- percentages with no absolute base ---
  if (/%/.test(text)) {
    const absolutes = text.match(/\b\d[\d,]*(?!\s*%)\b/g) ?? [];
    if (absolutes.length === 0) {
      findings.push({
        sev: "amber",
        dim: "evidence",
        title: "Percentages with no absolute numbers.",
        body: 'Growth of 300% could be 1 user to 4. Give the underlying counts next to the rate so a partner can size it.',
        evidence: quoteAround(text, "%"),
      });
    }
  }

  // --- signups presented as usage ---
  if (q.id === "users" && SOFT_USAGE.test(text) && !REAL_USAGE.test(text)) {
    findings.push({
      sev: "red",
      dim: "evidence",
      title: "These are signups, not active users.",
      body: "Partners discount waitlists and registrations heavily. Give the number of people who actually came back and used it, even if that number is much smaller.",
      evidence: quoteAround(text, "signed up") || quoteAround(text, "waitlist"),
    });
  }

  // --- metric quality (not just presence) ---
  if (exp.wantsNumbers) {
    const nums = numberTokens(text);
    // An explicit, honest zero is a complete answer.
    if (nums.length === 0 && EXPLICIT_ZERO.test(text)) {
      findings.push({
        sev: "green",
        dim: "evidence",
        title: "Honest about being early.",
        body: "Stating a plain zero reads far better than dressing it up. Pair it with the one thing that would change it.",
      });
    } else if (nums.length === 0 && WORD_NUMBERS.test(text)) {
      findings.push({
        sev: "amber",
        dim: "evidence",
        title: "Numbers are spelled out.",
        body: "Digits are what a skimming partner's eye catches. Write 1,200 rather than twelve hundred.",
      });
    } else if (nums.length === 0) {
      findings.push({
        sev: "red",
        dim: "evidence",
        title: "No numbers at all.",
        body: "This is the answer partners scan for metrics first. Even small honest numbers beat adjectives.",
      });
    } else {
      const hasPeriod = hits(text, TIME_UNITS).length > 0;
      const hasRate = /%|\bper\b|\bw\/w\b|\bgrow\w*\b/i.test(text);
      const hasMoney = hits(text, MONEY_UNITS).length > 0;
      if (!hasPeriod && !hasRate) {
        findings.push({
          sev: "amber",
          dim: "evidence",
          title: `Numbers without a time period: ${list(nums, 2)}.`,
          body: 'A number with no period is hard to read. "1,200 weekly actives" or "14% w/w for 9 weeks" tells a partner the shape of your growth.',
          evidence: quoteAround(text, nums[0]),
        });
      }
      if (q.id === "revenue" && !hasMoney && !/\bno\b|\bzero\b|\bnone\b|\bnot yet\b/i.test(text)) {
        findings.push({
          sev: "amber",
          dim: "evidence",
          title: "Revenue without a currency or period.",
          body: 'State it as MRR or total with the period, e.g. "$9.2k MRR". If it is zero, say zero plainly.',
        });
      }
      if (nums.length >= 3) {
        findings.push({
          sev: "green",
          dim: "evidence",
          title: `${nums.length} concrete numbers.`,
          body: "This is what a partner scans for first. Lead the answer with the single strongest one.",
        });
      }
    }
  }

  // --- product mechanics ---
  if (exp.wantsProductMechanics) {
    const mech = hits(text, PRODUCT_VERBS);
    if (mech.length === 0) {
      findings.push({
        sev: "red",
        dim: "clarity",
        title: "Never says what a user actually does.",
        body: 'Describe the mechanics: what someone connects, clicks, sees, or receives. "A broker connects their TMS and every invoice is auto-reconciled" beats any description of value.',
      });
    } else {
      findings.push({
        sev: "green",
        dim: "clarity",
        title: "Describes real product mechanics.",
        body: "A partner can picture using this. Keep it that concrete everywhere else.",
      });
    }
  }

  // --- named alternatives / competitors ---
  if (exp.wantsNamedAlternatives) {
    if (/no (direct |real )?competitors|no competition|nobody else is doing|there are none/i.test(text)) {
      findings.push({
        sev: "red",
        dim: "insight",
        title: 'Claims there are no competitors.',
        body: 'To a partner this reads as "hasn\'t looked" or "no market." Name the closest alternative, even if it is a spreadsheet or doing nothing.',
        evidence: quoteAround(text, "competitors"),
      });
    } else {
      const names = properNouns(text);
      const mentionsManual = /spreadsheet|excel|manual|by hand|email|pen and paper|google (docs|sheets)|nothing/i.test(text);
      if (names.length === 0 && !mentionsManual) {
        findings.push({
          sev: "amber",
          dim: "insight",
          title: "No alternative is actually named.",
          body: "Name the specific products or the manual workaround people use today. Naming them proves the need is real and that you have looked.",
        });
      } else {
        findings.push({
          sev: "green",
          dim: "insight",
          title: names.length
            ? `Names real alternatives: ${list(names, 3)}.`
            : "Names the manual workaround people use today.",
          body: "This is exactly what the question is testing. Now make sure your edge over them is one specific sentence.",
        });
      }
    }
  }

  // --- founder-market fit ---
  if (exp.wantsPersonal) {
    const ins = hits(text, INSIGHT_MARKERS);
    if (ins.length === 0) {
      findings.push({
        sev: "amber",
        dim: "insight",
        title: "No lived experience in the answer.",
        body: 'This question is really "why you?". Partners look for something you saw firsthand. Start with "When I was..." and stay specific.',
      });
    } else {
      findings.push({
        sev: "green",
        dim: "insight",
        title: "Founder-market fit signal.",
        body: "You tie this to something you actually lived. That is the strongest form this answer takes.",
      });
    }
  }

  // --- duration / percent expectations ---
  if (exp.wantsDuration && hits(text, TIME_UNITS).length === 0) {
    findings.push({
      sev: "amber",
      dim: "evidence",
      title: "No time period given.",
      body: "Partners divide your progress by how long you have been at it. Say the actual duration.",
    });
  }
  if (exp.wantsPercent && !/%/.test(text) && !/\bequal|even split|50\/50\b/i.test(text)) {
    findings.push({
      sev: "amber",
      dim: "evidence",
      title: "No percentages.",
      body: "Give the actual split. Vagueness here is read as an unresolved cofounder conversation.",
    });
  }

  // --- run-on sentences ---
  const sents = sentences(text);
  const longest = sents.reduce((m, s) => Math.max(m, words(s).length), 0);
  if (longest > 45) {
    findings.push({
      sev: "amber",
      dim: "clarity",
      title: `One sentence runs ${longest} words.`,
      body: "Partners read fast and this will get skimmed. Break it into one idea per sentence.",
    });
  }

  // --- ALL CAPS / exclamation energy ---
  if ((text.match(/!/g) ?? []).length >= 3) {
    findings.push({
      sev: "amber",
      dim: "clarity",
      title: "Lots of exclamation marks.",
      body: "Enthusiasm does not transfer through punctuation. Let the facts carry it.",
    });
  }

  // --- score this answer ---
  let score = 8.5;
  for (const f of findings) {
    if (f.sev === "red") score -= 2.2;
    else if (f.sev === "amber") score -= 0.9;
    else score += 0.5;
  }
  if (exp.minWords && wc >= exp.minWords) score += 0.4;
  score = Math.max(1, Math.min(10, score));

  return { question: q, answered: true, findings, score, wordCount: wc };
}

// ---------------------------------------------------------------------------
// Cross-answer checks over the whole application
// ---------------------------------------------------------------------------

const COUNTED_NOUNS = [
  "users", "customers", "clients", "brokers", "teams", "companies", "schools",
  "students", "subscribers", "merchants", "drivers", "restaurants", "pilots",
  "downloads", "installs", "signups", "founders", "employees",
];

/**
 * Only numbers describing the same thing can contradict each other. These
 * contexts legitimately carry different counts than your current customer
 * numbers, so comparing them would cry wolf:
 *   market sizing  "12,000 US brokers means a $57M market"
 *   research       "we interviewed 30 brokers"
 *   history        "we had 200 users last year"
 *   projections    "we expect 5,000 users by December"
 */
const NOT_A_CURRENT_COUNT =
  // market sizing
  /\bmarket\b|\btam\b|\bsam\b|\bsom\b|\bthere are\b|\btotal\b|\bworldwide\b|\bglobally\b|\bopportunity\b|\bpotential\b|\bindustry\b|\bcould reach\b|\bestimated\b|\bnationwide\b|\bin the (us|uk|world)\b/i;

const RESEARCH_CONTEXT =
  /\binterview\w*\b|\btalked to\b|\bspoke (to|with)\b|\bsurveyed\b|\breached out\b|\bcold[- ]?(called|emailed)\b|\bconversations? with\b|\bwaitlist\b|\bsigned up for (early|the waitlist)\b/i;

const PAST_OR_FUTURE =
  /\blast (year|month|quarter)\b|\bin 20\d\d\b|\bwhen we (started|began|launched)\b|\boriginally\b|\bat first\b|\bused to\b|\bpreviously\b|\bwe expect\b|\bwe project\b|\bwill (have|reach|be)\b|\btarget\w*\b|\bgoal\b|\bby (next|the end of)\b|\baim to\b|\bforecast\w*\b/i;

const isComparableCount = (sentence: string) =>
  !NOT_A_CURRENT_COUNT.test(sentence) &&
  !RESEARCH_CONTEXT.test(sentence) &&
  !PAST_OR_FUTURE.test(sentence);

function countedPairs(text: string): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const re = new RegExp(
    "(\\d[\\d,]*(?:\\.\\d+)?\\s*[km]?)\\s+(?:\\w+\\s+){0,2}(" +
      COUNTED_NOUNS.join("|") +
      ")\\b",
    "gi"
  );
  for (const sent of sentences(text)) {
    if (!isComparableCount(sent)) continue;
    for (const m of sent.matchAll(re)) {
      const noun = m[2].toLowerCase();
      const num = m[1].toLowerCase().replace(/[,\s]/g, "");
      if (!out.has(noun)) out.set(noun, new Set());
      out.get(noun)!.add(num);
    }
  }
  return out;
}

export function crossChecks(data: AppData): Finding[] {
  const findings: Finding[] = [];
  const answered = QUESTIONS.filter((q) => (data.answers[q.id] ?? "").trim());
  const texts = answered.map((q) => data.answers[q.id].trim());

  // 1. Contradictory counts across answers.
  const merged = new Map<string, Set<string>>();
  for (const t of texts) {
    for (const [noun, nums] of countedPairs(t)) {
      if (!merged.has(noun)) merged.set(noun, new Set());
      for (const n of nums) merged.get(noun)!.add(n);
    }
  }
  for (const [noun, nums] of merged) {
    if (nums.size >= 2) {
      findings.push({
        sev: "red",
        dim: "evidence",
        title: `Contradictory numbers for "${noun}".`,
        body: `Different answers say ${[...nums].join(" and ")} ${noun}. Partners cross-check the application against itself and the video. Pick the true number and use it everywhere.`,
      });
    }
  }

  // 2. Copy-pasted sentences across answers.
  const seen = new Map<string, string[]>();
  answered.forEach((q, i) => {
    for (const s of sentences(texts[i])) {
      if (words(s).length < 8) continue;
      const key = s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push(q.id);
    }
  });
  for (const [key, ids] of seen) {
    if (new Set(ids).size >= 2) {
      findings.push({
        sev: "amber",
        dim: "clarity",
        title: "The same sentence appears in more than one answer.",
        body: "Repeating text wastes the only space you get and makes the application feel padded. Each answer should add something new.",
        evidence: key.slice(0, 80),
      });
      break;
    }
  }

  // 3. Traction claimed but no users, or revenue claimed with no users.
  const users = (data.answers["users"] ?? "").trim();
  const revenue = (data.answers["revenue"] ?? "").trim();
  const revenueHasMoney = /\$\s?\d|\d+\s*(k|m)\b|mrr|arr/i.test(revenue);
  const usersZero = /^\s*(no|none|zero|0|not yet)\b/i.test(users);
  if (revenueHasMoney && usersZero) {
    findings.push({
      sev: "red",
      dim: "evidence",
      title: "Revenue but no users.",
      body: "Your revenue answer shows money while your users answer says none. A partner will ask who is paying. Make these two answers agree.",
    });
  }

  // 3b. Contradictory current revenue between answers. Only amounts actually
  // attached to a revenue word count: a price ("$400/mo per broker") sitting
  // in the same sentence as "$9.2k MRR" is not a second revenue figure.
  const REVENUE_AMOUNT = [
    /\$\s?([\d,]+(?:\.\d+)?)\s*([km])?\s*(?:in\s+)?(?:mrr|arr)\b/gi,
    /\b(?:revenue|making|earning|bringing in)\b[^.$]{0,20}\$\s?([\d,]+(?:\.\d+)?)\s*([km])?/gi,
    /\$\s?([\d,]+(?:\.\d+)?)\s*([km])?\s*(?:a|per)\s+(?:month|year)\s+in\s+revenue/gi,
  ];
  const moneyByAnswer = new Map<string, Set<string>>();
  answered.forEach((q, i) => {
    for (const sent of sentences(texts[i])) {
      if (!isComparableCount(sent)) continue;
      for (const re of REVENUE_AMOUNT) {
        re.lastIndex = 0;
        for (const m of sent.matchAll(re)) {
          let v = parseFloat(m[1].replace(/,/g, ""));
          const suffix = (m[2] ?? "").toLowerCase();
          if (suffix === "k") v *= 1_000;
          if (suffix === "m") v *= 1_000_000;
          if (!moneyByAnswer.has(q.id)) moneyByAnswer.set(q.id, new Set());
          moneyByAnswer.get(q.id)!.add(String(v));
        }
      }
    }
  });
  const allMoney = new Set<string>();
  for (const vals of moneyByAnswer.values()) for (const v of vals) allMoney.add(v);
  if (moneyByAnswer.size >= 2 && allMoney.size >= 2) {
    const fmt = [...allMoney]
      .map((v) => "$" + Number(v).toLocaleString())
      .join(" and ");
    findings.push({
      sev: "red",
      dim: "evidence",
      title: "Contradictory revenue figures.",
      body: `Different answers state ${fmt}. This is the first thing a partner cross-checks. Use one number everywhere and define the period.`,
    });
  }

  // 3c. Contradictory launch timelines.
  const timeline = new Map<string, number>();
  answered.forEach((q, i) => {
    const m = /\b(?:launched|shipped|live|started)\b[^.]{0,40}?\b(\d+)\s*(week|month|year)s?\b/i.exec(
      texts[i]
    );
    if (m) {
      const n = parseInt(m[1], 10);
      const unit = m[2].toLowerCase();
      const weeks = unit === "week" ? n : unit === "month" ? n * 4.35 : n * 52;
      timeline.set(q.id, Math.round(weeks));
    }
  });
  const spans = [...new Set(timeline.values())];
  if (spans.length >= 2 && Math.max(...spans) - Math.min(...spans) > 4) {
    findings.push({
      sev: "red",
      dim: "evidence",
      title: "Your timeline doesn't line up.",
      body: `Different answers imply you launched about ${Math.min(...spans)} and ${Math.max(...spans)} weeks ago. Partners divide progress by time, so an inconsistent timeline undermines every metric you give.`,
    });
  }

  // 4. One-liner promises something the product description never mentions.
  const one = (data.answers["one_liner"] ?? "").trim().toLowerCase();
  const desc = (data.answers["product_description"] ?? "").trim().toLowerCase();
  if (one && desc) {
    const oneKeys = one
      .split(/\W+/)
      .filter((t) => t.length > 4 && !["their", "which", "there"].includes(t));
    const missing = oneKeys.filter((t) => !desc.includes(t.slice(0, 5)));
    if (oneKeys.length >= 2 && missing.length === oneKeys.length) {
      findings.push({
        sev: "amber",
        dim: "clarity",
        title: "Your one-liner and product description don't overlap.",
        body: "Nothing from your 50-character description appears in the longer one. Partners read them back to back; they should tell the same story.",
      });
    }
  }

  // 5. Full-time claim vs work duration.
  const dur = (data.answers["work_duration"] ?? "").toLowerCase();
  if (dur && /part[- ]time|nights and weekends|on the side/.test(dur)) {
    findings.push({
      sev: "amber",
      dim: "ambition",
      title: "Not full-time yet.",
      body: "Partners weight this heavily. If you are not full-time, state the specific condition that changes it, not an open-ended maybe.",
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// The full-application audit
// ---------------------------------------------------------------------------

export interface SectionAudit {
  id: string;
  title: string;
  answered: number;
  total: number;
  score: number;
  audits: QuestionAudit[];
}

export interface FullAudit {
  total: number;
  verdictTitle: string;
  verdictBody: string;
  coverage: number;
  answered: number;
  totalQuestions: number;
  clarity: number;
  evidence: number;
  insight: number;
  ambition: number;
  sections: SectionAudit[];
  crossFindings: Finding[];
  /** Highest-impact fixes across the whole application, worst first. */
  priorities: { questionId: string; label: string; finding: Finding }[];
  reds: number;
  ambers: number;
  greens: number;
}

export function auditApplication(data: AppData): FullAudit {
  const audits = new Map<string, QuestionAudit>();
  for (const q of QUESTIONS) {
    audits.set(q.id, auditAnswer(q, data.answers[q.id] ?? ""));
  }

  const sections: SectionAudit[] = SECTIONS.map((s) => {
    const qs = QUESTIONS.filter((q) => q.section === s.id);
    const list = qs.map((q) => audits.get(q.id)!);
    const answered = list.filter((a) => a.answered).length;
    const avg = answered
      ? list.filter((a) => a.answered).reduce((x, a) => x + a.score, 0) / answered
      : 0;
    const completion = qs.length ? answered / qs.length : 0;
    return {
      id: s.id,
      title: s.title,
      answered,
      total: qs.length,
      score: Math.round(avg * completion * 10) / 10,
      audits: list,
    };
  });

  const crossFindings = crossChecks(data);

  // Rubric dimensions, aggregated from every finding across the application.
  const dims = { clarity: 8.5, evidence: 7.5, insight: 7.5, ambition: 6.5 };
  const allFindings = [
    ...[...audits.values()].flatMap((a) => a.findings),
    ...crossFindings,
  ];
  for (const f of allFindings) {
    const d = f.dim ?? "clarity";
    if (f.sev === "red") dims[d] -= 1.4;
    else if (f.sev === "amber") dims[d] -= 0.5;
    else dims[d] += 0.45;
  }

  // Ambition is judged on scope language across the whole application.
  const allText = QUESTIONS.map((q) => data.answers[q.id] ?? "").join(" ");
  const amb = hits(allText, AMBITION_MARKERS);
  dims.ambition += Math.min(3, amb.length * 0.5);

  const clamp = (v: number) => Math.max(1, Math.min(10, Math.round(v * 10) / 10));
  const clarity = clamp(dims.clarity);
  const evidence = clamp(dims.evidence);
  const insight = clamp(dims.insight);
  const ambition = clamp(dims.ambition);

  const answered = [...audits.values()].filter((a) => a.answered).length;
  const coverage = Math.round((answered / QUESTIONS.length) * 100);
  // Unanswered questions genuinely lower the strength of an application: a
  // blank application is worth nothing, and a half-finished one is not
  // half-strong.
  const completeness = Math.pow(answered / QUESTIONS.length, 0.75);
  const total = Math.round(
    totalFromScores(clarity, evidence, insight, ambition) * completeness
  );
  const [verdictTitle, verdictBody] = verdictForTotal(total);

  // Prioritized fix list: reds first, then ambers, in application order.
  const priorities: FullAudit["priorities"] = [];
  for (const sev of ["red", "amber"] as Sev[]) {
    for (const q of QUESTIONS) {
      const a = audits.get(q.id)!;
      for (const f of a.findings) {
        if (f.sev === sev) {
          priorities.push({ questionId: q.id, label: q.label, finding: f });
        }
      }
    }
    for (const f of crossFindings) {
      if (f.sev === sev) {
        priorities.push({
          questionId: "",
          label: "Across the whole application",
          finding: f,
        });
      }
    }
  }

  const count = (s: Sev) => allFindings.filter((f) => f.sev === s).length;

  return {
    total,
    verdictTitle,
    verdictBody,
    coverage,
    answered,
    totalQuestions: QUESTIONS.length,
    clarity,
    evidence,
    insight,
    ambition,
    sections,
    crossFindings,
    priorities: priorities.slice(0, 12),
    reds: count("red"),
    ambers: count("amber"),
    greens: count("green"),
  };
}
