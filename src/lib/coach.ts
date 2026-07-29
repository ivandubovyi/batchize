// Batchize Partner: a coach that answers questions about the founder's own
// application. It runs entirely in the browser with no model, no key and no
// network, by reading the same analysis engine the Full check uses. It never
// invents facts about the company: every specific it states is quoted from
// what the founder actually wrote.

import { QUESTIONS, type AppData, type Question } from "./application";
import { auditApplication, auditAnswer, type Finding } from "./analyzer";
import { narrativeCheck, rewriteAnswer, oneLinerIdeas } from "./rewrite";
import { QUESTION_BANK, CATEGORIES, type CatId } from "./interview";

export interface CoachChip {
  label: string;
  send: string;
}

export interface CoachReply {
  text: string;
  chips?: CoachChip[];
}

const has = (t: string, ...words: string[]) =>
  words.some((w) => new RegExp(`\\b${w}`, "i").test(t));

const answered = (d: AppData, id: string) => (d.answers[id] ?? "").trim();

const q = (id: string) => QUESTIONS.find((x) => x.id === id);

const quote = (s: string, max = 120) =>
  `"${s.length > max ? s.slice(0, max).trimEnd() + "…" : s}"`;

const bullet = (xs: string[]) => xs.map((x) => `• ${x}`).join("\n");

/** Which application question is this message about, if any. */
function targetQuestion(text: string): Question | undefined {
  const t = text.toLowerCase();
  const map: [string[], string][] = [
    [["one-liner", "one liner", "oneliner", "50 char", "describe what"], "one_liner"],
    [["product description", "what we make", "what you make", "what is your company going to make", "product"], "product_description"],
    [["traction", "how far", "progress", "metrics", "growth"], "how_far"],
    [["why this idea", "why me", "why you", "why did", "founder market", "founder-market"], "why_idea"],
    [["competitor", "competition", "alternative", "rivals"], "competitors"],
    [["revenue", "make money", "pricing", "charge", "business model"], "money"],
    [["equity", "split", "ownership", "cap table"], "equity_split"],
    [["user", "customers", "how many"], "users"],
    [["video", "intro video"], "video_script"],
    [["cofounder", "co-founder", "how did you meet", "met"], "how_met"],
    [["what's new", "whats new", "substitute", "why now"], "whats_new"],
  ];
  for (const [keys, id] of map) {
    if (keys.some((k) => t.includes(k))) return q(id);
  }
  return undefined;
}

const DEFAULT_CHIPS: CoachChip[] = [
  { label: "What's my weakest answer?", send: "What is my weakest answer?" },
  { label: "What should I fix first?", send: "What should I fix first?" },
  { label: "Fix my one-liner", send: "Help me with my one-liner" },
  { label: "What will they ask me?", send: "What will they ask in the interview?" },
];

function emptyState(): CoachReply {
  return {
    text: [
      "I read your saved application and answer from what is actually in it, so there is nothing for me to work with yet.",
      "",
      "Start with either of these and come back. I will have plenty to say:",
      bullet([
        "Quick score: eleven short questions, about a minute.",
        "Application: the real questions, starting with your one-liner and how far along you are.",
      ]),
    ].join("\n"),
    chips: [
      { label: "What do you actually do?", send: "What can you help me with?" },
    ],
  };
}

function capabilities(d: AppData): CoachReply {
  const n = QUESTIONS.filter((x) => answered(d, x.id)).length;
  return {
    text: [
      `I am a coach for this specific application. I have read all ${n} answers you have written and I answer using them, quoting your own words back at you.`,
      "",
      "Things worth asking me:",
      bullet([
        "What is my weakest answer, or what should I fix first",
        "Help me with my one-liner (or traction, competitors, why this idea)",
        "Rewrite this for me, once you have written something",
        "What will they ask me in the interview",
        "How am I doing, or am I ready to submit",
        "What story does my application tell",
      ]),
      "",
      "I run entirely in your browser. Nothing you write is sent anywhere, and I never invent facts about your company.",
    ].join("\n"),
    chips: DEFAULT_CHIPS,
  };
}

function findingLine(f: Finding): string {
  return `${f.title} ${f.body}`;
}

// ---------------------------------------------------------------------------
// Intent handlers
// ---------------------------------------------------------------------------

function weakest(d: AppData): CoachReply {
  const audit = auditApplication(d);
  if (!audit.priorities.length) {
    const blanks = QUESTIONS.filter((x) => !answered(d, x.id));
    if (blanks.length) {
      return {
        text: [
          "Nothing you have written is setting off alarms, which is a good place to be.",
          "",
          `Your weak point right now is coverage: ${blanks.length} of ${QUESTIONS.length} questions are still blank. The next one is:`,
          "",
          `${blanks[0].label}`,
          "",
          blanks[0].tip,
        ].join("\n"),
        chips: [
          { label: "What should I fix first?", send: "What should I fix first?" },
          { label: "How am I doing?", send: "How am I doing?" },
        ],
      };
    }
    return {
      text: "Every question is answered and nothing is flagged. At this point the useful work is rehearsing the interview out loud rather than editing further.",
      chips: [{ label: "What will they ask me?", send: "What will they ask in the interview?" }],
    };
  }
  const top = audit.priorities.slice(0, 3);
  return {
    text: [
      `Your weakest points, worst first. There ${audit.reds === 1 ? "is 1 red flag" : `are ${audit.reds} red flags`} in total.`,
      "",
      ...top.map((p, i) =>
        [
          `${i + 1}. ${p.label.length > 70 ? p.label.slice(0, 70) + "…" : p.label}`,
          `   ${findingLine(p.finding)}`,
          p.finding.evidence ? `   You wrote: ${quote(p.finding.evidence, 90)}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      ),
    ].join("\n"),
    chips: [
      { label: "How do I fix the first one?", send: `Help me with ${top[0].label.slice(0, 40)}` },
      { label: "What story does this tell?", send: "What story does my application tell?" },
    ],
  };
}

function nextStep(d: AppData): CoachReply {
  const audit = auditApplication(d);
  const blanks = QUESTIONS.filter((x) => !answered(d, x.id));
  const firstRed = audit.priorities.find((p) => p.finding.sev === "red");

  const lines: string[] = [];
  if (firstRed) {
    lines.push(
      "Fix this first, because it is the kind of thing that gets an application skimmed and set down:",
      "",
      `${firstRed.label.length > 70 ? firstRed.label.slice(0, 70) + "…" : firstRed.label}`,
      `${findingLine(firstRed.finding)}`
    );
    if (firstRed.finding.evidence) {
      lines.push(`You wrote: ${quote(firstRed.finding.evidence, 90)}`);
    }
  } else if (blanks.length) {
    lines.push(
      `Nothing is flagged, so the highest-value thing is filling in what is missing. ${blanks.length} questions are blank, starting with:`,
      "",
      blanks[0].label,
      blanks[0].tip
    );
  } else {
    lines.push(
      "Nothing flagged and nothing blank. Move to rehearsing the interview out loud, which is where most of the remaining risk is."
    );
  }

  if (firstRed && blanks.length) {
    lines.push("", `After that, ${blanks.length} questions are still blank.`);
  }
  return {
    text: lines.join("\n"),
    chips: [
      { label: "What else is weak?", send: "What is my weakest answer?" },
      { label: "How am I doing overall?", send: "How am I doing?" },
    ],
  };
}

function scoreSummary(d: AppData): CoachReply {
  const audit = auditApplication(d);
  const nar = narrativeCheck(d);
  const lines = [
    `You are at ${audit.total}/100: ${audit.verdictTitle.toLowerCase()}.`,
    "",
    `Clarity ${audit.clarity}, evidence ${audit.evidence}, insight ${audit.insight}, ambition ${audit.ambition}, out of 10 each.`,
    `${audit.answered} of ${audit.totalQuestions} questions answered, with ${audit.reds} red ${audit.reds === 1 ? "flag" : "flags"} and ${audit.ambers} things to tighten.`,
  ];
  if (nar.spike) {
    lines.push("", `Your strongest card is ${nar.spike}. Lead with it everywhere: the one-liner, the video, the first sentence of every long answer.`);
  }
  const weakestDim = (
    [
      ["clarity", audit.clarity],
      ["evidence", audit.evidence],
      ["insight", audit.insight],
      ["ambition", audit.ambition],
    ] as [string, number][]
  ).sort((a, b) => a[1] - b[1])[0];
  const advice: Record<string, string> = {
    clarity: "cut adjectives and say literally what the product is and does",
    evidence: "put real numbers into your progress answers, however small",
    insight: "show what you saw firsthand that other people have not",
    ambition: "say plainly what this becomes if it works, and who uses it then",
  };
  lines.push("", `Your lowest dimension is ${weakestDim[0]} at ${weakestDim[1]}/10. To move it, ${advice[weakestDim[0]]}.`);
  return {
    text: lines.join("\n"),
    chips: [
      { label: "What should I fix first?", send: "What should I fix first?" },
      { label: "What's my weakest answer?", send: "What is my weakest answer?" },
    ],
  };
}

function aboutQuestion(d: AppData, target: Question): CoachReply {
  const text = answered(d, target.id);
  if (!text) {
    const lines = [
      `You have not answered this one yet:`,
      "",
      target.label,
      "",
      `What it is really asking: ${target.tip}`,
    ];
    return {
      text: lines.join("\n"),
      chips: [{ label: "What should I fix first?", send: "What should I fix first?" }],
    };
  }

  const audit = auditAnswer(target, text);
  const lines = [
    `Your answer to "${target.label.length > 60 ? target.label.slice(0, 60) + "…" : target.label}" scores ${audit.score.toFixed(1)}/10.`,
    "",
    `You wrote: ${quote(text, 200)}`,
  ];

  if (audit.findings.length === 0) {
    lines.push("", "Nothing is wrong with it. It says something concrete and does not hide behind adjectives.");
  } else {
    lines.push("", "What I would change:");
    lines.push(
      audit.findings
        .slice(0, 4)
        .map((f) => `• ${findingLine(f)}`)
        .join("\n")
    );
  }

  // A concrete rewrite where one is possible.
  const rw = rewriteAnswer(target.id, text);
  if (rw.changed && rw.after !== text) {
    lines.push("", "A tighter version, using only your own words:", "", rw.after);
    if (rw.placeholders > 0) {
      lines.push(
        "",
        `The ${rw.placeholders} bracket${rw.placeholders === 1 ? "" : "s"} mark where a real fact belongs. Only you know those, so I left them for you rather than inventing something.`
      );
    }
  }

  // One-liner gets generated candidates too.
  if (target.id === "one_liner") {
    const ideas = oneLinerIdeas(d).filter((i) => i.fits);
    if (ideas.length) {
      lines.push(
        "",
        "Shapes built from your own product description:",
        bullet(ideas.slice(0, 3).map((i) => `${i.text}  (${i.text.length} chars)`)),
        "",
        "These are starting points, not finished pitches. Make them yours."
      );
    }
  }

  return {
    text: lines.join("\n"),
    chips: [
      { label: "What else is weak?", send: "What is my weakest answer?" },
      { label: "What will they ask about this?", send: "What will they ask in the interview?" },
    ],
  };
}

function interviewPrep(d: AppData, text: string): CoachReply {
  const t = text.toLowerCase();
  let cat: CatId | undefined = CATEGORIES.find((c) =>
    t.includes(c.title.toLowerCase().split(" ")[0])
  )?.id;

  // Otherwise target the weakest part of the application.
  if (!cat) {
    const audit = auditApplication(d);
    const far = answered(d, "how_far");
    if (!far || !/\d/.test(far)) cat = "traction";
    else if (audit.priorities.some((p) => p.questionId === "competitors")) cat = "market";
    else if (audit.priorities.some((p) => p.questionId === "why_idea")) cat = "insight";
    else cat = "traction";
  }

  const qs = QUESTION_BANK.filter((x) => x.cat === cat).slice(0, 4);
  const catTitle = CATEGORIES.find((c) => c.id === cat)!.title;

  const lines = [
    `Based on your application, ${catTitle.toLowerCase()} is where you will get pushed hardest. Partners move fast, so answer each of these out loud in under 30 seconds:`,
    "",
    ...qs.map((x) => `• ${x.q}\n  What they are really testing: ${x.probe}`),
  ];

  // Ground it in something they actually wrote.
  const far = answered(d, "how_far");
  if (cat === "traction" && far) {
    lines.push(
      "",
      `When they ask how you know people want this, your current progress answer is what you have to draw on: ${quote(far, 120)}. Lead with the strongest number in there and nothing else.`
    );
  }
  return {
    text: lines.join("\n"),
    chips: [
      { label: "Drill these properly", send: "How am I doing?" },
      { label: "What's my weakest answer?", send: "What is my weakest answer?" },
    ],
  };
}

function storyReply(d: AppData): CoachReply {
  const nar = narrativeCheck(d);
  const lines = [
    `Your story holds together at ${nar.threadStrength}%.`,
    "",
    ...nar.notes.map((n) => `• ${n.title} ${n.body}`),
  ];
  if (nar.spike) {
    lines.push(
      "",
      `Practically: make ${nar.spike} the first thing a partner meets in every answer. Applications that get read twice are unusually strong at one thing, not even across everything.`
    );
  }
  return {
    text: lines.join("\n"),
    chips: [
      { label: "What should I fix first?", send: "What should I fix first?" },
      { label: "How am I doing?", send: "How am I doing?" },
    ],
  };
}

function rewriteReply(d: AppData, text: string): CoachReply {
  const target = targetQuestion(text);
  if (target) return aboutQuestion(d, target);

  // No specific question named: rewrite whichever answer needs it most.
  const audit = auditApplication(d);
  const worst = audit.priorities.find((p) => p.questionId);
  if (!worst) {
    return {
      text: "Tell me which answer to work on and I will tighten it. For example: rewrite my one-liner, or fix my traction answer.",
      chips: DEFAULT_CHIPS,
    };
  }
  const wq = q(worst.questionId);
  return wq
    ? aboutQuestion(d, wq)
    : { text: "Tell me which answer you want tightened.", chips: DEFAULT_CHIPS };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function coachReply(message: string, d: AppData): CoachReply {
  const t = message.trim();
  const anyAnswers = QUESTIONS.some((x) => answered(d, x.id));

  if (!t) return capabilities(d);
  if (has(t, "what can you", "who are you", "help me$", "^help$", "what do you do"))
    return capabilities(d);

  if (!anyAnswers) return emptyState();

  if (has(t, "weakest", "worst", "biggest problem", "what.s wrong", "red flag"))
    return weakest(d);

  if (has(t, "fix first", "what should i do", "next", "priority", "priorities", "improve"))
    return nextStep(d);

  if (has(t, "how am i doing", "score", "ready", "chances", "good enough", "how strong"))
    return scoreSummary(d);

  if (has(t, "interview", "will they ask", "questions they", "partner ask"))
    return interviewPrep(d, t);

  if (has(t, "story", "narrative", "spike", "thread", "coherent"))
    return storyReply(d);

  if (has(t, "rewrite", "tighten", "shorten", "improve this", "make it better", "edit"))
    return rewriteReply(d, t);

  // A named question, e.g. "help me with my one-liner".
  const target = targetQuestion(t);
  if (target) return aboutQuestion(d, target);

  // Nothing matched: be useful rather than apologetic.
  const audit = auditApplication(d);
  return {
    text: [
      "I am not sure which part of your application you mean, so here is where things stand:",
      "",
      `${audit.total}/100, ${audit.reds} red ${audit.reds === 1 ? "flag" : "flags"}, ${audit.answered}/${audit.totalQuestions} answered.`,
      "",
      "Ask me about a specific answer (one-liner, traction, competitors, why this idea, equity) or ask what to fix first.",
    ].join("\n"),
    chips: DEFAULT_CHIPS,
  };
}

export const STARTER_CHIPS = DEFAULT_CHIPS;
