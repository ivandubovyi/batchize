// Training harness: measures the analyzer against the labeled corpus and
// reports recall (signals we should catch) and false positives (signals we
// should not fire). Run after every tuning change.
import { auditAnswer, auditApplication, QUESTIONS } from "./analyzer.bundle.mjs";
import { CASES, CROSS_CASES } from "./corpus.mjs";

const q = (id) => QUESTIONS.find((x) => x.id === id);
const titlesOf = (findings) => findings.map((f) => f.title);
const fires = (titles, sig) => titles.some((t) => t.toLowerCase().includes(sig.toLowerCase()));

let misses = [];
let falsePos = [];
let expectedTotal = 0;
let caughtTotal = 0;
let forbidTotal = 0;
let cleanTotal = 0;

console.log("=== per-answer corpus ===");
for (const c of CASES) {
  const a = auditAnswer(q(c.qid), c.text);
  const t = titlesOf(a.findings);
  for (const sig of c.expect) {
    expectedTotal++;
    if (fires(t, sig)) caughtTotal++;
    else misses.push(`${c.name}: MISSED "${sig}" (got: ${t.join(" | ") || "nothing"})`);
  }
  for (const sig of c.forbid) {
    forbidTotal++;
    if (fires(t, sig)) falsePos.push(`${c.name}: FALSE POSITIVE "${sig}" (got: ${t.join(" | ")})`);
    else cleanTotal++;
  }
}

console.log("\n=== cross-application corpus ===");
for (const c of CROSS_CASES) {
  const r = auditApplication({ answers: c.answers, interview: {}, chancing: {} });
  const t = titlesOf(r.crossFindings);
  for (const sig of c.expect) {
    expectedTotal++;
    if (fires(t, sig)) caughtTotal++;
    else misses.push(`${c.name}: MISSED "${sig}" (got: ${t.join(" | ") || "nothing"})`);
  }
  for (const sig of c.forbid) {
    forbidTotal++;
    if (fires(t, sig)) falsePos.push(`${c.name}: FALSE POSITIVE "${sig}" (got: ${t.join(" | ")})`);
    else cleanTotal++;
  }
}

const recall = expectedTotal ? (caughtTotal / expectedTotal) * 100 : 100;
const specificity = forbidTotal ? (cleanTotal / forbidTotal) * 100 : 100;

if (misses.length) {
  console.log("\n--- MISSES ---");
  misses.forEach((m) => console.log("  " + m));
}
if (falsePos.length) {
  console.log("\n--- FALSE POSITIVES ---");
  falsePos.forEach((m) => console.log("  " + m));
}

console.log(`\nRecall:      ${caughtTotal}/${expectedTotal} = ${recall.toFixed(1)}%`);
console.log(`Specificity: ${cleanTotal}/${forbidTotal} = ${specificity.toFixed(1)}%`);
const pass = recall === 100 && specificity === 100;
console.log(pass ? "\nCORPUS CLEAN" : `\nNEEDS TUNING (${misses.length} misses, ${falsePos.length} false positives)`);
process.exit(pass ? 0 : 1);
