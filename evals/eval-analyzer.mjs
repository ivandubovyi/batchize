import { auditApplication, auditAnswer } from "./analyzer.bundle.mjs";
import { QUESTIONS } from "./analyzer.bundle.mjs";

const q = (id) => QUESTIONS.find((x) => x.id === id);
let fails = 0;
const check = (name, cond, extra = "") => {
  if (!cond) fails++;
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};
const titles = (a) => a.findings.map((f) => f.title);
const has = (a, sub) => a.findings.some((f) => f.title.includes(sub));

console.log("--- per-answer checks ---");

// one-liner cap
let a = auditAnswer(q("one_liner"), "A revolutionary AI-powered platform that will disrupt the entire logistics industry");
check("one-liner over cap flagged", has(a, "cap is 50"));
check("one-liner buzzwords flagged", has(a, "Buzzwords"));

// good one-liner
a = auditAnswer(q("one_liner"), "Stripe for freight invoices");
check("good one-liner has no red", !a.findings.some((f) => f.sev === "red"), titles(a).join("|"));

// product description without mechanics
a = auditAnswer(q("product_description"), "Our mission is to empower every logistics company with a seamless, innovative solution that transforms the way they work.");
check("no-mechanics flagged", has(a, "what a user actually does"));
check("mission-speak flagged", has(a, "Mission statement"));

// product description with mechanics
a = auditAnswer(q("product_description"), "A broker connects their TMS, and every invoice is generated, financed within 24 hours, and auto-reconciled. Users can see each invoice status on one dashboard.");
check("mechanics recognized", has(a, "real product mechanics"));

// traction without numbers
a = auditAnswer(q("how_far"), "We are growing really fast and lots of users love the product.");
check("no-numbers flagged", has(a, "No numbers at all"));

// traction with bare numbers, no period
a = auditAnswer(q("how_far"), "We have 1200 users and 45 signups.");
check("numbers-without-period flagged", has(a, "without a time period"), titles(a).join("|"));

// strong traction
a = auditAnswer(q("how_far"), "Launched 8 weeks ago. 23 brokers paying $400/mo, $9.2k MRR growing 18% w/w, 92% retention.");
check("strong traction gets green metrics", has(a, "concrete numbers"));
check("strong traction has no red", !a.findings.some((f) => f.sev === "red"), titles(a).join("|"));

// competitors: none claim
a = auditAnswer(q("competitors"), "We have no competitors, nobody else is doing this at all in the market today.");
check("no-competitors flagged red", a.findings.some((f) => f.sev === "red" && f.title.includes("no competitors")));

// competitors: named
a = auditAnswer(q("competitors"), "The closest alternatives are TriumphPay and Denim, plus brokers using Excel. They optimize financing; we found brokers actually pay for reconciliation.");
check("named competitors recognized", has(a, "Names real alternatives"), titles(a).join("|"));

// why idea: no personal
a = auditAnswer(q("why_idea"), "This is a very large market with strong tailwinds and we think there is a big opportunity for a new entrant to capture share over time.");
check("no lived experience flagged", has(a, "No lived experience"));

// why idea: personal
a = auditAnswer(q("why_idea"), "When I was running ops at a 40-truck carrier, I spent every Friday chasing invoices. We talked to 30 brokers and discovered their factoring and TMS never sync.");
check("founder-market fit recognized", has(a, "Founder-market fit"));

// equity hedging is red
a = auditAnswer(q("equity_split"), "We think it's roughly equal, maybe we will sort of figure out the exact split later.");
check("equity hedging red", a.findings.some((f) => f.sev === "red" && f.title.includes("evasive")), titles(a).join("|"));

// comparative with no baseline
a = auditAnswer(q("whats_new"), "Our approach is much faster and better than what teams use now.");
check("baseless comparative flagged", has(a, "than what?"), titles(a).join("|"));

// run-on
a = auditAnswer(q("why_idea"), "When I was working " + "on this problem for a long time in many different ways with many different people ".repeat(4) + "we realized something.");
check("run-on flagged", has(a, "runs"), titles(a).join("|"));

console.log("\n--- cross-application checks ---");

const mk = (answers) => ({ answers, interview: {}, chancing: {} });

let full = auditApplication(mk({
  one_liner: "Stripe for freight invoices",
  product_description: "A broker connects their TMS and users can see every invoice auto-reconciled on one dashboard.",
  how_far: "Launched 8 weeks ago with 2,000 users. $9.2k MRR growing 18% w/w.",
  users: "We have 1,200 users active weekly.",
}));
check("contradictory counts caught", full.crossFindings.some((f) => f.title.includes("Contradictory numbers")), full.crossFindings.map(f=>f.title).join("|"));

full = auditApplication(mk({
  users: "None yet, zero users so far.",
  revenue: "$4,000 MRR from early accounts.",
}));
check("revenue-without-users caught", full.crossFindings.some((f) => f.title.includes("Revenue but no users")), full.crossFindings.map(f=>f.title).join("|"));

const dupSentence = "We are building the definitive infrastructure layer for freight brokers everywhere.";
full = auditApplication(mk({
  product_description: dupSentence,
  why_idea: dupSentence,
}));
check("duplicate sentence caught", full.crossFindings.some((f) => f.title.includes("same sentence")), full.crossFindings.map(f=>f.title).join("|"));

console.log("\n--- scoring ladder ---");

const empty = auditApplication(mk({}));
const weak = auditApplication(mk({
  one_liner: "Revolutionary AI-powered platform to disrupt logistics",
  product_description: "Our mission is to empower everyone with a seamless innovative solution.",
  why_idea: "We think it is a huge market and hopefully we can capture some of it. We have no competitors.",
  how_far: "We are growing really fast and users love it.",
}));
const strong = auditApplication(mk({
  video_script: "I'm Ada, I'm Riley. We ran ops at two freight carriers. We make invoicing instant. 23 brokers pay us $9.2k MRR today.",
  how_met: "We worked together for 3 years at a 40-truck carrier and shipped two internal tools together.",
  who_codes: "Both founders write the code; Riley owns the backend.",
  hacked_system: "I got our carrier onto a shipper's approved list by driving to their yard and fixing their dock scheduling myself over two weeks.",
  company_name: "Ledgerhaul",
  one_liner: "Stripe for freight invoices",
  company_url: "https://ledgerhaul.com",
  product_description: "A broker connects their TMS. Every invoice is generated, financed within 24 hours, and auto-reconciled. Users can see status on one dashboard instead of three tools.",
  location: "We live in Chicago and would move to the Bay Area for the batch.",
  how_far: "Launched 8 weeks ago. 23 brokers paying $400/mo, $9.2k MRR growing 18% w/w, 92% retention.",
  tech_stack: "TypeScript, Postgres, Temporal for workflows.",
  users: "23 paying brokers, 41 weekly active users.",
  revenue: "$9.2k MRR, growing 18% week over week.",
  work_duration: "9 months, full-time for the last 5 months.",
  why_idea: "When I was running ops at a 40-truck carrier, I spent every Friday chasing invoices. We interviewed 30 brokers and discovered their factoring and TMS never sync.",
  whats_new: "Brokers use TriumphPay plus Excel and 11 days of manual reconciliation. We collapse that into one API call.",
  competitors: "TriumphPay and Denim are closest. They optimize financing; we learned brokers pay for reconciliation, not money speed.",
  money: "We charge $400 per broker per month. 12,000 US brokers means a $57M annual market at that price.",
  category: "Fintech",
  legal_entity: "Delaware C corp formed in March 2026.",
  equity_split: "50/50 between the two founders, with a 10% option pool.",
  investment: "$500k on a post-money SAFE at a $10M cap.",
  fundraising: "No, not currently raising.",
  other_ideas: "A dispatch scheduling tool and a driver payments app.",
  other_accelerators: "No, this is our first accelerator application.",
  how_heard: "From a founder in our industry who did the batch.",
}));

console.log(`empty=${empty.total} weak=${weak.total} strong=${strong.total}`);
check("empty scores very low", empty.total <= 25, String(empty.total));
check("weak below strong", weak.total < strong.total, `${weak.total} vs ${strong.total}`);
check("strong is high", strong.total >= 70, String(strong.total));
check("strong coverage 100%", strong.coverage === 100, String(strong.coverage));
check("weak produces reds", weak.reds >= 3, String(weak.reds));
check("strong produces greens", strong.greens >= 4, String(strong.greens));
check("priorities listed worst-first", !strong.priorities.length || strong.priorities[0].finding.sev !== "green");
check("every question audited", strong.sections.reduce((s, x) => s + x.audits.length, 0) === QUESTIONS.length);

console.log(`\nstrong dims: c=${strong.clarity} e=${strong.evidence} i=${strong.insight} a=${strong.ambition}`);
console.log(`strong reds=${strong.reds} ambers=${strong.ambers} greens=${strong.greens}`);
console.log(`strong priorities: ${strong.priorities.slice(0,5).map(p=>p.finding.title).join(" | ")}`);

console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILURES`);
process.exit(fails ? 1 : 0);
