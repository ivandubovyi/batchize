import { auditAnswer, auditApplication, QUESTIONS } from "./analyzer.bundle.mjs";
import { HARD_CASES, HARD_CROSS } from "./corpus2.mjs";
const q = (id) => QUESTIONS.find((x) => x.id === id);
const fires = (t, s) => t.some((x) => x.toLowerCase().includes(s.toLowerCase()));
let miss = [], fp = [], exp = 0, got = 0, forb = 0, clean = 0;
for (const c of HARD_CASES) {
  const t = auditAnswer(q(c.qid), c.text).findings.map((f) => f.title);
  for (const s of c.expect) { exp++; if (fires(t, s)) got++; else miss.push(`${c.name}: MISSED "${s}" (got: ${t.join(" | ") || "nothing"})`); }
  for (const s of c.forbid) { forb++; if (fires(t, s)) fp.push(`${c.name}: FP "${s}"`); else clean++; }
}
for (const c of HARD_CROSS) {
  const t = auditApplication({ answers: c.answers, interview: {}, chancing: {} }).crossFindings.map((f) => f.title);
  for (const s of c.expect) { exp++; if (fires(t, s)) got++; else miss.push(`${c.name}: MISSED "${s}" (got: ${t.join(" | ") || "nothing"})`); }
  for (const s of c.forbid) { forb++; if (fires(t, s)) fp.push(`${c.name}: FP "${s}"`); else clean++; }
}
if (miss.length) { console.log("--- MISSES ---"); miss.forEach(m => console.log("  " + m)); }
if (fp.length) { console.log("--- FALSE POSITIVES ---"); fp.forEach(m => console.log("  " + m)); }
console.log(`\nHard recall: ${got}/${exp} = ${(got/exp*100).toFixed(0)}%  |  specificity: ${clean}/${forb}`);
