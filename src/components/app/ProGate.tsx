import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { PRICE_USD, PRO_LIVE, CHECKOUT_URL } from "@/lib/pro";
import { usePro } from "@/lib/usePro";

/**
 * Wraps a paid screen. Shows what the screen does and what it costs rather
 * than a bare padlock, because a locked page that does not say what is behind
 * it is just an obstacle.
 */
export function ProGate({
  name,
  blurb,
  why,
  children,
}: {
  name: string;
  blurb: string;
  why: string;
  children: ReactNode;
}) {
  const { unlocked, pending } = usePro();

  if (pending) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Checking your key…
      </div>
    );
  }
  if (unlocked) return <>{children}</>;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Lock className="h-5 w-5" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">{name} is part of Pro</h2>
      <p className="mx-auto mb-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
        {blurb}
      </p>
      <p className="mx-auto mb-6 max-w-lg rounded-xl bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">
        {why}
      </p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        {PRO_LIVE ? (
          <a
            href={CHECKOUT_URL}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Pro, ${PRICE_USD} once
          </a>
        ) : (
          <span className="rounded-xl bg-muted px-6 py-3 text-sm font-semibold text-muted-foreground">
            Not on sale yet
          </span>
        )}
        <a
          href="#/pricing"
          className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent"
        >
          What is in Pro
        </a>
      </div>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Everything else in Batchize stays free and always will. Pro exists so
        the free part can keep running without an account or an upload.
      </p>
    </div>
  );
}
