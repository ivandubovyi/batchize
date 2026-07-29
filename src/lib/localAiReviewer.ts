// On-device AI reviewer. Uses the browser's built-in Prompt API (Chrome's
// Gemini Nano) when available: a real AI review with no API key and no cost,
// running entirely on the user's machine. Quality is well below Claude, and
// only some browsers support it, so the UI labels it as experimental.

import {
  type Flag,
  type ReviewResult,
  totalFromScores,
  verdictForTotal,
  sortFlags,
} from "./reviewer";

export type LocalAiStatus =
  | "unsupported"
  | "downloadable"
  | "downloading"
  | "available";

// Minimal typings for the Prompt API (no official @types shipped here).
interface LmSession {
  prompt(
    text: string,
    opts?: { responseConstraint?: object }
  ): Promise<string>;
  destroy?(): void;
}
interface LanguageModelStatic {
  availability(): Promise<string>;
  create(opts?: {
    initialPrompts?: { role: string; content: string }[];
    monitor?: (m: EventTarget) => void;
  }): Promise<LmSession>;
}

function getLanguageModel(): LanguageModelStatic | null {
  const lm = (globalThis as Record<string, unknown>).LanguageModel;
  if (lm && typeof (lm as LanguageModelStatic).availability === "function") {
    return lm as LanguageModelStatic;
  }
  return null;
}

export async function localAiAvailability(): Promise<LocalAiStatus> {
  const LM = getLanguageModel();
  if (!LM) return "unsupported";
  try {
    const a = await LM.availability();
    if (a === "available" || a === "readily") return "available";
    if (a === "downloading" || a === "after-download") return "downloading";
    if (a === "downloadable") return "downloadable";
    return "unsupported";
  } catch {
    return "unsupported";
  }
}

/**
 * Some browsers expose the Prompt API but have no real model behind it and
 * simply echo the prompt back (Chromium builds do this). An echo would sail
 * through as a "review" if it happened to contain JSON, so every response is
 * checked before it is trusted.
 */
export function looksLikeEcho(prompt: string, reply: string): boolean {
  const r = reply.toLowerCase();
  if (
    r.includes("just echoing back") ||
    r.includes("on-device model is not available")
  ) {
    return true;
  }
  // A real review restates at most a short quote. A verbatim run of 60+
  // characters from the prompt means the model handed the input back.
  const p = prompt.toLowerCase().replace(/\s+/g, " ");
  const flat = r.replace(/\s+/g, " ");
  for (let i = 0; i + 60 <= p.length; i += 20) {
    if (flat.includes(p.slice(i, i + 60))) return true;
  }
  return false;
}

/**
 * Confirms a real model is behind the API by sending a canary whose answer
 * cannot be produced by echoing. Cached for the page's lifetime.
 */
let realModelProbe: Promise<boolean> | null = null;
export function probeRealLocalModel(): Promise<boolean> {
  if (!realModelProbe) {
    realModelProbe = (async () => {
      const LM = getLanguageModel();
      if (!LM) return false;
      try {
        const avail = await LM.availability();
        if (avail === "unavailable" || !avail) return false;
        const session = await LM.create();
        const canary = "Reply with exactly one word: OK";
        const reply = await session.prompt(canary);
        session.destroy?.();
        if (looksLikeEcho(canary, reply)) return false;
        return /\bok\b/i.test(reply) || reply.trim().length <= 40;
      } catch {
        return false;
      }
    })();
  }
  return realModelProbe;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    clarity: { type: "number" },
    evidence: { type: "number" },
    insight: { type: "number" },
    ambition: { type: "number" },
    flags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sev: { type: "string", enum: ["red", "amber", "green"] },
          title: { type: "string" },
          body: { type: "string" },
        },
        required: ["sev", "title", "body"],
      },
    },
  },
  required: ["clarity", "evidence", "insight", "ambition", "flags"],
};

// Kept short and concrete: on-device models are small and follow compact
// prompts far better than long rubric essays.
const SYSTEM = `You review draft Y Combinator startup applications like a blunt YC partner. Reward: plain words, concrete numbers, founder-market fit, named competitors. Punish: buzzwords, hedging ("we hope"), no metrics, "no competitors" claims, contradictory numbers. Score clarity, evidence, insight, ambition from 0 to 10. Write 3 to 5 flags; each flag has sev ("red" bad, "amber" warning, "green" good), a short title, and a 1-2 sentence body quoting the applicant's words. Respond with only JSON matching the schema, no other text.`;

export class LocalAiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalAiError";
  }
}

const clamp10 = (v: unknown) => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : 0;
  return Math.max(0, Math.min(10, Math.round(n * 10) / 10));
};

export async function reviewWithLocalAi(
  sections: { label: string; text: string }[],
  onProgress?: (pct: number) => void
): Promise<ReviewResult> {
  const LM = getLanguageModel();
  if (!LM) {
    throw new LocalAiError(
      "This browser has no built-in AI. It needs a recent desktop Chrome with on-device AI enabled. Use the instant rules review, or the Claude review with an API key."
    );
  }

  let session: LmSession;
  try {
    session = await LM.create({
      initialPrompts: [{ role: "system", content: SYSTEM }],
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          const loaded = (e as unknown as { loaded?: number }).loaded;
          if (typeof loaded === "number") {
            onProgress?.(Math.round(loaded * 100));
          }
        });
      },
    });
  } catch {
    throw new LocalAiError(
      "Couldn't start the browser's built-in AI. It may still be downloading its model; try again in a minute, or use another reviewer."
    );
  }

  const userPrompt = [
    "Review these draft YC application answers.",
    ...sections.map(
      (s) => `${s.label}:\n${s.text.trim() || "(left blank)"}`
    ),
  ].join("\n\n");

  let text: string;
  try {
    try {
      text = await session.prompt(userPrompt, {
        responseConstraint: RESPONSE_SCHEMA,
      });
    } catch {
      // Older builds don't support responseConstraint; fall back to plain
      // prompting and defensive parsing.
      text = await session.prompt(userPrompt);
    }
  } catch {
    throw new LocalAiError(
      "The on-device model failed to produce a review. Try again, or use another reviewer."
    );
  } finally {
    session.destroy?.();
  }

  if (looksLikeEcho(userPrompt, text)) {
    throw new LocalAiError(
      "This browser exposes the AI API but has no real model behind it (it echoed the prompt back). Use the full local check, which needs no model, or the Claude review."
    );
  }

  // Strip code fences and grab the outermost JSON object.
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new LocalAiError(
      "The on-device model's review couldn't be parsed. Try again, or use another reviewer."
    );
  }
  let raw: {
    clarity?: unknown;
    evidence?: unknown;
    insight?: unknown;
    ambition?: unknown;
    flags?: unknown;
  };
  try {
    raw = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new LocalAiError(
      "The on-device model's review couldn't be parsed. Try again, or use another reviewer."
    );
  }

  const clarity = clamp10(raw.clarity);
  const evidence = clamp10(raw.evidence);
  const insight = clamp10(raw.insight);
  const ambition = clamp10(raw.ambition);
  const total = totalFromScores(clarity, evidence, insight, ambition);
  const [verdictTitle, verdictBody] = verdictForTotal(total);

  const flags: Flag[] = (Array.isArray(raw.flags) ? raw.flags : [])
    .filter(
      (f): f is Flag =>
        Boolean(f) &&
        ((f as Flag).sev === "red" ||
          (f as Flag).sev === "amber" ||
          (f as Flag).sev === "green") &&
        typeof (f as Flag).title === "string" &&
        typeof (f as Flag).body === "string"
    )
    .slice(0, 7);
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
    reviewer: "local",
  };
}
