// Batchize Partner: a coach chat that knows your saved application. Runs on
// either the browser's built-in AI (no key) or Claude with the user's own
// API key. There is no server; context never leaves the browser except to
// Anthropic's API in Claude mode.

import type AnthropicNS from "@anthropic-ai/sdk";
import { QUESTIONS, type AppData } from "./application";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class ChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatError";
  }
}

const COACH_PROMPT = `You are Batchize Partner, a YC application coach. You have the founder's saved draft application below. Give blunt, specific, practical advice grounded in their actual answers: quote their words, point at concrete fixes, and keep replies short (under 200 words unless asked for more). You are on their side but never flattering. If an answer is missing, say which question to go answer. Never invent facts about their company.`;

export function buildAppContext(data: AppData): string {
  const answered = QUESTIONS.filter((q) => (data.answers[q.id] ?? "").trim());
  if (!answered.length) {
    return "The founder has not filled in any application answers yet. Encourage them to start with the one-liner and 'how far along are you'.";
  }
  return (
    "FOUNDER'S SAVED APPLICATION DRAFT:\n\n" +
    answered
      .map((q) => `Q: ${q.label}\nA: ${data.answers[q.id].trim()}`)
      .join("\n\n")
  );
}

export async function chatWithClaude(
  apiKey: string,
  appContext: string,
  history: ChatMessage[]
): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  let response: AnthropicNS.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: `${COACH_PROMPT}\n\n${appContext}`,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    } as AnthropicNS.Beta.MessageCreateParamsNonStreaming);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new ChatError("Anthropic rejected the API key. Check it and try again.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new ChatError("Rate-limited by Anthropic right now. Wait a minute and retry.");
    }
    if (err instanceof Anthropic.APIError) {
      throw new ChatError(`Anthropic API error: ${err.message}`);
    }
    throw new ChatError("Could not reach Anthropic's API.");
  }

  if (response.stop_reason === "refusal") {
    throw new ChatError("Claude declined to answer that. Try rephrasing.");
  }
  const text = response.content.find(
    (b): b is AnthropicNS.Beta.BetaTextBlock => b.type === "text"
  );
  if (!text?.text) throw new ChatError("Claude returned an empty reply. Try again.");
  return text.text;
}

export async function chatWithLocalAi(
  appContext: string,
  history: ChatMessage[]
): Promise<string> {
  const LM = (globalThis as Record<string, unknown>).LanguageModel as
    | {
        create(opts?: unknown): Promise<{
          prompt(text: string): Promise<string>;
          destroy?(): void;
        }>;
      }
    | undefined;
  if (!LM || typeof LM.create !== "function") {
    throw new ChatError(
      "This browser has no built-in AI. Use Claude mode with an API key, or a recent desktop Chrome."
    );
  }
  let session;
  try {
    session = await LM.create({
      initialPrompts: [
        { role: "system", content: `${COACH_PROMPT}\n\n${appContext}` },
      ],
    });
  } catch {
    throw new ChatError(
      "Couldn't start the browser's built-in AI. Its model may still be downloading; try again shortly."
    );
  }
  try {
    // Small on-device models handle a flattened transcript better than
    // long multi-turn state.
    const transcript = history
      .map((m) => `${m.role === "user" ? "Founder" : "You"}: ${m.content}`)
      .join("\n\n");
    const reply = await session.prompt(
      `${transcript}\n\nReply to the founder's last message as Batchize Partner.`
    );
    if (!reply.trim()) throw new Error("empty");
    return reply.trim();
  } catch {
    throw new ChatError(
      "The on-device model failed to reply. Try again, or use Claude mode."
    );
  } finally {
    session.destroy?.();
  }
}
