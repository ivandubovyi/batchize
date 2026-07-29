import { useEffect, useRef, useState } from "react";
import { loadApp, answeredCount, QUESTIONS } from "@/lib/application";
import {
  buildAppContext,
  chatWithClaude,
  chatWithLocalAi,
  ChatError,
  type ChatMessage,
} from "@/lib/chat";
import { probeRealLocalModel } from "@/lib/localAiReviewer";
import { Card } from "@/components/app/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cpu, Loader2, Send, Sparkles } from "lucide-react";

const KEY_STORAGE = "batchize-anthropic-key";

export function Partner() {
  const [data] = useState(loadApp);
  const [provider, setProvider] = useState<"local" | "claude">("local");
  const [hasRealModel, setHasRealModel] = useState<boolean | null>(null);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem(KEY_STORAGE) ?? ""
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    probeRealLocalModel().then((real) => {
      setHasRealModel(real);
      if (!real) setProvider("claude");
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const answered = answeredCount(data);

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setError(null);
    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setDraft("");
    setBusy(true);
    try {
      const context = buildAppContext(data);
      const reply =
        provider === "claude"
          ? await chatWithClaude(apiKey.trim(), context, history)
          : await chatWithLocalAi(context, history);
      setMessages([...history, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(
        err instanceof ChatError ? err.message : "Something went wrong."
      );
      setMessages(messages.concat({ role: "user", content: text }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Batchize Partner</h1>
        <p className="mt-1 text-muted-foreground">
          A coach that has read your saved application ({answered}/
          {QUESTIONS.length} answers) and gives advice grounded in it. Needs an
          AI provider: your browser's built-in model, or Claude with your key.
        </p>
      </header>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setProvider("local")}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              provider === "local"
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Cpu className="h-4 w-4" /> On-device AI
          </button>
          <button
            onClick={() => setProvider("claude")}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              provider === "claude"
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4" /> Claude AI
          </button>
          {provider === "claude" && (
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-... (your key, sent only to Anthropic)"
              autoComplete="off"
              className="min-w-60 flex-1"
            />
          )}
        </div>
        {hasRealModel === false && (
          <p className="mt-2 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
            This browser has no usable built-in AI model, so the chat needs a
            Claude key. Your Full check and every other tab work without one.
          </p>
        )}
      </Card>

      <Card className="flex h-[480px] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              <p className="max-w-sm leading-relaxed">
                Ask anything about your application: "What's my weakest
                answer?", "Rewrite my one-liner", "What will partners push on
                in the interview?"
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.content}
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>
        {error && (
          <div className="mt-2 rounded-xl border border-red-300 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask your partner…"
            disabled={busy}
          />
          <Button onClick={send} disabled={busy || !draft.trim()} className="rounded-xl">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        Conversations aren't saved. Your application context goes only to the
        provider you pick: nowhere in on-device mode, Anthropic's API in Claude
        mode.
      </p>
    </div>
  );
}
