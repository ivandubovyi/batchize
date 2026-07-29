import { useEffect, useState } from "react";
import { getSupabase, SYNC_AVAILABLE } from "./supabaseClient";

export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Current session, if any. Resolves to signed-out quickly when there is no
 * stored session, so the account screen does not sit on a spinner for someone
 * who has never signed in.
 */
export function useAuth(): {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => void;
} {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(SYNC_AVAILABLE);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!SYNC_AVAILABLE) {
      setLoading(false);
      return;
    }
    let live = true;
    let unsub: (() => void) | undefined;

    getSupabase()
      .then(async (supabase) => {
        const { data } = await supabase.auth.getSession();
        if (!live) return;
        const s = data.session;
        setUser(s ? { id: s.user.id, email: s.user.email ?? "" } : null);
        setLoading(false);

        const sub = supabase.auth.onAuthStateChange((_e, session) => {
          setUser(
            session ? { id: session.user.id, email: session.user.email ?? "" } : null
          );
        });
        unsub = () => sub.data.subscription.unsubscribe();
      })
      .catch(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
      unsub?.();
    };
  }, [tick]);

  return { user, loading, refresh: () => setTick((t) => t + 1) };
}
