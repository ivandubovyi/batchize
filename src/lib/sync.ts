// Cloud sync, for people who turn it on.
//
// The rule that shapes everything here: the browser copy is the truth and the
// cloud is a copy of it, never the other way round. Somebody who signs out, or
// loses their password, or whose network is down, still has a complete working
// application in front of them. Sync can fail in every way imaginable and the
// worst outcome is that two machines disagree until you say which is right.
//
// Which is why there is no automatic merge. Merging two versions of an answer
// somebody rewrote six times produces a sentence neither of them wrote. When
// both sides have changed, this asks.

import { buildBackup, parseBackup, applyBackup, type BackupFile } from "./backup";
import { answeredCount, loadApp } from "./application";
import { getSupabase } from "./supabaseClient";

const LAST_SYNC = "batchize-sync-state";

export interface SyncState {
  /** Server version this browser last agreed with. */
  version: number;
  /** When we last pushed or pulled successfully. */
  at: string;
  /** Fingerprint of the document at that moment, to detect local edits. */
  fingerprint: string;
}

export type SyncStatus =
  | { kind: "idle" }
  | { kind: "working"; what: string }
  | { kind: "synced"; at: string }
  | { kind: "local-ahead" }
  | { kind: "remote-ahead"; remoteAt: string; device?: string }
  | { kind: "conflict"; remoteAt: string; device?: string }
  | { kind: "error"; message: string };

/**
 * Cheap, stable fingerprint of the document. Not a security hash: it only has
 * to change when the content changes.
 */
export function fingerprint(doc: unknown): string {
  const s = JSON.stringify(doc);
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}-${s.length.toString(36)}`;
}

export function loadSyncState(): SyncState | null {
  try {
    const raw = localStorage.getItem(LAST_SYNC);
    return raw ? (JSON.parse(raw) as SyncState) : null;
  } catch {
    return null;
  }
}

export function saveSyncState(s: SyncState): void {
  localStorage.setItem(LAST_SYNC, JSON.stringify(s));
}

export function clearSyncState(): void {
  localStorage.removeItem(LAST_SYNC);
}

/** Something recognisable in a "changed on another device" message. */
export function deviceLabel(): string {
  const ua = navigator.userAgent;
  const os = /Mac/i.test(ua)
    ? "Mac"
    : /Windows/i.test(ua)
      ? "Windows"
      : /Android/i.test(ua)
        ? "Android"
        : /iPhone|iPad/i.test(ua)
          ? "iPhone or iPad"
          : /Linux/i.test(ua)
            ? "Linux"
            : "another device";
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /OPR\//i.test(ua)
      ? "Opera"
      : /Chrome\//i.test(ua)
        ? "Chrome"
        : /Safari\//i.test(ua)
          ? "Safari"
          : /Firefox\//i.test(ua)
            ? "Firefox"
            : "a browser";
  return `${browser} on ${os}`;
}

interface RemoteRow {
  document: unknown;
  version: number;
  updated_at: string;
  device_label: string | null;
}

async function fetchRemote(): Promise<RemoteRow | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("applications")
    .select("document, version, updated_at, device_label")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as RemoteRow | null) ?? null;
}

/**
 * Compare this browser against the server without changing anything. This is
 * what the UI shows before offering any button that overwrites work.
 */
export async function inspect(): Promise<SyncStatus> {
  try {
    const remote = await fetchRemote();
    const state = loadSyncState();
    const localPrint = fingerprint(buildBackup().app);

    if (!remote) {
      return state ? { kind: "local-ahead" } : { kind: "local-ahead" };
    }

    const localChanged = !state || state.fingerprint !== localPrint;
    const remoteChanged = !state || remote.version > state.version;

    // A browser with nothing written in it has nothing to lose, so calling
    // that a conflict just frightens somebody who has only signed in on a new
    // machine. There is exactly one sensible thing to do and it should say so.
    if (answeredCount(loadApp()) === 0) {
      return {
        kind: "remote-ahead",
        remoteAt: remote.updated_at,
        device: remote.device_label ?? undefined,
      };
    }

    if (!localChanged && !remoteChanged) {
      return { kind: "synced", at: state?.at ?? remote.updated_at };
    }
    if (localChanged && !remoteChanged) return { kind: "local-ahead" };
    if (!localChanged && remoteChanged) {
      return {
        kind: "remote-ahead",
        remoteAt: remote.updated_at,
        device: remote.device_label ?? undefined,
      };
    }
    return {
      kind: "conflict",
      remoteAt: remote.updated_at,
      device: remote.device_label ?? undefined,
    };
  } catch (e) {
    return { kind: "error", message: (e as Error).message };
  }
}

/** Send this browser's copy up, overwriting whatever is there. */
export async function push(userId: string): Promise<SyncState> {
  const supabase = await getSupabase();
  const doc = buildBackup();
  const { data, error } = await supabase
    .from("applications")
    .upsert(
      {
        user_id: userId,
        document: doc as unknown as Record<string, unknown>,
        device_label: deviceLabel(),
      },
      { onConflict: "user_id" }
    )
    .select("version, updated_at")
    .single();
  if (error) throw new Error(error.message);

  const state: SyncState = {
    version: (data as { version: number }).version,
    at: (data as { updated_at: string }).updated_at,
    fingerprint: fingerprint(doc.app),
  };
  saveSyncState(state);
  return state;
}

/**
 * Bring the server's copy down, replacing what is in this browser. Validated
 * through the same importer the file import uses, so a corrupt or hostile row
 * cannot put nonsense into local storage.
 */
export async function pull(): Promise<{ state: SyncState; answers: number }> {
  const remote = await fetchRemote();
  if (!remote) throw new Error("There is nothing saved to your account yet.");

  const { file, summary } = parseBackup(JSON.stringify(remote.document));
  applyBackup(file as BackupFile);

  const state: SyncState = {
    version: remote.version,
    at: remote.updated_at,
    fingerprint: fingerprint(file.app),
  };
  saveSyncState(state);
  return { state, answers: summary.answers };
}

/** Remove the cloud copy. Local work is untouched. */
export async function deleteRemote(): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from("applications").delete().neq("user_id", "");
  if (error) throw new Error(error.message);
  clearSyncState();
}

export function describe(status: SyncStatus): string {
  switch (status.kind) {
    case "idle":
      return "Not checked yet.";
    case "working":
      return status.what;
    case "synced":
      return "Your account and this browser match.";
    case "local-ahead":
      return "This browser has changes your account does not.";
    case "remote-ahead":
      return `Your account has newer work, saved from ${status.device ?? "another device"}.`;
    case "conflict":
      return `Both this browser and your account have changed since they last matched. Nothing has been overwritten, and nothing will be until you pick one.`;
    case "error":
      return status.message;
  }
}
