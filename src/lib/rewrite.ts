// Rewrite and brainstorm: the two things a checker alone can't do. Every
// suggestion is built from the founder's own words, deterministically, in the
// browser. Nothing is invented and nothing is uploaded.

import { QUESTIONS, type AppData } from "./application";

// ---------------------------------------------------------------------------
// Rewrite: turn a weak answer into a better-structured one, using only the
// founder's own content.
// ---------------------------------------------------------------------------

/**
 * Hype adjectives carry no information, so they are simply deleted. Deleting
 * an adjective can never break the sentence around it.
 */
const HYPE_ADJECTIVES =
  /\b(cutting[- ]edge|state[- ]of[- ]the[- ]art|best[- ]in[- ]class|world[- ]class|holistic|turnkey|seamless|frictionless|innovative|next[- ]gen(?:eration)?|mission[- ]critical|value[- ]add|bleeding[- ]edge|game[- ]changing)\s*/gi;

/**
 * Verbs with a plain-English equivalent. Inflections are listed longest-first
 * so "leveraging" becomes "using" rather than "useing".
 */
const VERB_SWAPS: [RegExp, string][] = [
  [/\bleveraging\b/gi, "using"],
  [/\bleverages\b/gi, "uses"],
  [/\bleveraged\b/gi, "used"],
  [/\bleverage\b/gi, "use"],
  [/\butilizing\b|\butilising\b/gi, "using"],
  [/\butilizes\b|\butilises\b/gi, "uses"],
  [/\butilize\b|\butilise\b/gi, "use"],
  [/\bempowering\b/gi, "letting"],
  [/\bempowers\b/gi, "lets"],
  [/\bempowered\b/gi, "let"],
  [/\bempower\b/gi, "let"],
];

/**
 * Claims that need a fact underneath them. These become a bracketed prompt,
 * because only the founder knows the real answer and we will not invent it.
 */
const CLAIM_PROMPTS: [RegExp, string][] = [
  [/\brevolutionar\w*|\brevolutioniz\w*|\brevolutionis\w*/gi, "[what it actually changes]"],
  [/\bdisrupt\w*/gi, "[what it replaces]"],
  [/\bdemocratiz\w*|\bdemocratis\w*/gi, "[who gets access that didn't before]"],
  [/\bsupercharg\w*|\breimagin\w*/gi, "[the literal improvement]"],
  [/\bsynerg\w*/gi, "[the concrete benefit]"],
  [/\bone-stop shop\b|\bend-to-end solution\b|\bscalable solution\b/gi, "[the actual product]"],
  [/\bparadigm\b/gi, "[the specific change]"],
];

const HEDGE_REPLACEMENTS: [RegExp, string][] = [
  [/\bwe think\b|\bwe believe\b|\bwe feel\b/gi, ""],
  [/\bhopefully\b|\bperhaps\b|\bpossibly\b|\bmaybe\b/gi, ""],
  [/\bwe hope to\b|\bwe aim to\b|\bwe would like to\b|\bwe're looking to\b/gi, "we will"],
  [/\bwe are trying to\b|\bwe're trying to\b|\btrying to\b/gi, "we"],
  [/\bsort of\b|\bkind of\b|\bmore or less\b/gi, ""],
  [/\bshould be able to\b|\bmight be able to\b/gi, "can"],
];

const FILLER_REMOVALS = [
  /\bat the end of the day,?\s*/gi,
  /\bin order to\b/gi,
  /\bit is important to note that\b/gi,
  /\bit's important to note that\b/gi,
  /\bneedless to say,?\s*/gi,
  /\bbasically,?\s*/gi,
  /\bessentially,?\s*/gi,
  /\bobviously,?\s*/gi,
  /\bwhen it comes to\b/gi,
  /\bin terms of\b/gi,
  /\bas you know,?\s*/gi,
];

export interface RewriteStep {
  label: string;
  detail: string;
}

export interface RewriteResult {
  before: string;
  after: string;
  steps: RewriteStep[];
  /** Placeholders the founder still has to fill in themselves. */
  placeholders: number;
  changed: boolean;
}

function tidy(s: string): string {
  return (
    s
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([.,;:!?])/g, "$1")
      // Deleting an adjective can strand a comma: "with a, solution".
      .replace(/\b(a|an|the)\s*,\s*/gi, "$1 ")
      .replace(/,\s*,/g, ",")
      .replace(/,\s*\./g, ".")
      .replace(/([.,;:!?])(?=[A-Za-z])/g, "$1 ")
      .replace(/\.\s*\./g, ".")
      .replace(/^\s*[,;]\s*/, "")
      // "a innovative" style artefacts left by deletions.
      .replace(/\ba\s+(?=[aeiou])/gi, "an ")
      .trim()
  );
}

function sentenceCase(s: string): string {
  return s.replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase());
}

/** Rewrites one answer, showing each edit it made and why. */
export function rewriteAnswer(questionId: string, raw: string): RewriteResult {
  const before = raw.trim();
  let out = before;
  const steps: RewriteStep[] = [];

  if (!before) {
    return { before, after: "", steps, placeholders: 0, changed: false };
  }

  // 1. Filler
  let fillerCount = 0;
  for (const re of FILLER_REMOVALS) {
    const hits = out.match(re);
    if (hits) {
      fillerCount += hits.length;
      out = out.replace(re, re.source.includes("in order to") ? "to" : "");
    }
  }
  if (fillerCount) {
    steps.push({
      label: `Cut ${fillerCount} filler phrase${fillerCount === 1 ? "" : "s"}`,
      detail: "Words that added length without adding information.",
    });
  }

  // 2. Hedging
  let hedgeCount = 0;
  for (const [re, rep] of HEDGE_REPLACEMENTS) {
    const hits = out.match(re);
    if (hits) {
      hedgeCount += hits.length;
      out = out.replace(re, rep);
    }
  }
  if (hedgeCount) {
    steps.push({
      label: `Removed ${hedgeCount} hedge${hedgeCount === 1 ? "" : "s"}`,
      detail: "Confidence reads as competence. Claims now stand on their own.",
    });
  }

  // 3a. Delete hype adjectives outright.
  const hype = out.match(HYPE_ADJECTIVES);
  if (hype) {
    out = out.replace(HYPE_ADJECTIVES, "");
    steps.push({
      label: `Deleted ${hype.length} hype adjective${hype.length === 1 ? "" : "s"}`,
      detail: `Removed ${hype.map((h) => h.trim()).slice(0, 3).join(", ")}. They describe nothing a partner can picture.`,
    });
  }

  // 3b. Swap inflated verbs for plain ones, keeping the tense intact.
  let swaps = 0;
  for (const [re, rep] of VERB_SWAPS) {
    const found = out.match(re);
    if (found) {
      swaps += found.length;
      out = out.replace(re, rep);
    }
  }
  if (swaps) {
    steps.push({
      label: `Plainer wording in ${swaps} place${swaps === 1 ? "" : "s"}`,
      detail: "Words like leverage and empower replaced with what they mean.",
    });
  }

  // 3c. Turn unbacked claims into a prompt for the missing fact.
  let claims = 0;
  for (const [re, rep] of CLAIM_PROMPTS) {
    const found = out.match(re);
    if (found) {
      claims += found.length;
      out = out.replace(re, rep);
    }
  }
  if (claims) {
    steps.push({
      label: `${claims} claim${claims === 1 ? "" : "s"} need a fact`,
      detail:
        "Each bracket marks where a real detail belongs. Only you know it, so it is left for you to fill in rather than invented.",
    });
  }

  // 4. Split run-on sentences at conjunctions
  const longSentence = out
    .split(/(?<=[.!?])\s+/)
    .find((s) => s.split(/\s+/).length > 40);
  if (longSentence) {
    const split = longSentence.replace(
      /,\s+(and|but|which|so)\s+/gi,
      ". "
    );
    if (split !== longSentence) {
      out = out.replace(longSentence, split);
      steps.push({
        label: "Split a run-on sentence",
        detail: "One idea per sentence survives skimming.",
      });
    }
  }

  out = sentenceCase(tidy(out));

  // 5. Question-specific structure hints
  const q = QUESTIONS.find((x) => x.id === questionId);
  if (q?.kind === "oneliner" && out.length > 50) {
    steps.push({
      label: `Still ${out.length} characters, cap is 50`,
      detail:
        'Try the shape "[Product] is [what] for [who]" and drop every adjective.',
    });
  }

  const placeholders = (out.match(/\[/g) ?? []).length;
  return {
    before,
    after: out,
    steps,
    placeholders,
    changed: out !== before || steps.length > 0,
  };
}

// ---------------------------------------------------------------------------
// One-liner candidate generator: builds options from the founder's own
// product description rather than inventing a pitch.
// ---------------------------------------------------------------------------

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "for", "with", "that", "this", "our",
  "we", "you", "they", "it", "is", "are", "to", "of", "in", "on", "at", "by",
  "from", "as", "their", "your", "them", "into", "can", "will", "so", "then",
  "every", "each", "all", "any", "more", "most", "very", "just", "also",
]);

export interface OneLinerIdea {
  text: string;
  shape: string;
  fits: boolean;
}

export function oneLinerIdeas(data: AppData): OneLinerIdea[] {
  const desc = (data.answers["product_description"] ?? "").trim();
  const who = (data.answers["users"] ?? "").trim();
  if (!desc) return [];

  const wordsOf = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w));

  // Crude stem so "broker" and "brokers" are recognised as one concept.
  const stem = (w: string) => w.replace(/(ies|es|s)$/, "").replace(/ing$/, "");

  // Verbs make poor one-liner nouns ("Connects for brokers").
  const VERBISH = new Set([
    "connect", "connects", "see", "sees", "use", "uses", "make", "makes",
    "get", "gets", "help", "helps", "work", "works", "generate", "generates",
    "generated", "send", "sends", "create", "creates", "build", "builds",
    "run", "runs", "show", "shows", "let", "lets", "give", "gives", "take",
    "takes", "put", "puts", "click", "clicks", "open", "opens", "need",
    "needs", "want", "wants", "have", "has", "does", "doing", "instead",
  ]);

  // Keep the original casing so acronyms stay uppercase in suggestions.
  const casing = new Map<string, string>();
  for (const tok of desc.match(/\b[A-Za-z][A-Za-z0-9-]*\b/g) ?? []) {
    const lower = tok.toLowerCase();
    if (!casing.has(lower) || /^[A-Z]{2,}$/.test(tok)) casing.set(lower, tok);
  }
  const display = (w: string) => {
    const orig = casing.get(w);
    return orig && /^[A-Z]{2,}$/.test(orig) ? orig : w;
  };

  const isAcronym = (w: string) => /^[A-Z]{2,}$/.test(casing.get(w) ?? "");

  const freq = new Map<string, { word: string; plural?: string; n: number }>();
  for (const w of wordsOf(desc)) {
    if (VERBISH.has(w) || VERBISH.has(stem(w))) continue;
    const k = stem(w);
    const cur = freq.get(k);
    freq.set(k, {
      word: cur?.word ?? w,
      // Remember the plural form so audiences read naturally.
      plural: cur?.plural ?? (w.endsWith("s") && !isAcronym(w) ? w : undefined),
      n: (cur?.n ?? 0) + 1,
    });
  }
  // Generic nouns make weak one-liners, so they lose ties.
  const GENERIC = new Set([
    "step", "steps", "thing", "things", "way", "ways", "place", "time",
    "part", "side", "stuff", "item", "items", "type", "kind", "point",
    "level", "area", "based", "instantly", "automatically", "one",
  ]);
  const firstSentence = desc.split(/(?<=[.!?])\s/)[0]?.toLowerCase() ?? "";

  const ranked = [...freq.entries()]
    .map(([k, v]) => ({
      key: k,
      word: v.word,
      plural: v.plural,
      // Repetition, appearing in the opening sentence, and being a specific
      // word all make a term more likely to be the actual subject.
      score:
        v.n * 3 +
        (firstSentence.includes(v.word) ? 3 : 0) +
        (v.word.length >= 6 ? 2 : 0) +
        (GENERIC.has(v.word) ? -6 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  // Audience: a plural noun naming people, never an acronym like TMS.
  const audienceWord =
    wordsOf(who).find((w) => w.endsWith("s") && w.length > 3 && !isAcronym(w)) ??
    ranked.find((r) => r.plural && r.plural.length > 3)?.plural ??
    "teams";
  const audienceKey = stem(audienceWord);

  // Concepts distinct from the audience, so we never emit "Broker for brokers".
  const concepts = ranked
    .filter((r) => r.key !== audienceKey)
    .map((r) => r.word);
  if (concepts.length === 0) return [];

  const thing = display(concepts[0]);
  const second = concepts[1] ? display(concepts[1]) : undefined;
  const cap = (s: string) =>
    /^[A-Z]{2,}$/.test(s) ? s : s.charAt(0).toUpperCase() + s.slice(1);

  const raw: { text: string; shape: string }[] = [
    { text: `${cap(thing)} for ${audienceWord}`, shape: "[Thing] for [who]" },
  ];
  if (second) {
    raw.push({
      text: `${cap(second)} ${thing} for ${audienceWord}`,
      shape: "[Detail] [thing] for [who]",
    });
    raw.push({
      text: `${cap(thing)} and ${second}, automated`,
      shape: "[Thing] and [thing], automated",
    });
  }
  raw.push({
    text: `The ${thing} layer for ${audienceWord}`,
    shape: "The [thing] layer for [who]",
  });

  return raw
    .filter((r, i, arr) => arr.findIndex((x) => x.text === r.text) === i)
    .map((r) => ({ ...r, fits: r.text.length <= 50 }));
}

// ---------------------------------------------------------------------------
// Brainstorm: question-specific prompts that pull from what the founder has
// already written, so the page is never blank.
// ---------------------------------------------------------------------------

export interface BrainstormPrompt {
  q: string;
  why: string;
}

export interface BrainstormPack {
  questionId: string;
  label: string;
  outline: string[];
  prompts: BrainstormPrompt[];
}

const PACKS: Record<string, { outline: string[]; prompts: BrainstormPrompt[] }> = {
  one_liner: {
    outline: [
      "Name the product",
      "Say the category a partner already understands",
      "Name exactly who uses it",
    ],
    prompts: [
      { q: "If a partner had to repeat your product to a colleague after one read, what words would they use?", why: "That sentence is your one-liner." },
      { q: "What existing product is yours the equivalent of, for a different audience?", why: '"Stripe for X" works because both halves are already understood.' },
      { q: "Delete every adjective from your description. What is left?", why: "What remains is usually the honest version." },
    ],
  },
  product_description: {
    outline: [
      "What a user connects or opens first",
      "What the product does automatically",
      "What they see at the end",
      "What that replaces today",
    ],
    prompts: [
      { q: "Walk through the first 60 seconds a new user spends in your product. What do they click?", why: "Concrete mechanics prove the thing exists." },
      { q: "What is the single screen that matters most, and what is on it?", why: "Partners picture products through their main screen." },
      { q: "Which manual step does your product delete entirely?", why: "Deleting a step is a stronger claim than improving one." },
    ],
  },
  how_far: {
    outline: [
      "Launched or not, and when exactly",
      "Your single strongest number",
      "The rate it is changing",
      "What you shipped most recently",
    ],
    prompts: [
      { q: "What is the one number you would put on a slide if you could only show one?", why: "Lead with it. Partners read the first line hardest." },
      { q: "What did this number look like four weeks ago?", why: "The rate of change matters more than the level." },
      { q: "If the number is small, what does it prove anyway?", why: "10 users who return weekly beats 5,000 signups who never came back." },
    ],
  },
  why_idea: {
    outline: [
      "The moment you personally hit this problem",
      "What you saw that most people never see",
      "Evidence other people have it too",
      "Why you specifically can fix it",
    ],
    prompts: [
      { q: "Where were you, and what were you doing, the first time this problem cost you something?", why: "A specific scene is more convincing than a claim of expertise." },
      { q: "What did you believe about this space that turned out to be wrong?", why: "Being wrong once, specifically, is proof of contact with reality." },
      { q: "How many people have you spoken to, and what did the most surprising one say?", why: "One real quote beats any market statistic." },
    ],
  },
  competitors: {
    outline: [
      "The closest named products",
      "What people do with no product at all",
      "The one thing you understand that they act against",
    ],
    prompts: [
      { q: "If your product vanished tonight, what would your users do tomorrow morning?", why: "That is your real competitor, even if it's a spreadsheet." },
      { q: "What does the biggest player in your space deliberately refuse to do?", why: "Their constraint is usually your opening." },
      { q: "Which competitor would find your insight hardest to copy, and why?", why: "Structural reasons beat 'we execute better'." },
    ],
  },
  whats_new: {
    outline: [
      "What people resort to today",
      "Why that is bad, with a number if possible",
      "What changed that makes your way possible now",
    ],
    prompts: [
      { q: "What became possible in the last two years that wasn't before?", why: "Why-now is half of what partners are testing here." },
      { q: "How long does the current workaround take, in hours or days?", why: "Quantifying the pain quantifies the opportunity." },
    ],
  },
  money: {
    outline: [
      "Who pays and how much",
      "How you picked that price",
      "Bottom-up math to a big number",
    ],
    prompts: [
      { q: "Multiply your price by a realistic number of customers. What do you get?", why: "Bottom-up beats a top-down market slide every time." },
      { q: "Have you ever charged anyone this price? What happened?", why: "A price tested on a real customer is worth more than any model." },
    ],
  },
  hacked_system: {
    outline: [
      "The situation and what you needed",
      "The unusual thing you did",
      "The concrete outcome",
    ],
    prompts: [
      { q: "When did you get something most people are told is impossible to get?", why: "Partners are looking for resourcefulness, not rule-breaking." },
      { q: "What is the outcome you can point to, in one measurable line?", why: "A story without an outcome reads as an anecdote." },
    ],
  },
};

export function brainstormFor(
  questionId: string,
  data: AppData
): BrainstormPack | null {
  const q = QUESTIONS.find((x) => x.id === questionId);
  const pack = PACKS[questionId];
  if (!q || !pack) return null;
  return {
    questionId,
    label: q.label,
    outline: pack.outline,
    prompts: pack.prompts,
  };
}

export const BRAINSTORMABLE = Object.keys(PACKS);

// ---------------------------------------------------------------------------
// Narrative: the story the whole application tells.
// ---------------------------------------------------------------------------

export interface NarrativeResult {
  spike: string | null;
  threadStrength: number; // 0-100
  notes: { sev: "red" | "amber" | "green"; title: string; body: string }[];
}

export function narrativeCheck(data: AppData): NarrativeResult {
  const a = (id: string) => (data.answers[id] ?? "").trim().toLowerCase();
  const notes: NarrativeResult["notes"] = [];

  const why = a("why_idea");
  const desc = a("product_description");
  const far = a("how_far");
  const comp = a("competitors");

  // Does the founder story connect to the product?
  const wordsOf = (s: string) =>
    new Set(
      s
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 4 && !STOP.has(w))
    );
  const whyWords = wordsOf(why);
  const descWords = wordsOf(desc);
  const overlap = [...whyWords].filter((w) => descWords.has(w));

  let thread = 0;
  if (why && desc) {
    if (overlap.length >= 3) {
      thread += 40;
      notes.push({
        sev: "green",
        title: "Your story connects to your product.",
        body: `The experience you describe and the product you build share the same specifics (${overlap.slice(0, 3).join(", ")}). That thread is what partners remember.`,
      });
    } else {
      notes.push({
        sev: "amber",
        title: "Your story and your product read as separate.",
        body: "The experience in your idea answer barely overlaps with what you say you're building. Make the link explicit: the thing you lived should be the thing you fixed.",
      });
    }
  }

  // Is there a spike: one dimension that is clearly strongest?
  const signals: { name: string; score: number }[] = [
    { name: "traction", score: (far.match(/\d/g) ?? []).length },
    { name: "founder-market fit", score: overlap.length * 2 },
    { name: "market insight", score: comp.length > 120 ? 6 : comp.length > 40 ? 3 : 0 },
  ];
  signals.sort((x, y) => y.score - x.score);
  // Report the strongest card whenever one is genuinely strong. A dead heat
  // between two strong signals is still worth naming.
  const spike = signals[0].score >= 4 ? signals[0].name : null;
  const clear = spike && signals[0].score > signals[1].score + 1;

  if (spike) {
    thread += 30;
    notes.push({
      sev: "green",
      title: clear
        ? `Your spike is ${spike}.`
        : `Your strongest card is ${spike}.`,
      body: clear
        ? "This is clearly the best thing about your application. Lead with it in your one-liner, your video, and the first line of every long answer."
        : `${signals[1].name} is nearly as strong. Pick one to lead with everywhere rather than splitting the reader's attention between them.`,
    });
  } else if (why || far) {
    notes.push({
      sev: "amber",
      title: "No clear spike yet.",
      body: "Applications that get read twice are unusually strong at one thing, not even across everything. Decide which of traction, founder-market fit, or insight is your best card and push it.",
    });
  }

  if (far && /\d/.test(far)) thread += 30;

  return { spike, threadStrength: Math.min(100, thread), notes };
}
