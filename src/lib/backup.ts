// Export and import. Everything lives in this browser, so without a way to
// take it with you, clearing site data loses the whole application. This is
// the escape hatch: a single JSON file you own.

import { loadApp, saveApp, QUESTIONS, type AppData } from "./application";
import { loadDrafts, saveDrafts, type Draft } from "./drafts";

const FILE_VERSION = 1;

export interface BackupFile {
  format: "batchize-application";
  version: number;
  exportedAt: string;
  app: AppData;
  quick?: Record<string, string>;
  /**
   * Pro draft history travels with the application. The licence key does not:
   * it belongs to a person, not to a file.
   */
  drafts?: Draft[];
}

const QUICK_STORE = "batchize-quick";

export function buildBackup(): BackupFile {
  let quick: Record<string, string> | undefined;
  try {
    const raw = localStorage.getItem(QUICK_STORE);
    if (raw) quick = JSON.parse(raw);
  } catch {
    quick = undefined;
  }
  return {
    format: "batchize-application",
    version: FILE_VERSION,
    exportedAt: new Date().toISOString(),
    app: loadApp(),
    quick,
    drafts: loadDrafts(),
  };
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `batchize-application-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the download a moment before the blob is revoked.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export class ImportError extends Error {}

export interface ImportSummary {
  answers: number;
  hadQuick: boolean;
  exportedAt?: string;
  drafts: number;
}

/**
 * Parses and validates a backup file. Anything unrecognised is rejected rather
 * than silently overwriting an application the founder has already written.
 */
export function parseBackup(text: string): { file: BackupFile; summary: ImportSummary } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ImportError("That file isn't valid JSON. Pick the .json file Batchize exported.");
  }
  const f = parsed as Partial<BackupFile>;
  if (!f || f.format !== "batchize-application") {
    throw new ImportError("That doesn't look like a Batchize export. Pick the .json file Batchize gave you.");
  }
  if (typeof f.version !== "number" || f.version > FILE_VERSION) {
    throw new ImportError("That file was made by a newer version of Batchize than this one.");
  }
  const app = f.app;
  if (!app || typeof app !== "object" || typeof app.answers !== "object" || app.answers === null) {
    throw new ImportError("That export is missing its answers, so there is nothing to restore.");
  }

  // Keep only known questions, and only string values.
  const clean: Record<string, string> = {};
  for (const q of QUESTIONS) {
    const v = (app.answers as Record<string, unknown>)[q.id];
    if (typeof v === "string" && v.trim()) clean[q.id] = v;
  }

  const safe: AppData = {
    answers: clean,
    deadline: typeof app.deadline === "string" ? app.deadline : undefined,
    strength: typeof app.strength === "number" ? app.strength : undefined,
    strengthAt: typeof app.strengthAt === "string" ? app.strengthAt : undefined,
    interview:
      app.interview && typeof app.interview === "object" ? app.interview : {},
    chancing:
      app.chancing && typeof app.chancing === "object" ? app.chancing : {},
  };

  const drafts = Array.isArray(f.drafts)
    ? (f.drafts as Draft[]).filter(
        (d) => d && typeof d.id === "string" && typeof d.answers === "object"
      )
    : [];

  return {
    file: { ...(f as BackupFile), app: safe, drafts },
    summary: {
      answers: Object.keys(clean).length,
      hadQuick: Boolean(f.quick && Object.keys(f.quick).length),
      exportedAt: typeof f.exportedAt === "string" ? f.exportedAt : undefined,
      drafts: drafts.length,
    },
  };
}

export function applyBackup(file: BackupFile): void {
  saveApp(file.app);
  if (file.quick && Object.keys(file.quick).length) {
    localStorage.setItem(QUICK_STORE, JSON.stringify(file.quick));
  }
  if (file.drafts && file.drafts.length) saveDrafts(file.drafts);
}

export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new ImportError("That file could not be read."));
    reader.readAsText(file);
  });
}
