import { coachReply } from "./coach.bundle.mjs";
let fail = 0;
const ck = (n, c, x = "") => { if (!c) fail++; console.log(`${c ? "PASS" : "FAIL"} ${n}${x ? " :: " + x : ""}`); };
const app = (answers) => ({ answers, interview: {}, chancing: {} });

const EMPTY = app({});
const WEAK = app({
  one_liner: "A revolutionary platform to disrupt logistics",
  product_description: "Our mission is to empower teams with a seamless solution.",
  how_far: "We are growing really fast and users love it.",
  competitors: "We have no competitors.",
});
const STRONG = app({
  one_liner: "Stripe for freight invoices",
  product_description: "A broker connects their TMS. Users can see every invoice auto-reconciled on one dashboard.",
  why_idea: "When I was running ops at a 40-truck carrier, I spent every Friday chasing invoices. We interviewed 30 brokers.",
  how_far: "Launched 8 weeks ago. 23 brokers paying $400/mo, $9.2k MRR growing 18% w/w, 92% retention.",
  competitors: "TriumphPay and Denim are closest. They optimize financing; brokers actually pay for reconciliation.",
});

// 1. Never crashes, always returns text
const probes = ["", "hello", "asdkjhasd", "what can you do", "what is my weakest answer",
  "what should I fix first", "how am I doing", "help me with my one-liner", "rewrite my traction",
  "what will they ask in the interview", "what story does my application tell", "competitors?",
  "why me", "equity", "revenue", "make it better"];
let allOk = true, empties = [];
for (const st of [EMPTY, WEAK, STRONG]) {
  for (const p of probes) {
    const r = coachReply(p, st);
    if (!r || typeof r.text !== "string" || r.text.trim().length < 20) { allOk = false; empties.push(p); }
  }
}
ck(`${probes.length * 3} probes all return substantial text`, allOk, empties.join(","));

// 2. Empty app guides rather than erroring
const e = coachReply("what is my weakest answer", EMPTY);
ck("empty app is guided, not broken", /nothing for me to work with|Quick score/i.test(e.text), e.text.slice(0,60));

// 3. Weakest quotes real problems from the user's own text
const w = coachReply("what is my weakest answer", WEAK);
ck("weakest names real findings", /Buzzwords|no competitors|Mission statement/i.test(w.text), w.text.slice(0,90));
ck("weakest quotes the founder's words", /revolutionary|no competitors/i.test(w.text));

// 4. Fix-first gives one concrete action
const f = coachReply("what should I fix first", WEAK);
ck("fix-first is specific", f.text.length > 80 && /Fix this first|blank/i.test(f.text), f.text.slice(0,70));

// 5. Score summary reports real numbers
const s = coachReply("how am I doing", STRONG);
ck("score reports a number out of 100", /\d+\/100/.test(s.text), s.text.slice(0,70));
ck("score names lowest dimension", /lowest dimension is/i.test(s.text));

// 6. One-liner help gives candidates built from their own words
const ol = coachReply("help me with my one-liner", STRONG);
ck("one-liner help quotes their answer", /Stripe for freight invoices/.test(ol.text));

const olw = coachReply("help me with my one-liner", WEAK);
ck("weak one-liner gets a rewrite", /tighter version|What I would change/i.test(olw.text), olw.text.slice(0,80));
ck("rewrite never invents facts (brackets kept)", !/\$\d|\d+ users/.test(olw.text) || /\[/.test(olw.text));

// 7. Interview prep is grounded
const iv = coachReply("what will they ask in the interview", STRONG);
ck("interview gives real questions", (iv.text.match(/•/g) || []).length >= 3, iv.text.slice(0,60));
ck("interview explains what is tested", /really testing/i.test(iv.text));

// 8. Story
const st = coachReply("what story does my application tell", STRONG);
ck("story reports thread strength", /\d+%/.test(st.text), st.text.slice(0,60));

// 9. Chips always offered for follow-up
const chipCounts = probes.map(p => (coachReply(p, WEAK).chips ?? []).length);
ck("every reply offers follow-ups", chipCounts.every(c => c >= 1), chipCounts.join(","));

// 10. Fallback is useful, not apologetic
const fb = coachReply("purple monkey dishwasher", STRONG);
ck("fallback still reports status", /\d+\/100/.test(fb.text), fb.text.slice(0,60));
ck("fallback is not an apology", !/sorry|I can't|cannot help/i.test(fb.text));

console.log("\n--- sample: weakest (weak app) ---\n" + coachReply("what is my weakest answer", WEAK).text);
console.log("\n--- sample: one-liner (strong app) ---\n" + coachReply("help me with my one-liner", STRONG).text.slice(0, 500));

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILURES`);
process.exit(fail?1:0);
