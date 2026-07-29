// The submission pack. The last hour before a deadline is spent tabbing
// between a draft document and the YC form, pasting answers and hoping
// nothing got truncated or left behind. This turns the finished application
// into one page built for that hour: every answer in form order, character
// counts against the caps, and a checklist of the things that are actually
// worth one more look.

import {
  QUESTIONS,
  SECTIONS,
  type AppData,
  type Question,
} from "./application";
import { auditApplication, type FullAudit } from "./analyzer";

/**
 * The caps YC's form enforces. Only the one-liner has a hard published limit;
 * the rest are soft targets, so they are labelled as guidance, not law.
 */
const HARD_CAPS: Record<string, number> = {
  one_liner: 50,
};

/** Where an answer is long enough that a partner starts skimming. */
const SOFT_TARGETS: Record<string, number> = {
  what_building: 1200,
  why_idea: 1200,
  how_far: 900,
  competitors: 900,
  make_money: 700,
  why_now: 700,
};

export interface PackAnswer {
  id: string;
  label: string;
  tip: string;
  text: string;
  chars: number;
  words: number;
  hardCap?: number;
  softTarget?: number;
  overHard: boolean;
  overSoft: boolean;
  empty: boolean;
}

export interface PackSection {
  id: string;
  title: string;
  answers: PackAnswer[];
}

export interface ChecklistItem {
  done: boolean;
  label: string;
  detail: string;
}

export interface SubmissionPack {
  sections: PackSection[];
  checklist: ChecklistItem[];
  audit: FullAudit;
  totalWords: number;
  unanswered: string[];
  ready: boolean;
}

const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

function packAnswer(q: Question, text: string): PackAnswer {
  const hardCap = HARD_CAPS[q.id];
  const softTarget = SOFT_TARGETS[q.id];
  const chars = text.trim().length;
  return {
    id: q.id,
    label: q.label,
    tip: q.tip,
    text: text.trim(),
    chars,
    words: countWords(text),
    hardCap,
    softTarget,
    overHard: hardCap !== undefined && chars > hardCap,
    overSoft: softTarget !== undefined && chars > softTarget,
    empty: chars === 0,
  };
}

/**
 * Everything the checklist asks is derived from the application itself. No
 * generic "did you proofread?" filler: each item is either true or false
 * about what is actually written.
 */
function buildChecklist(app: AppData, audit: FullAudit, packed: PackAnswer[]): ChecklistItem[] {
  const answers = app.answers;
  const all = Object.values(answers).join(" ");
  const items: ChecklistItem[] = [];

  const missing = packed.filter((a) => a.empty);
  items.push({
    done: missing.length === 0,
    label: "Every question has an answer",
    detail:
      missing.length === 0
        ? "All 26 answered."
        : `${missing.length} still blank: ${missing.slice(0, 3).map((m) => m.label.slice(0, 40)).join("; ")}${missing.length > 3 ? "…" : ""}`,
  });

  const overCap = packed.filter((a) => a.overHard);
  items.push({
    done: overCap.length === 0,
    label: "Nothing is over a hard character limit",
    detail:
      overCap.length === 0
        ? "The one-liner fits."
        : overCap.map((a) => `${a.label.slice(0, 40)}: ${a.chars}/${a.hardCap}`).join("; "),
  });

  items.push({
    done: audit.reds === 0,
    label: "No red flags left",
    detail:
      audit.reds === 0
        ? "The check found nothing that would sink it."
        : `${audit.reds} red ${audit.reds === 1 ? "flag" : "flags"} still open. These are the ones a partner notices first.`,
  });

  items.push({
    done: audit.crossFindings.length === 0,
    label: "Your answers agree with each other",
    detail:
      audit.crossFindings.length === 0
        ? "No contradictions across answers."
        : audit.crossFindings.map((f) => f.title).join("; "),
  });

  const hasNumbers = /\d/.test(answers.how_far ?? "");
  items.push({
    done: hasNumbers,
    label: "Progress is stated in numbers",
    detail: hasNumbers
      ? "Your progress answer contains figures."
      : "The progress answer has no numbers in it. This is the section partners weight most, and an adjective does not survive it.",
  });

  const video = (answers.video_script ?? "").trim();
  items.push({
    done: video.length > 0,
    label: "The founder video is scripted",
    detail: video
      ? `${countWords(video)} words, roughly ${Math.max(1, Math.round(countWords(video) / 150))} minute${countWords(video) / 150 >= 1.5 ? "s" : ""} spoken.`
      : "No script yet. The video is one minute and it is the only place partners hear you talk.",
  });

  const urls = all.match(/https?:\/\/\S+/g) ?? [];
  items.push({
    done: urls.length > 0,
    label: "There is a link a partner can open",
    detail:
      urls.length > 0
        ? `${urls.length} link${urls.length === 1 ? "" : "s"} in your answers. Open every one in a private window before you submit.`
        : "No links anywhere in the application. If a partner cannot see the thing, they are taking your word for it.",
  });

  items.push({
    done: Boolean(app.deadline),
    label: "You know your deadline",
    detail: app.deadline
      ? `Target set for ${app.deadline}.`
      : "No deadline set on the dashboard. Batches close on a date, not when you feel ready.",
  });

  return items;
}

export function buildPack(app: AppData): SubmissionPack {
  const audit = auditApplication(app);
  const packedAll: PackAnswer[] = QUESTIONS.map((q) =>
    packAnswer(q, app.answers[q.id] ?? "")
  );

  const sections: PackSection[] = SECTIONS.map((s) => ({
    id: s.id,
    title: s.title,
    answers: QUESTIONS.filter((q) => q.section === s.id).map(
      (q) => packedAll.find((p) => p.id === q.id)!
    ),
  }));

  const checklist = buildChecklist(app, audit, packedAll);

  return {
    sections,
    checklist,
    audit,
    totalWords: packedAll.reduce((n, a) => n + a.words, 0),
    unanswered: packedAll.filter((a) => a.empty).map((a) => a.id),
    ready: checklist.every((c) => c.done),
  };
}

/**
 * Plain text of the whole application, for pasting into the form or into a
 * message to a cofounder. Deliberately not markdown: the YC form is plain
 * textareas and asterisks would go in with the words.
 */
export function packToText(pack: SubmissionPack): string {
  const lines: string[] = [];
  for (const s of pack.sections) {
    lines.push(s.title.toUpperCase(), "");
    for (const a of s.answers) {
      lines.push(a.label);
      lines.push(a.text || "(not answered)");
      lines.push("");
    }
  }
  return lines.join("\n").trimEnd() + "\n";
}
