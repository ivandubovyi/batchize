import { useMemo, useState } from "react";
import { Camera, RotateCcw, Trash2 } from "lucide-react";
import {
  loadDrafts,
  snapshot,
  deleteDraft,
  restoreDraft,
  summariseDiff,
  type Draft,
} from "@/lib/drafts";
import { loadApp } from "@/lib/application";
import { ProGate } from "@/components/app/ProGate";
import { PRO_FEATURES } from "@/lib/pro";
import { Donut } from "@/components/app/shared";

const feature = PRO_FEATURES.find((f) => f.id === "drafts")!;

function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DiffView({ before, after }: { before: Record<string, string>; after: Record<string, string> }) {
  const summary = useMemo(() => summariseDiff(before, after), [before, after]);
  const changed = summary.questions.filter((q) => q.changed);

  if (changed.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Nothing has changed since this snapshot.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {changed.length} {changed.length === 1 ? "answer" : "answers"} changed,{" "}
        {summary.wordDelta >= 0 ? "+" : ""}
        {summary.wordDelta} words overall.
      </p>
      {changed.map((q) => (
        <div key={q.id} className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h4 className="text-sm font-semibold">{q.label}</h4>
            <span className="shrink-0 text-xs text-muted-foreground">
              {q.wordDelta >= 0 ? "+" : ""}
              {q.wordDelta} words
            </span>
          </div>
          <p className="text-sm leading-relaxed">
            {q.parts.map((p, i) => (
              <span
                key={i}
                className={
                  p.op === "added"
                    ? "rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                    : p.op === "removed"
                      ? "rounded bg-red-100 text-red-900 line-through dark:bg-red-950 dark:text-red-200"
                      : "text-muted-foreground"
                }
              >
                {p.text}
              </span>
            ))}
          </p>
        </div>
      ))}
    </div>
  );
}

function DraftsInner() {
  const [drafts, setDrafts] = useState<Draft[]>(() => loadDrafts());
  const [label, setLabel] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const live = loadApp().answers;

  const take = () => {
    snapshot(label);
    setDrafts(loadDrafts());
    setLabel("");
    setNote("Snapshot saved.");
  };

  const remove = (id: string) => {
    setDrafts(deleteDraft(id));
    if (openId === id) setOpenId(null);
    setNote("Snapshot deleted.");
  };

  const restore = (d: Draft) => {
    if (
      !window.confirm(
        `Replace your current answers with "${d.label}"? Take a snapshot first if you want to keep what you have now.`
      )
    )
      return;
    restoreDraft(d.id);
    setNote(`Restored "${d.label}". Reload any open question to see it.`);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Draft history</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Snapshot the application before a rewrite. The score is captured with
          it, so you can see whether the last three hours helped.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Name this version, e.g. before rewriting progress"
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={take}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Camera className="h-4 w-4" /> Take snapshot
        </button>
      </div>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}

      {drafts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No snapshots yet. Take one before your next big rewrite, which is
          exactly when you will wish you had.
        </p>
      ) : (
        <div className="space-y-3">
          {drafts.map((d) => (
            <div key={d.id} className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex flex-wrap items-center gap-4 p-5">
                <Donut total={d.total} size={64} label="" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{d.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {when(d.savedAt)} · {d.coverage}% answered ·{" "}
                    {d.reds} red {d.reds === 1 ? "flag" : "flags"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOpenId(openId === d.id ? null : d.id)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
                  >
                    {openId === d.id ? "Hide changes" : "What changed since"}
                  </button>
                  <button
                    onClick={() => restore(d)}
                    title="Restore this version"
                    className="rounded-lg border border-border p-1.5 transition-colors hover:bg-accent"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(d.id)}
                    title="Delete this snapshot"
                    className="rounded-lg border border-border p-1.5 text-red-600 transition-colors hover:bg-accent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {openId === d.id && (
                <div className="border-t border-border p-5">
                  <DiffView before={d.answers} after={live} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Drafts() {
  return (
    <ProGate name={feature.name} blurb={feature.blurb} why={feature.why}>
      <DraftsInner />
    </ProGate>
  );
}
