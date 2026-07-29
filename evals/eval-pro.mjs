// The paid features have to be correct before anyone is charged for them.
import { diffWords, summariseDiff, buildPack, packToText, buildGrill, summariseGrill, exampleAppData, EXAMPLE_ANSWERS } from "./pro.bundle.mjs";
let fail = 0;
const ck = (n, c, x = "") => { if (!c) fail++; console.log(`${c ? "PASS" : "FAIL"} ${n}${x ? " :: " + x : ""}`); };

// --- diff ---------------------------------------------------------------
const d1 = diffWords("we have 12 paying customers", "we have 23 paying customers");
const added = d1.filter(p => p.op === "added").map(p => p.text.trim()).join("");
const removed = d1.filter(p => p.op === "removed").map(p => p.text.trim()).join("");
ck("diff finds the changed number", added === "23" && removed === "12", `+${added} -${removed}`);
ck("diff keeps the unchanged words", d1.filter(p => p.op === "same").length > 0);

const same = diffWords("identical text here", "identical text here");
ck("identical text has no changes", same.every(p => p.op === "same"));

const grew = diffWords("short", "short and quite a lot longer now");
ck("pure addition is all added", grew.filter(p => p.op === "removed").length === 0);

const shrank = diffWords("a very long and rambling sentence", "a sentence");
ck("pure deletion is all removed", shrank.filter(p => p.op === "added").length === 0);

ck("empty to empty is empty", diffWords("", "").length === 0);
ck("empty to text is all added", diffWords("", "new words").every(p => p.op === "added"));

// Case-only edits should not read as a rewrite.
const cased = diffWords("Brokers pay us", "brokers pay us");
ck("case changes are not diffs", cased.every(p => p.op === "same"));

// --- diff summary against the worked example ----------------------------
const app = exampleAppData();
const edited = { ...EXAMPLE_ANSWERS, one_liner: "Something completely different" };
const sum = summariseDiff(EXAMPLE_ANSWERS, edited);
ck("summary counts exactly the changed answer", sum.changed === 1, String(sum.changed));
ck("summary reports a word delta", sum.wordDelta !== 0, String(sum.wordDelta));
ck("unchanged answers carry no diff parts", sum.questions.filter(q => !q.changed).every(q => q.parts.length === 0));

// --- submission pack ----------------------------------------------------
const pack = buildPack(app);
ck("pack covers every section", pack.sections.length === 6, String(pack.sections.length));
ck("pack has all 26 answers", pack.sections.reduce((n, s) => n + s.answers.length, 0) === 26);
ck("strong example leaves nothing unanswered", pack.unanswered.length === 0, pack.unanswered.join(","));
ck("one-liner is measured against its cap", pack.sections.flatMap(s => s.answers).find(a => a.id === "one_liner")?.hardCap === 50);

const openItems = pack.checklist.filter(c => !c.done);
console.log("checklist still open:", openItems.map(c => c.label).join(" | ") || "(none)");
ck("checklist has real items", pack.checklist.length >= 6, String(pack.checklist.length));
ck("strong example passes the red-flag item", pack.checklist.find(c => c.label.includes("red flags"))?.done === true);
ck("strong example passes the numbers item", pack.checklist.find(c => c.label.includes("numbers"))?.done === true);
ck("every checklist detail is specific", pack.checklist.every(c => c.detail.length > 15));

const empty = buildPack({ answers: {}, interview: {}, chancing: {} });
ck("empty application is not ready", empty.ready === false);
ck("empty application flags every blank", empty.unanswered.length === 26, String(empty.unanswered.length));
ck("empty pack still renders text", packToText(empty).includes("(not answered)"));

const text = packToText(pack);
ck("plain text has no markdown", !/[*_#]{1,}/.test(text.replace(/[^*_#]/g, "")) || !text.includes("**"));
ck("plain text includes the answers", text.includes(EXAMPLE_ANSWERS.one_liner));

// --- grill --------------------------------------------------------------
const grill = buildGrill(app);
ck("grill always has questions", grill.length >= 4, String(grill.length));
ck("grill questions are questions", grill.every(q => q.ask.trim().endsWith("?")), grill.filter(q => !q.ask.trim().endsWith("?")).map(q => q.ask).join(" | "));
ck("every grill question explains what it tests", grill.every(q => q.probing.length > 30));
ck("grill is ordered hardest first", grill.every((q, i) => i === 0 || grill[i - 1].weight >= q.weight));
ck("no duplicate questions", new Set(grill.map(q => q.ask)).size === grill.length);

const weak = {
  answers: {
    one_liner: "A revolutionary platform to disrupt logistics",
    what_building: "Our mission is to empower teams with a seamless solution.",
    how_far: "We have lots of users and great traction.",
    why_idea: "We think this is a big market.",
    competitors: "We have no competitors.",
  },
  interview: {}, chancing: {},
};
const weakGrill = buildGrill(weak);
ck("a weak application gets more questions than a strong one", weakGrill.length > grill.length, `${weakGrill.length} vs ${grill.length}`);
ck("weak application's hardest question quotes it", weakGrill.some(q => q.evidence));
const wsum = summariseGrill(weakGrill);
ck("summary separates derived from standard", wsum.standard === 4 && wsum.fromYourApplication > 0, `${wsum.fromYourApplication}/${wsum.standard}`);

console.log("\n--- sample grill on a weak application ---");
for (const q of weakGrill.slice(0, 4)) {
  console.log(`• ${q.ask}\n  testing: ${q.probing.slice(0, 90)}…${q.evidence ? `\n  invited by: “${q.evidence.slice(0, 70)}”` : ""}`);
}

console.log(fail ? `\n${fail} FAILURES` : "\nALL PASS");
process.exit(fail ? 1 : 0);
