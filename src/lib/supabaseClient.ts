// Supabase, loaded only when somebody actually wants an account.
//
// Batchize works with no account and that stays the default. The client is
// imported dynamically so a visitor who never signs in pays nothing for the
// library, and so the landing page bundle is unaffected.
//
// The anon key below is public by design: it identifies the project and
// nothing else. Every table is behind row level security keyed to auth.uid(),
// so this key on its own grants access to no rows at all.

import type { SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://bqgknxlnoptnpjxucsfx.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZ2tueGxub3B0bnBqeHVjc2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzc0MDUsImV4cCI6MjEwMDkxMzQwNX0.msYjuPxJEJeKiGtVRiaVkkxjTtUutjZe81GngMOS1Z0";

/** Sync is available at all only if the project is configured. */
export const SYNC_AVAILABLE =
  SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 40;

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * One client for the tab, created on first use. Repeated calls share it, so
 * the auth listener and the session are not duplicated.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then((m) =>
      m.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // The app is hash-routed and there is no OAuth flow, so there is
          // never a token to pick out of the URL.
          detectSessionInUrl: false,
          storageKey: "batchize-auth",
        },
      })
    );
  }
  return clientPromise;
}

/** Human-readable reason for an auth failure. Supabase's are terse. */
export function authMessage(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("invalid login")) {
    return "That email and password do not match an account. If you have not made one yet, create an account instead.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "There is already an account with that email. Sign in instead, or use a different address.";
  }
  if (m.includes("password") && m.includes("least")) {
    return "Passwords need to be at least 6 characters.";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "That does not look like an email address this server will accept. Try a different one.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts just now. Wait a minute and try again.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Could not reach the server. Your work is safe in this browser either way.";
  }
  return raw;
}
