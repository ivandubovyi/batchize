// Tier 3 runner. Reports precision and recall separately, because the whole
// point of this tier is that a false positive costs more than a miss.
import { auditAnswer, auditApplication, QUESTIONS } from "./analyzer.bundle.mjs";
import { PRECISION_CASES, PRECISION_CROSS } from "./corpus3.mjs";

const q = (id) => QUESTIONS.find((x) => x.id === id);
const fires = (t, s) => t.some((x) => x.toLowerCase().includes(s.toLowerCase()));

let miss = [], fp = [], exp = 0, got = 0, forb = 0, clean = 0;

const run = (name, titles, c) => {
  for (const s of c.expect) {
    exp++;
    if (fires(titles, s)) got++;
    else miss.push(`${name}: MISSED "${s}" (got: ${titles.join(" | ") || "nothing"})`);
  }
  for (const s of c.forbid) {
    forb++;
    if (fires(titles, s)) fp.push(`${name}: FALSE POSITIVE "${s}" (got: ${titles.join(" | ")})`);
    else clean++;
  }
};

for (const c of PRECISION_CASES) {
  run(c.name, auditAnswer(q(c.qid), c.text).findings.map((f) => f.title), c);
}
for (const c of PRECISION_CROSS) {
  const t = auditApplication({ answers: c.answers, interview: {}, chancing: {} })
    .crossFindings.map((f) => f.title);
  run(c.name, t, c);
}

if (miss.length) { console.log("--- MISSES ---"); miss.forEach((m) => console.log("  " + m)); }
if (fp.length) { console.log("--- FALSE POSITIVES ---"); fp.forEach((m) => console.log("  " + m)); }

console.log(`\nTier 3 recall: ${got}/${exp}  |  precision (no false alarm): ${clean}/${forb}`);
process.exit(miss.length || fp.length ? 1 : 0);
