import { useEffect, useRef, useState } from "react";
import { loadApp, answeredCount, QUESTIONS } from "@/lib/application";
import { coachReply, STARTER_CHIPS, type CoachChip } from "@/lib/coach";
import { Card } from "@/components/app/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface Msg {
  role: "user" | "coach";
  text: string;
  chips?: CoachChip[];
}

export function Partner() {
  const [data] = useState(loadApp);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const answered = answeredCount(data);

  // Open with an orientation message grounded in their actual application.
  useEffect(() => {
    const opening = coachReply("", data);
    setMessages([{ role: "coach", text: opening.text, chips: opening.chips }]);
  }, [data]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const send = (text: string) => {
    const msg = text.trim();
    if (!msg) return;
    const reply = coachReply(msg, data);
    setMessages((m) => [
      ...m,
      { role: "user", text: msg },
      { role: "coach", text: reply.text, chips: reply.chips },
    ]);
    setDraft("");
  };

  const lastChips =
    [...messages].reverse().find((m) => m.role === "coach")?.chips ??
    STARTER_CHIPS;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Batchize Partner</h1>
        <p className="mt-1 text-muted-foreground">
          A coach that has read your saved application ({answered}/
          {QUESTIONS.length} answers) and replies with specifics from it. Free,
          instant, and runs entirely in your browser.
        </p>
      </header>

      <Card className="flex h-[560px] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {lastChips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {lastChips.map((c) => (
              <button
                key={c.label}
                onClick={() => send(c.send)}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(draft)}
            placeholder="Ask about any answer, or what to fix first…"
          />
          <Button
            onClick={() => send(draft)}
            disabled={!draft.trim()}
            className="rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <p className="mt-3 text-xs text-muted-foreground">
        Answers come from the same engine as the Full check, reading the
        application saved in this browser. Nothing is uploaded, no account needed or
        key is needed, and it never invents facts about your company.
      </p>
    </div>
  );
}
