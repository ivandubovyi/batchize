import { scoreQuick, quickToFullAnswers, QUICK_FIELDS } from "./quick.bundle.mjs";
let fail = 0;
const ck = (n, c, x = "") => { if (!c) fail++; console.log(`${c ? "PASS" : "FAIL"} ${n}${x ? " :: " + x : ""}`); };

const empty = scoreQuick({});
ck("empty scores 0", empty.total === 0, String(empty.total));
ck("empty still gives a next move", empty.nextMove.length > 10);

const preLaunch = scoreQuick({
  one_liner: "Invoice reconciliation for freight brokers",
  launched: "no", users: "0", paying: "0", revenue: "0", growth: "0", weeks: "3",
  fulltime: "no", technical: "yes",
  why: "I ran ops at a 40-truck carrier and chased invoices every Friday.",
  competitor: "TriumphPay, or Excel plus email threads.",
});
const strong = scoreQuick({
  one_liner: "Stripe for freight invoices",
  launched: "yes", users: "140", paying: "23", revenue: "9200", growth: "18", weeks: "8",
  fulltime: "yes", technical: "yes",
  why: "I ran ops at a 40-truck carrier and chased invoices every Friday.",
  competitor: "TriumphPay and Denim, or brokers using Excel.",
});
const buzzy = scoreQuick({
  one_liner: "A revolutionary AI platform to disrupt logistics forever",
  launched: "yes", users: "5", paying: "0", revenue: "0", growth: "0", weeks: "40",
  fulltime: "no", technical: "no",
  why: "We think it is a huge market opportunity.",
  competitor: "We have no competitors.",
});

console.log(`\nempty=${empty.total} preLaunch=${preLaunch.total} buzzy=${buzzy.total} strong=${strong.total}`);
ck("strong beats preLaunch", strong.total > preLaunch.total, `${strong.total} vs ${preLaunch.total}`);
ck("preLaunch beats buzzy", preLaunch.total > buzzy.total, `${preLaunch.total} vs ${buzzy.total}`);
ck("strong is high", strong.total >= 80, String(strong.total));
ck("buzzy is low", buzzy.total <= 40, String(buzzy.total));
ck("total never exceeds 100", strong.total <= 100);

ck("strong writing clean", strong.writing.every(w => w.good), strong.writing.map(w=>`${w.label}:${w.points}/${w.max}`).join(" "));
ck("buzzy one-liner penalised", buzzy.writing[0].points < 12, String(buzzy.writing[0].points));
ck("buzzy competitor penalised", buzzy.writing[2].points < 9, String(buzzy.writing[2].points));
ck("no-competitors surfaces finding", buzzy.findings.some(f => /no competitors/i.test(f.title)));
ck("preLaunch flags not-fulltime as gap", preLaunch.team.some(t => t.label === "Full-time" && !t.good));
ck("strong next move is minor", !/Launched|Paying customers/.test(strong.nextMove) || strong.total >= 90, strong.nextMove);

console.log("\nSTRONG next move:", strong.nextMove);
console.log("BUZZY next move: ", buzzy.nextMove);

const mapped = quickToFullAnswers({
  one_liner: "Stripe for freight invoices", why: "I ran ops at a carrier.",
  competitor: "TriumphPay.", launched: "yes", users: "140", paying: "23", revenue: "9200", growth: "18", weeks: "8",
});
console.log("\nIMPORT how_far:", mapped.how_far);
ck("import maps one-liner", mapped.one_liner === "Stripe for freight invoices");
ck("import maps why to why_idea", mapped.why_idea?.includes("carrier"));
ck("import builds traction draft", /Launched/.test(mapped.how_far) && /23 pay/.test(mapped.how_far) && /9,200 MRR/.test(mapped.how_far), mapped.how_far);
ck("import has no stray keys", Object.keys(mapped).every(k => ["one_liner","why_idea","competitors","how_far"].includes(k)), Object.keys(mapped).join(","));
ck("field count is short", QUICK_FIELDS.length <= 12, String(QUICK_FIELDS.length));

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILURES`);
process.exit(fail?1:0);
