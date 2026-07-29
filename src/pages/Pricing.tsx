import { useState } from "react";
import { Check, KeyRound } from "lucide-react";
import { CHECKOUT_URL, PRICE_USD, PRO_LIVE, PRO_FEATURES, FREE_INCLUDES } from "@/lib/pro";
import { verifyLicense, storeLicense, clearLicense } from "@/lib/license";
import { usePro } from "@/lib/usePro";

function Unlock() {
  const { unlocked, state } = usePro();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await verifyLicense(key);
    setBusy(false);
    if (result.status === "valid") {
      storeLicense(result.key);
      setDone(true);
      setTimeout(() => window.location.reload(), 600);
    } else if (result.status === "invalid") {
      setError(result.reason);
    } else {
      setError("Paste your key first.");
    }
  };

  if (unlocked || done) {
    const email = state.status === "valid" ? state.payload.e : "";
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/40">
        <h3 className="mb-1 font-bold">Pro is unlocked on this browser</h3>
        <p className="text-sm text-muted-foreground">
          {email ? `Licensed to ${email}. ` : ""}
          Your key is stored here only. Paste it again on another machine to
          unlock that one too.
        </p>
        <button
          onClick={() => {
            clearLicense();
            window.location.reload();
          }}
          className="mt-3 text-sm font-semibold text-muted-foreground underline"
        >
          Remove the key from this browser
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-1 flex items-center gap-2 font-bold">
        <KeyRound className="h-4 w-4" /> Already bought it?
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Paste the key from your receipt. It is checked in this browser, so this
        works offline and nothing is sent anywhere.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="BATCHIZE-PRO-…"
          spellCheck={false}
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}

export function Pricing() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-28 md:px-6">
      <header className="mb-12 text-center">
        <p className="mb-3 text-sm font-medium text-primary">Pricing</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          The check is free. Pro is for the last week.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Everything that tells you what is wrong with your application costs
          nothing and always will. Pro is the three things you only want once
          you are actually rewriting against a deadline.
        </p>
      </header>

      <div className="mb-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
          <h2 className="text-xl font-bold">Free</h2>
          <p className="mb-5 mt-1 text-3xl font-bold">$0</p>
          <ul className="space-y-2.5">
            {FREE_INCLUDES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
          <a
            href="#/app"
            className="mt-6 block rounded-xl border border-border px-5 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-accent"
          >
            Start free
          </a>
        </div>

        <div className="rounded-2xl border-2 border-primary bg-card p-7 shadow-sm">
          <h2 className="text-xl font-bold">Pro</h2>
          <p className="mb-1 mt-1 text-3xl font-bold">
            ${PRICE_USD}
            <span className="ml-1.5 text-sm font-medium text-muted-foreground">
              once, not a subscription
            </span>
          </p>
          <p className="mb-5 text-sm text-muted-foreground">
            Everything in Free, plus:
          </p>
          <ul className="space-y-4">
            {PRO_FEATURES.map((f) => (
              <li key={f.id} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <b>{f.name}.</b>{" "}
                  <span className="text-muted-foreground">{f.blurb}</span>
                </span>
              </li>
            ))}
          </ul>
          {PRO_LIVE ? (
            <a
              href={CHECKOUT_URL}
              className="mt-6 block rounded-xl bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get Pro, ${PRICE_USD} once
            </a>
          ) : (
            <p className="mt-6 rounded-xl bg-muted px-5 py-2.5 text-center text-sm font-semibold text-muted-foreground">
              Not on sale yet
            </p>
          )}
        </div>
      </div>

      <Unlock />

      <section className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold">Things worth knowing before you pay</h2>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            <b className="text-foreground">There is no account.</b> Buying gives
            you a key you paste into the browser. That key is checked against a
            signature compiled into the page, so unlocking works offline and
            your application still never leaves your machine.
          </p>
          <p>
            <b className="text-foreground">A key can be shared.</b> There is no
            server to phone home to, which is the same reason nothing you write
            is uploaded. That trade is deliberate and it seems fairer to say so
            than to pretend otherwise.
          </p>
          <p>
            <b className="text-foreground">It is one payment.</b> No renewal, no
            seats, no per-application fee. If you apply again next batch, the
            same key still works.
          </p>
          <p>
            <b className="text-foreground">Pro does not make the check
            smarter.</b> The analysis is identical in both tiers. Pro is history,
            the submission pack, and the grill. Anyone charging more for a
            better verdict is charging you for the thing that should be free.
          </p>
          <p>
            Batchize is not affiliated with Y Combinator and cannot influence
            any application's outcome.
          </p>
        </div>
      </section>
    </main>
  );
}
