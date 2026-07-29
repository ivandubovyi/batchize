// The worked example must actually score well under our own engine, or it is
// teaching the wrong thing.
import { auditApplication, exampleAppData, scoreQuick, EXAMPLE_QUICK, coachReply, narrativeCheck } from "./example.bundle.mjs";
let fail = 0;
const ck = (n,c,x="") => { if(!c) fail++; console.log(`${c?"PASS":"FAIL"} ${n}${x?" :: "+x:""}`); };

const app = exampleAppData();
const a = auditApplication(app);
console.log(`example: ${a.total}/100 (${a.verdictTitle}) coverage=${a.coverage}% reds=${a.reds} ambers=${a.ambers} greens=${a.greens}`);
console.log(`dims: c=${a.clarity} e=${a.evidence} i=${a.insight} amb=${a.ambition}`);
if (a.priorities.length) console.log("remaining flags:", a.priorities.map(p=>p.finding.title).join(" | "));

ck("example is complete", a.coverage === 100, String(a.coverage));
ck("example scores partner-ready", a.total >= 80, String(a.total));
ck("example has no red flags", a.reds === 0, String(a.reds));
ck("example shows plenty working", a.greens >= 6, String(a.greens));
ck("no self-contradictions", a.crossFindings.length === 0, a.crossFindings.map(f=>f.title).join("|"));

const q = scoreQuick(EXAMPLE_QUICK);
console.log(`\nexample quick score: ${q.total}/100 (${q.verdictTitle})`);
ck("quick example scores high", q.total >= 85, String(q.total));

const nar = narrativeCheck(app);
console.log(`narrative: spike=${nar.spike} thread=${nar.threadStrength}%`);
ck("example has a clear spike", nar.spike !== null, String(nar.spike));
ck("example story holds together", nar.threadStrength >= 70, String(nar.threadStrength));

const c = coachReply("what is my weakest answer", app);
console.log("\ncoach on example:", c.text.slice(0, 180));
ck("coach handles a strong app gracefully", !/red flags in total/.test(c.text) || a.reds > 0, c.text.slice(0,60));

console.log(fail===0 ? "\nALL PASS" : `\n${fail} FAILURES`);
process.exit(fail?1:0);
