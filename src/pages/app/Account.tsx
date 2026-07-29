import { useEffect, useState } from "react";
import {
  CloudDownload,
  CloudUpload,
  LogOut,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { getSupabase, authMessage, SYNC_AVAILABLE } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/useAuth";
import {
  inspect,
  push,
  pull,
  describe,
  clearSyncState,
  loadSyncState,
  type SyncStatus,
} from "@/lib/sync";
import { answeredCount, loadApp } from "@/lib/application";

function when(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Signed out
// ---------------------------------------------------------------------------

function AuthForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Passwords need to be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const supabase = await getSupabase();
      const { error: err } =
        mode === "up"
          ? await supabase.auth.signUp({ email: email.trim(), password })
          : await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
      if (err) setError(authMessage(err.message));
      else {
        setPassword("");
        onDone();
      }
    } catch (e) {
      setError(authMessage((e as Error).message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
        <h1 className="text-2xl font-bold">
          {mode === "up" ? "Create an account" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          An account does exactly one thing: keeps a copy of your application so
          you can pick it up on another machine. Everything works without one,
          and nothing is uploaded until you press the button yourself.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy
              ? "Working…"
              : mode === "up"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "up" ? "in" : "up");
            setError("");
          }}
          className="mt-4 text-sm font-semibold text-primary underline"
        >
          {mode === "up"
            ? "I already have an account"
            : "I need to create an account"}
        </button>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl border border-border bg-muted/40 p-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          <b className="text-foreground">Your email is not verified.</b> There is
          no confirmation link, because the mail sender on the free plan would
          silently drop most of them and you would be left waiting for something
          that was never going to arrive. Use an address you will remember: it is
          how you get back in.
        </p>
        <p>
          <b className="text-foreground">Password reset barely works yet.</b> For
          the same reason. If you forget it, your work is still in this browser
          and you can export it, so this loses an account rather than an
          application.
        </p>
        <p>
          <b className="text-foreground">Signing in changes nothing on its own.</b>{" "}
          Your answers only leave this browser when you press Upload, and you can
          delete the cloud copy at any time.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signed in
// ---------------------------------------------------------------------------

function SyncPanel({ user }: { user: { id: string; email: string } }) {
  const [status, setStatus] = useState<SyncStatus>({ kind: "idle" });
  const [note, setNote] = useState("");
  const answered = answeredCount(loadApp());
  const state = loadSyncState();

  const check = async () => {
    setStatus({ kind: "working", what: "Checking your account…" });
    setStatus(await inspect());
  };

  useEffect(() => {
    check();
    // Only on mount: this is a network call, not something to repeat on every
    // keystroke elsewhere in the app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doPush = async () => {
    setNote("");
    setStatus({ kind: "working", what: "Uploading…" });
    try {
      const s = await push(user.id);
      setStatus({ kind: "synced", at: s.at });
      setNote(`Uploaded ${answered} answers.`);
    } catch (e) {
      setStatus({ kind: "error", message: (e as Error).message });
    }
  };

  const doPull = async () => {
    if (
      !window.confirm(
        "Replace what is in this browser with the copy from your account? Export first if you are not sure."
      )
    )
      return;
    setNote("");
    setStatus({ kind: "working", what: "Downloading…" });
    try {
      const { state: s, answers } = await pull();
      setStatus({ kind: "synced", at: s.at });
      setNote(`Restored ${answers} answers from your account.`);
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setStatus({ kind: "error", message: (e as Error).message });
    }
  };

  const signOut = async () => {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    clearSyncState();
    window.location.reload();
  };

  const conflict = status.kind === "conflict";
  const remoteAhead = status.kind === "remote-ahead";

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Your account</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Signed in as <b className="text-foreground">{user.email}</b>. This
          browser still holds the working copy. The account is a copy of it.
        </p>
      </header>

      <div
        className={`rounded-2xl border p-6 shadow-sm ${
          conflict
            ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
            : status.kind === "error"
              ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
              : "border-border bg-card"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {conflict || status.kind === "error" ? (
              <TriangleAlert className="h-5 w-5 text-amber-600" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">
              {status.kind === "working" ? status.what : describe(status)}
            </h2>
            {status.kind === "synced" && (
              <p className="text-sm text-muted-foreground">
                Last matched {when(status.at)}.
              </p>
            )}
            {(conflict || remoteAhead) && (
              <p className="mt-1 text-sm text-muted-foreground">
                Your account was last written {when(
                  conflict ? status.remoteAt : (status as { remoteAt: string }).remoteAt
                )}
                .
              </p>
            )}
            {note && <p className="mt-2 text-sm text-muted-foreground">{note}</p>}
          </div>
          <button
            onClick={check}
            title="Check again"
            className="shrink-0 rounded-lg border border-border p-2 transition-colors hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={doPush}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <CloudUpload className="h-4 w-4" />
            {conflict ? "Keep this browser's copy" : "Upload this browser's copy"}
          </button>
          <button
            onClick={doPull}
            className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            <CloudDownload className="h-4 w-4" />
            {conflict ? "Take the account's copy" : "Download to this browser"}
          </button>
        </div>

        {conflict && (
          <p className="mt-4 rounded-xl bg-background/60 p-3 text-sm leading-relaxed text-muted-foreground">
            Nothing is merged automatically. Stitching two versions of an answer
            you rewrote six times produces a sentence neither version said, so
            this asks instead. If you want to keep both, export this browser's
            copy first, then take the account's.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-semibold">What is stored</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Your {answered} answered questions, your deadline, interview progress,
          the quick score and Pro draft history. It is the same file the Export
          button gives you. Nothing else about you is kept: no analytics, no
          usage tracking, no third parties.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Rows are keyed to your user id and locked to it in the database, so no
          other account can read yours.
          {state ? ` Last synced version ${state.version}.` : ""}
        </p>
        <button
          onClick={signOut}
          className="mt-4 flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Signing out leaves your application exactly where it is, in this
          browser.
        </p>
      </div>
    </div>
  );
}

export function Account() {
  const { user, loading, refresh } = useAuth();

  if (!SYNC_AVAILABLE) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Accounts are not configured</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This build has no sync server set. Everything else works as normal.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Checking your session…
      </div>
    );
  }

  return user ? <SyncPanel user={user} /> : <AuthForm onDone={refresh} />;
}
