import { useEffect, useState } from "react";
import { currentLicense, hasStoredKey, type LicenseState } from "./license";

/**
 * Re-verifies the stored key on every mount rather than trusting a boolean in
 * localStorage. `pending` exists only to avoid flashing the locked state at
 * someone who has already paid.
 */
export function usePro(): { unlocked: boolean; pending: boolean; state: LicenseState } {
  const [state, setState] = useState<LicenseState>({ status: "none" });
  const [pending, setPending] = useState(hasStoredKey());

  useEffect(() => {
    let live = true;
    currentLicense().then((s) => {
      if (!live) return;
      setState(s);
      setPending(false);
    });
    return () => {
      live = false;
    };
  }, []);

  return { unlocked: state.status === "valid", pending, state };
}
