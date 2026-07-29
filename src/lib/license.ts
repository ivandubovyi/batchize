// Batchize Pro licensing. A key is an ECDSA P-256 signature over a small
// payload, verified in the browser against a public key compiled into the
// bundle. That means no server, no database, no account, and no request at
// unlock time: buy once, paste the key, works offline forever.
//
// Keys are issued with tools/license.mjs. The private key never leaves the
// machine that mints them.
//
// The honest limitation, stated plainly on the pricing page: a key can be
// shared, because there is nothing to phone home to. That is a deliberate
// trade for a product that never uploads your application.

const PUBLIC_KEY_JWK: JsonWebKey = {
  kty: "EC",
  crv: "P-256",
  x: "O7BYpukm3O7xA_z8hMbEOd3et5Glwx2Qg5pKrtFQvXw",
  y: "Zt8vVeBB3H3nJtyP0P_eAtPDt2jJ8z6HZEyqE7eqSAE",
};

const PREFIX = "BATCHIZE-PRO-";
const STORE = "batchize-license";

export interface LicensePayload {
  /** Email the key was issued to. */
  e: string;
  /** Order reference, if the checkout gave one. */
  o: string;
  /** Issue date, yyyy-mm-dd. */
  d: string;
}

export type LicenseState =
  | { status: "none" }
  | { status: "valid"; payload: LicensePayload; key: string }
  | { status: "invalid"; reason: string };

function fromB64u(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Verify a key. Resolves to a state rather than throwing, because every
 * failure here is something the person pasting needs explained.
 */
export async function verifyLicense(raw: string): Promise<LicenseState> {
  const trimmed = raw.trim();
  if (!trimmed) return { status: "none" };

  const body = trimmed.startsWith(PREFIX) ? trimmed.slice(PREFIX.length) : trimmed;
  const [payloadB64, sigB64] = body.split(".");
  if (!payloadB64 || !sigB64) {
    return {
      status: "invalid",
      reason: "That does not look like a full key. Copy the whole line from your receipt, starting with BATCHIZE-PRO-.",
    };
  }

  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      PUBLIC_KEY_JWK,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      fromB64u(sigB64),
      new TextEncoder().encode(payloadB64)
    );
    if (!ok) {
      return {
        status: "invalid",
        reason: "This key did not verify. If you retyped it, paste it instead: one wrong character is enough to break the signature.",
      };
    }
    const payload = JSON.parse(
      new TextDecoder().decode(fromB64u(payloadB64))
    ) as LicensePayload;
    return { status: "valid", payload, key: PREFIX + body };
  } catch {
    return {
      status: "invalid",
      reason: "This key could not be read. Paste the whole line exactly as it appears in your receipt.",
    };
  }
}

/** Persist a key that has already verified. */
export function storeLicense(key: string): void {
  localStorage.setItem(STORE, key);
}

export function clearLicense(): void {
  localStorage.removeItem(STORE);
}

export function storedLicenseKey(): string {
  return localStorage.getItem(STORE) ?? "";
}

/**
 * Re-verify whatever is in storage. Called on load, so a tampered
 * localStorage entry does not unlock anything.
 */
export async function currentLicense(): Promise<LicenseState> {
  return verifyLicense(storedLicenseKey());
}

/**
 * Synchronous best-guess used only to avoid a flash of locked UI while the
 * real verification runs. Never gate anything on this alone.
 */
export function hasStoredKey(): boolean {
  return storedLicenseKey().startsWith(PREFIX);
}
