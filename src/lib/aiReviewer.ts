// Claude-powered YC application reviewer. Optional mode: runs in the browser
// with the user's own Anthropic API key. The key is sent only to Anthropic's
// API; answers leave the machine only when this mode is used.

import type AnthropicNS from "@anthropic-ai/sdk";
import {
  type Flag,
  type ReviewResult,
  totalFromScores,
  verdictForTotal,
  sortFlags,
} from "./reviewer";

const MODEL = "claude-opus-5";

const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    clarity: {
      type: "number",
      description: "0-10, one decimal. How immediately understandable the answers are to a partner skimming thousands of applications.",
    },
    evidence: {
      type: "number",
      description: "0-10, one decimal. Concrete, quantified proof: metrics, launch status, honest specifics over adjectives.",
    },
    insight: {
      type: "number",
      description: "0-10, one decimal. Founder-market fit and a non-obvious understanding of the problem others miss.",
    },
    ambition: {
      type: "number",
      description: "0-10, one decimal. Could this plausibly become huge, and do the founders think that way credibly?",
    },
    flags: {
      type: "array",
      description: "3 to 7 specific, actionable findings, most severe first.",
      items: {
        type: "object",
        properties: {
          sev: { type: "string", enum: ["red", "amber", "green"] },
          title: {
            type: "string",
            description: "Short bolded lead-in, e.g. 'No numbers in your traction answer.'",
          },
          body: {
            type: "string",
            description: "One to three sentences: what is wrong (or right) and exactly how to fix or use it. Quote the applicant's own words where useful.",
          },
        },
        required: ["sev", "title", "body"],
        additionalProperties: false,
      },
    },
  },
  required: ["clarity", "evidence", "insight", "ambition", "flags"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are reviewing a draft Y Combinator application the way an experienced YC partner reads one: fast, literal, and allergic to vagueness. You are on the founder's side: your job is to catch every weakness before a real partner does, so be blunt and specific, not polite.

What partners actually reward: a one-liner a partner can repeat after one read (the application caps it at 50 characters); plain words over adjectives; honest concrete numbers, however small, over impressive-sounding vagueness; lived founder-market fit ("when I was X, I saw Y") over market-size talk; naming the closest competitor or workaround over claiming there is none; consistent numbers across answers.

What sinks applications: buzzwords ("revolutionary", "AI-powered platform", "seamless"), mission-statement language in place of a product description, hedging ("we hope", "we think", "trying to"), traction answers with zero metrics, "no competitors" claims, contradictory numbers between answers, and scope so small it could never be a big company.

Score each rubric dimension 0-10 (one decimal). Be calibrated: 8+ means a partner would forward this to the group; 5-6 is a typical unpolished draft; below 4 means it actively undersells the team. Produce 3-7 flags: every genuine red flag, the most important ambers, and at most two greens for what is genuinely working. Anchor each flag in the applicant's actual words. Never invent facts about the company; judge only what is written.`;

export interface AnswerSection {
  label: string;
  text: string;
}

function buildUserPrompt(sections: AnswerSection[]): string {
  return [
    "Review these draft YC application answers. Judge the application as a whole: cross-check numbers and story between answers, not just each answer alone.",
    ...sections.map(
      (s) => `## ${s.label}\n${s.text.trim() ? s.text.trim() : "(left blank)"}`
    ),
  ].join("\n\n");
}

export function coreSections(
  one: string,
  make: string,
  why: string,
  far: string
): AnswerSection[] {
  return [
    { label: "Describe what your company does (50 chars max)", text: one },
    { label: "What is your company going to make?", text: make },
    { label: "Why did you pick this idea to work on?", text: why },
    { label: "How far along are you?", text: far },
  ];
}

export class AiReviewError extends Error {
  constructor(message: string, readonly recoverable: boolean = true) {
    super(message);
    this.name = "AiReviewError";
  }
}

interface RawAiReview {
  clarity: number;
  evidence: number;
  insight: number;
  ambition: number;
  flags: Flag[];
}

const clamp10 = (v: number) =>
  Math.max(0, Math.min(10, Math.round(v * 10) / 10));

export async function reviewWithClaude(
  apiKey: string,
  sections: AnswerSection[]
): Promise<ReviewResult> {
  // Loaded on demand so the SDK stays out of the landing-page bundle.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({
    apiKey,
    // The user supplies their own key in their own browser; it is sent only
    // to Anthropic's API, never to any server of ours.
    dangerouslyAllowBrowser: true,
  });

  let response: AnthropicNS.Beta.BetaMessage;
  try {
    // Server-side refusal fallback is opted in by default, as recommended
    // for claude-opus-5: if safety classifiers decline the request, the API
    // re-runs it on Anthropic's recommended fallback model in the same call.
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(sections) }],
      output_config: {
        format: { type: "json_schema", schema: REVIEW_SCHEMA },
      },
    } as AnthropicNS.Beta.MessageCreateParamsNonStreaming);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new AiReviewError(
        "Anthropic rejected the API key. Check it in the Anthropic Console and paste it again."
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new AiReviewError(
        "Your Anthropic account is rate-limited right now. Wait a minute and try again, or use the instant rules review."
      );
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new AiReviewError(
        "Could not reach Anthropic's API. Check your connection and try again."
      );
    }
    if (err instanceof Anthropic.APIError) {
      throw new AiReviewError(
        `Anthropic API error (${err.status ?? "unknown"}): ${err.message}`
      );
    }
    throw err;
  }

  // Check the stop reason before reading content, because safety classifiers can
  // decline with a normal HTTP 200 and stop_reason "refusal".
  if (response.stop_reason === "refusal") {
    throw new AiReviewError(
      "Claude declined to review this content. Try rewording your answers, or use the instant rules review."
    );
  }
  if (response.stop_reason === "max_tokens") {
    throw new AiReviewError(
      "The review was cut off before it finished. Try again."
    );
  }

  const textBlock = response.content.find(
    (b): b is AnthropicNS.Beta.BetaTextBlock => b.type === "text"
  );
  if (!textBlock) {
    throw new AiReviewError("Claude returned an empty review. Try again.");
  }

  let raw: RawAiReview;
  try {
    raw = JSON.parse(textBlock.text) as RawAiReview;
  } catch {
    throw new AiReviewError(
      "Claude's review could not be parsed. Try again."
    );
  }

  const clarity = clamp10(raw.clarity);
  const evidence = clamp10(raw.evidence);
  const insight = clamp10(raw.insight);
  const ambition = clamp10(raw.ambition);
  const total = totalFromScores(clarity, evidence, insight, ambition);
  const [verdictTitle, verdictBody] = verdictForTotal(total);

  const flags: Flag[] = (raw.flags ?? []).filter(
    (f) =>
      (f.sev === "red" || f.sev === "amber" || f.sev === "green") &&
      typeof f.title === "string" &&
      typeof f.body === "string"
  );
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
    reviewer: "claude",
  };
}
