// Wholistic application review: runs the calibrated core reviewer over the
// four answers partners read first, layers per-question checks over every
// other answer, and cross-checks numbers across the entire application.

import {
  review,
  quickFlags,
  crossConsistencyFlags,
  verdictForTotal,
  sortFlags,
  type Flag,
  type ReviewResult,
} from "./reviewer";
import {
  SECTIONS,
  QUESTIONS,
  questionsFor,
  type AppData,
  type Question,
  type SectionId,
} from "./application";

export interface QuestionFinding {
  question: Question;
  flags: Flag[];
}

export interface SectionResult {
  id: SectionId;
  title: string;
  answered: number;
  totalQ: number;
  score: number; // 0-10
  findings: QuestionFinding[];
}

export interface AppReviewResult {
  total: number; // 0-100
  verdictTitle: string;
  verdictBody: string;
  coverage: number; // 0-100, % of questions answered
  core: ReviewResult;
  sections: SectionResult[];
  crossFlags: Flag[];
}

function optsFor(q: Question) {
  return {
    charCap: q.kind === "oneliner" ? 50 : undefined,
    expectNumbers: q.checks.includes("numbers"),
    competitors: q.checks.includes("competitors"),
    equity: q.checks.includes("equity"),
    insight: q.checks.includes("insight"),
  };
}

export function reviewApplication(data: AppData): AppReviewResult {
  const a = (id: string) => (data.answers[id] ?? "").trim();

  // Core rubric over the four answers partners read first.
  const core = review(
    a("one_liner"),
    a("product_description"),
    a("why_idea"),
    a("how_far")
  );

  // Per-question findings, grouped by section.
  const sections: SectionResult[] = SECTIONS.map((s) => {
    const qs = questionsFor(s.id);
    const findings: QuestionFinding[] = [];
    let answered = 0;
    let reds = 0;
    let ambers = 0;
    for (const q of qs) {
      const text = a(q.id);
      if (text) answered++;
      const flags = quickFlags(text, optsFor(q));
      if (flags.length) findings.push({ question: q, flags });
      reds += flags.filter((f) => f.sev === "red").length;
      ambers += flags.filter((f) => f.sev === "amber").length;
    }
    const completion = qs.length ? answered / qs.length : 0;
    const quality = Math.max(2, 10 - reds * 2 - ambers * 0.75);
    const score =
      Math.round(Math.max(0, Math.min(10, quality * completion)) * 10) / 10;
    return {
      id: s.id,
      title: s.title,
      answered,
      totalQ: qs.length,
      score,
      findings,
    };
  });

  // Consistency across the entire application, not just the core four.
  const crossFlags = crossConsistencyFlags(
    QUESTIONS.map((q) => a(q.id)).filter(Boolean)
  );
  sortFlags(crossFlags);

  const answeredTotal = QUESTIONS.filter((q) => a(q.id)).length;
  const coverage = Math.round((answeredTotal / QUESTIONS.length) * 100);

  const sectionAvg =
    sections.reduce((s, x) => s + x.score, 0) / sections.length; // 0-10
  let total = Math.round(core.total * 0.6 + sectionAvg * 10 * 0.4);
  if (crossFlags.length) total = Math.max(0, total - 6);
  const [verdictTitle, verdictBody] = verdictForTotal(total);

  return {
    total,
    verdictTitle,
    verdictBody,
    coverage,
    core,
    sections,
    crossFlags,
  };
}

// Sections for the AI reviewers: every answered question, labeled with the
// real question text so Claude or the on-device model reads the application
// the way a partner would.
export function answeredSections(
  data: AppData
): { label: string; text: string }[] {
  return QUESTIONS.filter((q) => (data.answers[q.id] ?? "").trim()).map(
    (q) => ({ label: q.label, text: data.answers[q.id].trim() })
  );
}
