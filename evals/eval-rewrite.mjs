import { rewriteAnswer, oneLinerIdeas, narrativeCheck } from "./rewrite.bundle.mjs";
let fail = 0;
const ck = (n, c, x = "") => { if (!c) fail++; console.log(`${c ? "PASS" : "FAIL"} ${n}${x ? " :: " + x : ""}`); };

let r = rewriteAnswer("product_description", "At the end of the day, we basically leverage cutting-edge AI to empower logistics teams with a revolutionary solution that will disrupt freight. We think it will possibly help them a lot.");
console.log("\nBEFORE:", r.before, "\nAFTER: ", r.after, "\nSTEPS: ", r.steps.map(s=>s.label).join(" | "));
ck("rewrite removes filler", !/at the end of the day|basically/i.test(r.after), r.after);
ck("rewrite removes hedges", !/we think|possibly/i.test(r.after), r.after);
ck("rewrite flags buzzwords with brackets", r.placeholders >= 2, String(r.placeholders));
ck("rewrite reports steps", r.steps.length >= 3, r.steps.map(s=>s.label).join("|"));
ck("rewrite never invents facts", !/\d/.test(r.after) || /\[/.test(r.after));

r = rewriteAnswer("how_far", "Launched 8 weeks ago. 23 brokers paying $400/mo, $9.2k MRR growing 18% w/w.");
ck("clean answer barely changes", r.after.includes("23 brokers") && r.after.includes("$9.2k"), r.after);

const ideas = oneLinerIdeas({ answers: { product_description: "A broker connects their TMS and every invoice is generated, financed, and auto-reconciled for brokers on one dashboard.", users: "23 paying brokers" }, interview:{}, chancing:{} });
console.log("\nONE-LINER IDEAS:", ideas.map(i => `${i.text} (${i.text.length}ch fits=${i.fits})`).join(" | "));
ck("generates one-liner ideas", ideas.length >= 3);
ck("at least one fits 50 chars", ideas.some(i => i.fits));
ck("ideas use founder's own words", ideas.some(i => /broker|invoice/i.test(i.text)));

const nar = narrativeCheck({ answers: {
  why_idea: "When I was running ops at a carrier I chased invoices every Friday. Brokers factoring systems never synced.",
  product_description: "Brokers connect their factoring and invoices reconcile automatically.",
  how_far: "Launched 8 weeks ago, 23 brokers paying, $9.2k MRR.",
  competitors: "TriumphPay and Denim are closest but they optimize financing speed rather than reconciliation which is what brokers actually pay for in practice today.",
}, interview:{}, chancing:{} });
console.log("\nNARRATIVE:", JSON.stringify({ spike: nar.spike, thread: nar.threadStrength, notes: nar.notes.map(n=>n.title) }));
ck("narrative finds a spike", nar.spike !== null, String(nar.spike));
ck("narrative scores thread", nar.threadStrength > 0, String(nar.threadStrength));

const weakNar = narrativeCheck({ answers: { why_idea: "Big market opportunity here.", product_description: "A dashboard for teams." }, interview:{}, chancing:{} });
ck("weak narrative warns", weakNar.notes.some(n => n.sev === "amber"), weakNar.notes.map(n=>n.title).join("|"));

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILURES`);
process.exit(fail?1:0);
