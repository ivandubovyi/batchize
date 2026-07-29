// Partner grill. Interview prep from a fixed question bank tells you what
// partners usually ask. This asks what a partner would ask *you*, because
// every question is generated from something actually in your application:
// a number with no denominator, a claim with no evidence, two answers that
// disagree.
//
// The point is not to be clever. It is that the follow-up you cannot answer
// in the ten-minute interview is almost always the one your own application
// invited.

import { QUESTIONS, type AppData } from "./application";
import { auditApplication, type Finding } from "./analyzer";

export interface GrillQuestion {
  /** Where this came from, so the founder can go back and fix the source. */
  sourceQuestionId: string | null;
  sourceLabel: string;
  /** What a partner asks out loud. */
  ask: string;
  /** What they are actually testing. */
  probing: string;
  /** The words in the application that invited it. */
  evidence?: string;
  /** Harder questions first. */
  weight: number;
}

const label = (id: string) =>
  QUESTIONS.find((q) => q.id === id)?.label ?? "your application";

/** Trim evidence to something quotable out loud. */
function quote(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > 120 ? t.slice(0, 117) + "…" : t;
}

/**
 * Turn one finding into the question it invites. Falls back to a generic but
 * still specific prompt rather than dropping the finding, because a founder
 * should be able to defend everything the check flagged.
 */
function askFor(finding: Finding, questionId: string | null): { ask: string; probing: string } | null {
  const t = finding.title.toLowerCase();
  const q = questionId ? label(questionId) : "your application";

  if (t.includes("contradict")) {
    return {
      ask: "Two of your answers give different numbers for the same thing. Which one is right, and when did it change?",
      probing:
        "Whether you know your own numbers. Partners are not testing arithmetic, they are testing whether you look at the data yourself or repeat what a cofounder told you.",
    };
  }
  if (t.includes("buzzword") || t.includes("mission statement")) {
    return {
      ask: "Say what you do again, but as if you were describing it to the person who would use it, not to an investor.",
      probing:
        "Whether there is a concrete product under the adjectives. This is the fastest way to find out if someone is selling a category or a thing.",
    };
  }
  if (t.includes("no number") || t.includes("no evidence") || t.includes("unquantified")) {
    return {
      ask: `You describe progress on "${q.slice(0, 60)}" without a number. What is the number, and what was it a month ago?`,
      probing:
        "Whether the progress is real and whether it is moving. A single number is a claim; two numbers a month apart are a trend.",
    };
  }
  if (t.includes("superlative") || t.includes("unsupported")) {
    return {
      ask: "You make a strong claim there. Who else has tried this, and why did it not work for them?",
      probing:
        "Whether you have looked hard at the competition. Founders who say they are first usually have not searched properly, and partners will search during the interview.",
    };
  }
  if (t.includes("hedge") || t.includes("vague") || t.includes("weasel")) {
    return {
      ask: "Drop the hedge and give me the direct version. What do you actually believe here?",
      probing:
        "Conviction. Hedged language in writing usually means an unresolved argument between cofounders, and partners will find the seam.",
    };
  }
  if (t.includes("signup") || t.includes("waitlist") || t.includes("usage")) {
    return {
      ask: "Of the people who signed up, how many used it this week? And the week before?",
      probing:
        "Retention. Signups are the easiest number to grow and the least predictive one, so this is the first thing a partner converts into a real number.",
    };
  }
  if (t.includes("percent") || t.includes("no base")) {
    return {
      ask: "You give a percentage. What is the denominator?",
      probing:
        "Whether the percentage is hiding a small absolute number. A hundred percent growth from two to four is a fine answer, but only if you say two.",
    };
  }
  if (t.includes("lived experience") || t.includes("why you")) {
    return {
      ask: "Why are you the right people to build this? Not what you know, what you have actually done in this world.",
      probing:
        "Founder-market fit. Partners are trying to work out whether you picked this problem or the problem picked you.",
    };
  }
  if (t.includes("competitor")) {
    return {
      ask: "Name your closest competitor and tell me honestly what they do better than you.",
      probing:
        "Self-awareness. Answering 'nothing' is the wrong answer and partners hear it constantly.",
    };
  }
  if (t.includes("money") || t.includes("revenue") || t.includes("charge")) {
    return {
      ask: "Walk me through the last time somebody paid you. Who were they, what did they pay, and why then?",
      probing:
        "Whether revenue is a plan or an event that has already happened. The specifics are impossible to invent under pressure.",
    };
  }
  if (t.includes("spelled out") || t.includes("passive") || t.includes("filler")) {
    return null; // Style flags do not make good interview questions.
  }

  return {
    ask: `On "${q.slice(0, 60)}": ${finding.body.split(". ")[0]}. What is the specific answer?`,
    probing:
      "The check flagged this as the weakest part of that answer, which means it is where a partner's first follow-up lands.",
  };
}

/**
 * Questions every founder gets, added at the end so a strong application
 * still has something to practise against. These are not derived from
 * findings, so they are marked with a null source.
 */
const STANDARDS: GrillQuestion[] = [
  {
    sourceQuestionId: null,
    sourceLabel: "Asked in almost every interview",
    ask: "What is the biggest thing standing between you and ten times the users you have now?",
    probing:
      "Whether you have identified your real constraint. Founders who name distribution, or a specific technical blocker, are usually the ones working on it.",
    weight: 3,
  },
  {
    sourceQuestionId: null,
    sourceLabel: "Asked in almost every interview",
    ask: "What have you learned in the last month that changed what you are building?",
    probing:
      "Rate of learning. Partners fund the derivative, not the position, and an answer of 'nothing' says you are not talking to users.",
    weight: 3,
  },
  {
    sourceQuestionId: null,
    sourceLabel: "Asked in almost every interview",
    ask: "If we do not fund you, what happens next?",
    probing:
      "Whether the company exists independently of the batch. The right answer is boring and specific, and it is never 'we would stop'.",
    weight: 2,
  },
  {
    sourceQuestionId: null,
    sourceLabel: "Asked in almost every interview",
    ask: "Why has nobody done this already?",
    probing:
      "Whether you understand the market's history. There is always a reason, and 'nobody thought of it' is never it.",
    weight: 3,
  },
];

/**
 * Build the grill from a real application. Ordered hardest first, because the
 * questions you cannot answer are the ones worth the practice time.
 */
export function buildGrill(app: AppData): GrillQuestion[] {
  const audit = auditApplication(app);
  const out: GrillQuestion[] = [];
  const seen = new Set<string>();

  const add = (q: GrillQuestion) => {
    const key = q.ask.toLowerCase().slice(0, 60);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(q);
  };

  for (const f of audit.crossFindings) {
    const made = askFor(f, null);
    if (!made) continue;
    add({
      sourceQuestionId: null,
      sourceLabel: "Across your whole application",
      ask: made.ask,
      probing: made.probing,
      evidence: quote(f.evidence),
      weight: 10,
    });
  }

  for (const p of audit.priorities) {
    const made = askFor(p.finding, p.questionId);
    if (!made) continue;
    add({
      sourceQuestionId: p.questionId,
      sourceLabel: p.label,
      ask: made.ask,
      probing: made.probing,
      evidence: quote(p.finding.evidence),
      weight: p.finding.sev === "red" ? 8 : 5,
    });
  }

  // Standards weigh less than anything derived, so one sort puts the
  // questions your own application invited first and keeps the rest ordered.
  return [...out, ...STANDARDS].sort((a, b) => b.weight - a.weight);
}

export interface GrillSummary {
  fromYourApplication: number;
  standard: number;
  hardest: GrillQuestion | null;
}

export function summariseGrill(list: GrillQuestion[]): GrillSummary {
  const derived = list.filter((q) => q.weight >= 5 && q.evidence !== undefined);
  return {
    fromYourApplication: list.filter((q) => q.sourceLabel !== "Asked in almost every interview").length,
    standard: list.filter((q) => q.sourceLabel === "Asked in almost every interview").length,
    hardest: derived[0] ?? null,
  };
}
