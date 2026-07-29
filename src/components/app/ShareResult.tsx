import { useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";
import { downloadShareCard, shareText } from "@/lib/shareCard";
import type { FullAudit } from "@/lib/analyzer";

/**
 * Shares the score, never the answers. The image is drawn on a canvas in this
 * browser and downloaded from it, so nothing is uploaded to make it.
 */
export function ShareResult({ audit }: { audit: FullAudit }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await downloadShareCard(audit);
    setBusy(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(shareText(audit));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Share2 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Share the score, not the answers</h3>
          <p className="text-sm text-muted-foreground">
            The image has your score and the four readings on it. None of what
            you wrote is in it, and it is drawn here rather than on a server.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {busy ? "Drawing…" : "Save image"}
        </button>
        <button
          onClick={copy}
          className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
        >
          <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy post"}
        </button>
      </div>
    </div>
  );
}
