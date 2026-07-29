// Draft history. An application is rewritten a dozen times in the last week
// before a deadline, and the honest question at 2am is "was the old version
// of this answer better?". Without snapshots that question is unanswerable,
// so people keep pasting into a scratch document.
//
// Snapshots are stored in this browser alongside the application itself, and
// travel inside the same export file.

import { QUESTIONS, loadApp, saveApp, type AppData } from "./application";
import { auditApplication } from "./analyzer";

const STORE = "batchize-drafts";

/** Keep the store bounded; a snapshot is a few kB and nobody needs 200. */
export const MAX_DRAFTS = 40;

export interface Draft {
  id: string;
  /** What the founder called this version, or an auto label. */
  label: string;
  savedAt: string;
  /** Score at the time of the snapshot, so progress is visible. */
  total: number;
  reds: number;
  coverage: number;
  answers: Record<string, string>;
}

export function loadDrafts(): Draft[] {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Draft[]) : [];
  } catch {
    return [];
  }
}

export function saveDrafts(list: Draft[]): void {
  localStorage.setItem(STORE, JSON.stringify(list.slice(0, MAX_DRAFTS)));
}

function newId(existing: Draft[]): string {
  // No randomness needed: monotonic is enough and keeps snapshots orderable.
  let n = existing.length + 1;
  while (existing.some((d) => d.id === `d${n}`)) n++;
  return `d${n}`;
}

/**
 * Snapshot the application as it stands. Scores it at the same moment so the
 * history shows movement rather than a wall of undated text.
 */
export function snapshot(label?: string): Draft {
  const app = loadApp();
  const audit = auditApplication(app);
  const list = loadDrafts();
  const draft: Draft = {
    id: newId(list),
    label: (label ?? "").trim() || `Draft ${list.length + 1}`,
    savedAt: new Date().toISOString(),
    total: audit.total,
    reds: audit.reds,
    coverage: audit.coverage,
    answers: { ...app.answers },
  };
  saveDrafts([draft, ...list]);
  return draft;
}

export function deleteDraft(id: string): Draft[] {
  const list = loadDrafts().filter((d) => d.id !== id);
  saveDrafts(list);
  return list;
}

export function renameDraft(id: string, label: string): Draft[] {
  const list = loadDrafts().map((d) =>
    d.id === id ? { ...d, label: label.trim() || d.label } : d
  );
  saveDrafts(list);
  return list;
}

/** Replace the live application's answers with a snapshot's. */
export function restoreDraft(id: string): AppData | null {
  const draft = loadDrafts().find((d) => d.id === id);
  if (!draft) return null;
  const app = loadApp();
  app.answers = { ...draft.answers };
  saveApp(app);
  return app;
}

// ---------------------------------------------------------------------------
// Diff
// ---------------------------------------------------------------------------

export type DiffOp = "same" | "added" | "removed";

export interface DiffPart {
  op: DiffOp;
  text: string;
}

/**
 * Word-level diff, longest common subsequence. Answers are a few hundred
 * words, so the quadratic table is nothing, and word granularity is what a
 * writer actually wants to see.
 */
export function diffWords(before: string, after: string): DiffPart[] {
  const a = before.match(/\S+\s*/g) ?? [];
  const b = after.match(/\S+\s*/g) ?? [];

  const norm = (w: string) => w.trim().toLowerCase();
  const n = a.length;
  const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] =
        norm(a[i]) === norm(b[j])
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  const push = (op: DiffOp, text: string) => {
    const last = parts[parts.length - 1];
    if (last && last.op === op) last.text += text;
    else parts.push({ op, text });
  };

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (norm(a[i]) === norm(b[j])) {
      push("same", b[j]);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push("removed", a[i]);
      i++;
    } else {
      push("added", b[j]);
      j++;
    }
  }
  while (i < n) push("removed", a[i++]);
  while (j < m) push("added", b[j++]);
  return parts;
}

export interface QuestionDiff {
  id: string;
  label: string;
  changed: boolean;
  /** Net word change, negative when the answer got tighter. */
  wordDelta: number;
  parts: DiffPart[];
}

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/**
 * Compare two sets of answers question by question. `after` defaults to the
 * live application, which is the common case: "what have I changed since?".
 */
export function diffAnswers(
  before: Record<string, string>,
  after: Record<string, string>
): QuestionDiff[] {
  return QUESTIONS.map((q) => {
    const b = before[q.id] ?? "";
    const a = after[q.id] ?? "";
    return {
      id: q.id,
      label: q.label,
      changed: b.trim() !== a.trim(),
      wordDelta: words(a) - words(b),
      parts: b.trim() !== a.trim() ? diffWords(b, a) : [],
    };
  });
}

export interface DiffSummary {
  changed: number;
  wordDelta: number;
  questions: QuestionDiff[];
}

export function summariseDiff(
  before: Record<string, string>,
  after: Record<string, string>
): DiffSummary {
  const questions = diffAnswers(before, after);
  return {
    changed: questions.filter((q) => q.changed).length,
    wordDelta: questions.reduce((n, q) => n + q.wordDelta, 0),
    questions,
  };
}
