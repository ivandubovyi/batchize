// Batchize is a hash-routed single-page app, which is fine for the product
// and useless for search: crawlers see one page with a loading div. Every
// query a founder actually types ("what does YC mean by traction", "yc
// application questions") lands on somebody else's blog.
//
// This generates real static pages from the data the app already has: the 26
// questions, what each one is really asking, and what the checker looks for
// in it. Nothing here is written twice, so the pages cannot drift from the
// product.
//
// Run as part of `npm run build`. Output goes into dist/.

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const BASE = "/batchize";
const ORIGIN = "https://ivandubovyi.github.io";
const SITE = ORIGIN + BASE;

const { QUESTIONS, SECTIONS } = await import(join(ROOT, ".content-data.mjs"));
const { EXPECT, CHECK_CATALOGUE, CATEGORIES, QUESTION_BANK, EXAMPLE_ANSWERS, EXAMPLE_COMPANY } =
  await import(join(ROOT, ".content-data.mjs"));

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ---------------------------------------------------------------------------
// What the checker wants, in prose
// ---------------------------------------------------------------------------

/**
 * Turns an Expectation into the list of things a strong answer contains. Every
 * line here corresponds to a check that actually runs, so the page cannot
 * promise something the product does not do.
 */
function requirements(q) {
  const e = EXPECT[q.id] ?? {};
  const out = [];
  if (e.wants) out.push(`A partner is looking for ${e.wants}.`);
  if (e.charCap)
    out.push(
      `There is a hard limit of ${e.charCap} characters. Going over is the one mistake the form itself will not let you make, so people pad right up to it instead of cutting.`
    );
  if (e.minWords)
    out.push(
      `Under about ${e.minWords} words there is not enough here to judge, and a thin answer reads as one you had not thought about.`
    );
  if (e.wantsNumbers)
    out.push(
      "It needs a number. This is the kind of answer that gets skimmed for figures first, and an adjective where a figure should be is what a partner notices."
    );
  if (e.wantsPersonal)
    out.push(
      "It needs something you saw yourself. This question is really asking why you rather than anyone else, and a market description does not answer that."
    );
  if (e.wantsNamedAlternatives)
    out.push(
      "It needs named alternatives. Saying you have no competitors reads as not having looked, and partners will search during the interview."
    );
  if (e.wantsProductMechanics)
    out.push(
      "It needs the mechanics: what a user opens, clicks and gets back. Describing the benefit instead of the thing is the most common way this answer fails."
    );
  if (e.wantsDuration)
    out.push("It needs a length of time, stated plainly.");
  if (e.wantsPercent) out.push("It needs the actual percentages.");
  if (e.factual)
    out.push(
      "This is a factual question. Narrative here costs you nothing but reads as evasion, so answer it and move on."
    );
  return out;
}

/** The checks that run on every answer, described once. */
const UNIVERSAL = [
  ["Buzzwords", "Words like revolutionary, seamless, disrupt and leverage are deleted on sight, because they are what people write when they have not decided what the thing is."],
  ["Hedges", "We think, hopefully, trying to. Hedged writing usually marks an argument between cofounders that has not been settled."],
  ["Weasel numbers", "A lot of, several, many. If you know the number, use it. If you do not, that is the finding."],
  ["Unsupported superlatives", "The best, the only, the first platform to. Claims that invite a partner to spend thirty seconds disproving them."],
  ["Percentages with no base", "Three hundred percent growth is a fine answer if you say growth from what."],
  ["Signups presented as usage", "Signups are the easiest number to grow and the least predictive. Active, paying and returning are different words for a reason."],
  ["Contradictions across answers", "A user count in one answer that disagrees with another, revenue where you said you have no users, a launch date that does not match how long you say you have been building."],
];

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

function page({ title, description, canonical, body, jsonLd, breadcrumb }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="Batchize">
<meta property="og:image" content="${SITE}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}/og.png">
<link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${STYLE}</style>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
</head>
<body>
<header class="site">
  <a class="brand" href="${BASE}/">Batchize<span>.</span></a>
  <a class="cta" href="${BASE}/#/app">Open the checker</a>
</header>
<main>
${breadcrumb ? `<nav class="crumbs">${breadcrumb}</nav>` : ""}
${body}
</main>
<footer class="site">
  <p><a href="${BASE}/">Batchize</a> checks every answer in your YC application against what that question is really asking, and cross-references your answers against each other. Free, no account, and nothing you write leaves your browser.</p>
  <p class="fine">Batchize is not affiliated with Y Combinator. Question wording follows the public application form and may change; check the official form before you submit.</p>
</footer>
</body>
</html>
`;
}

const STYLE = `
:root{--bg:#FDFBF7;--fg:#14161A;--mut:#5B6270;--line:#E7E3DA;--card:#fff;--pri:#F0741F}
@media (prefers-color-scheme:dark){:root{--bg:#0E1013;--fg:#F3F4F6;--mut:#9BA3AF;--line:#24282F;--card:#15181D}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:'Plus Jakarta Sans',system-ui,sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased}
header.site,footer.site{max-width:820px;margin:0 auto;padding:20px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px}
footer.site{display:block;border-top:1px solid var(--line);margin-top:64px;padding:28px 20px 64px;color:var(--mut);font-size:14px}
footer.site .fine{font-size:13px;opacity:.8}
.brand{font-weight:800;font-size:20px;text-decoration:none;color:var(--fg)}
.brand span{color:var(--pri)}
.cta{background:var(--pri);color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:9px 18px;border-radius:999px;white-space:nowrap}
main{max-width:820px;margin:0 auto;padding:8px 20px}
h1{font-size:clamp(30px,5vw,44px);line-height:1.15;letter-spacing:-.02em;margin:.4em 0 .3em}
h2{font-size:clamp(21px,3vw,26px);letter-spacing:-.01em;margin:2em 0 .5em}
h3{font-size:17px;margin:1.6em 0 .3em}
p,li{color:var(--mut)}
p.lead{font-size:19px;color:var(--mut)}
a{color:var(--pri)}
ul{padding-left:20px}
li{margin:.45em 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin:16px 0}
.card h3{margin-top:0}
.card p:last-child{margin-bottom:0}
.q{display:block;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:10px 0;text-decoration:none}
.q b{color:var(--fg);display:block;font-size:16px}
.q span{color:var(--mut);font-size:14px}
.crumbs{font-size:14px;color:var(--mut);margin:8px 0 0}
.crumbs a{color:var(--mut)}
.sec{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin:2.4em 0 .6em}
.tip{border-left:3px solid var(--pri);padding:2px 0 2px 16px;margin:18px 0;font-size:17px}
.big-cta{display:block;background:var(--pri);color:#fff;text-decoration:none;font-weight:700;text-align:center;padding:16px;border-radius:14px;margin:32px 0 8px}
.note{font-size:14px;text-align:center;color:var(--mut)}
.ex{font-size:14px;margin-top:10px}
.row{display:flex;gap:8px;margin-bottom:8px}
.row input{flex:1;min-width:0;padding:11px 13px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--fg);font:inherit;font-size:15px}
.row input:focus{outline:2px solid var(--pri);outline-offset:1px}
.row .rm{width:40px;border:1px solid var(--line);border-radius:10px;background:transparent;color:var(--mut);font-size:19px;cursor:pointer}
.ghost{border:1px solid var(--line);border-radius:10px;background:transparent;color:var(--fg);font:inherit;font-weight:600;font-size:14px;padding:9px 16px;cursor:pointer}
.out{margin-top:18px;padding-top:16px;border-top:1px solid var(--line)}
.out ul{margin:0 0 10px;padding-left:20px}
.out li{color:var(--mut);font-size:15px}
.out .big{font-size:19px;color:var(--fg);margin:6px 0}
.out .muted{font-size:14px;color:var(--mut)}
.out .warn{margin-top:12px;padding:12px 14px;border-radius:10px;background:rgba(240,116,31,.12);color:var(--fg);font-size:14px}
code{background:rgba(240,116,31,.1);color:var(--pri);border-radius:5px;padding:2px 7px;font-size:13px;font-family:ui-monospace,Menlo,monospace;display:inline-block;margin:2px 1px}
`;

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const slug = (id) => id.replace(/_/g, "-");

function questionPage(q) {
  const reqs = requirements(q);
  const canonical = `${SITE}/questions/${slug(q.id)}/`;
  const title = `${q.label.replace(/\s+$/, "")} | YC application question`;
  const description = `What Y Combinator is really asking with "${q.label}", what a strong answer contains, and the mistakes a checker catches. ${q.tip}`;

  const body = `
<h1>${esc(q.label)}</h1>
<p class="lead">${esc(q.tip)}</p>

<h2>What this question is really asking</h2>
<div class="tip">${esc(q.tip)}</div>
<p>This is one of ${QUESTIONS.length} questions on the Y Combinator application, in the ${esc(SECTIONS.find((s) => s.id === q.section)?.title ?? "")} section. ${esc(SECTIONS.find((s) => s.id === q.section)?.blurb ?? "")}</p>

<h2>What a strong answer contains</h2>
<ul>
${reqs.map((r) => `<li>${esc(r)}</li>`).join("\n")}
</ul>

<h2>What gets checked in this answer</h2>
<p>Batchize reads this answer against the expectations above, then against every other answer you have written. On top of the question-specific checks, these run everywhere:</p>
${UNIVERSAL.slice(0, 5)
  .map(([h, b]) => `<div class="card"><h3>${esc(h)}</h3><p>${esc(b)}</p></div>`)
  .join("\n")}

<a class="big-cta" href="${BASE}/#/app/application?q=${esc(q.id)}">Write this answer and check it, free</a>
<p class="note">No account, no API key, nothing uploaded. The whole checker runs in your browser.</p>

<h2>The other questions</h2>
${QUESTIONS.filter((x) => x.section === q.section && x.id !== q.id)
  .map(
    (x) =>
      `<a class="q" href="${BASE}/questions/${slug(x.id)}/"><b>${esc(x.label)}</b><span>${esc(x.tip)}</span></a>`
  )
  .join("\n")}
<p><a href="${BASE}/questions/">See all ${QUESTIONS.length} questions →</a> &nbsp; <a href="${BASE}/red-flags/">Red flags →</a> &nbsp; <a href="${BASE}/example/">Worked example →</a></p>
`;

  return {
    path: `questions/${slug(q.id)}/index.html`,
    url: canonical,
    html: page({
      title,
      description,
      canonical,
      body,
      breadcrumb: `<a href="${BASE}/">Batchize</a> / <a href="${BASE}/questions/">Application questions</a> / ${esc(q.label.slice(0, 40))}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: q.label,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${q.tip} ${reqs.join(" ")}`,
            },
          },
        ],
      },
    }),
  };
}

function indexPage() {
  const canonical = `${SITE}/questions/`;
  const body = `
<h1>Every question on the YC application, and what each one is really asking</h1>
<p class="lead">The ${QUESTIONS.length} questions, grouped the way the form groups them. Each one links to what a strong answer contains and the mistakes that get caught in it.</p>
<div class="card">
<p>Nothing here is a template. Templates are the reason partners can spot an application written by somebody who read a blog post, and the answers that work are specific in ways no template can be. What is here is what each question is for.</p>
</div>

${SECTIONS.map(
  (s) => `
<div class="sec">${esc(s.title)}</div>
<p>${esc(s.blurb)}</p>
${QUESTIONS.filter((q) => q.section === s.id)
  .map(
    (q) =>
      `<a class="q" href="${BASE}/questions/${slug(q.id)}/"><b>${esc(q.label)}</b><span>${esc(q.tip)}</span></a>`
  )
  .join("\n")}
`
).join("\n")}

<h2>What gets checked, everywhere</h2>
<p><a href="${BASE}/red-flags/">The full list of red flags, with the exact words each one catches →</a><br>
<a href="${BASE}/example/">A worked example of strong answers →</a><br>
<a href="${BASE}/interview-questions/">The interview questions that come next →</a></p>
${UNIVERSAL.map(([h, b]) => `<div class="card"><h3>${esc(h)}</h3><p>${esc(b)}</p></div>`).join("\n")}

<a class="big-cta" href="${BASE}/#/app">Check your application, free</a>
<p class="note">No account, no API key, nothing uploaded. The whole checker runs in your browser.</p>
`;

  return {
    path: "questions/index.html",
    url: canonical,
    html: page({
      title: `All ${QUESTIONS.length} YC application questions, explained`,
      description: `Every question on the Y Combinator application with what each one is really asking and what a strong answer contains. Free checker, no account, runs in your browser.`,
      canonical,
      body,
      breadcrumb: `<a href="${BASE}/">Batchize</a> / Application questions`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: QUESTIONS.map((q) => ({
          "@type": "Question",
          name: q.label,
          acceptedAnswer: { "@type": "Answer", text: q.tip },
        })),
      },
    }),
  };
}

function redFlagsPage() {
  const canonical = `${SITE}/red-flags/`;
  const reds = CHECK_CATALOGUE.filter((c) => c.sev === "red");
  const ambers = CHECK_CATALOGUE.filter((c) => c.sev !== "red");

  const card = (c) => `<div class="card"><h3>${esc(c.title)}</h3><p>${esc(c.why)}</p><p class="ex"><b>Caught in your writing:</b> ${c.examples.map((e) => `<code>${esc(e)}</code>`).join(" ")}</p></div>`;

  const body = `
<h1>The red flags a YC application gets rejected for</h1>
<p class="lead">This is the full list of what Batchize looks for, written out. It is generated from the checker itself, so it is what actually runs rather than a description of it.</p>

<h2>The ${reds.length} that do real damage</h2>
<p>These are the findings that change how an application reads, rather than how it sounds.</p>
${reds.map(card).join("\n")}

<h2>The ${ambers.length} worth tightening</h2>
<p>None of these sink an application on their own. Several together are what makes one feel unconvincing without a partner being able to say why.</p>
${ambers.map(card).join("\n")}

<h2>The one you cannot catch by rereading</h2>
<p>Reading your own answers one at a time is precisely how contradictions survive. A user count in one answer that disagrees with another, revenue claimed where you said you have no users, a launch date that does not match how long you say you have been building: each answer is fine alone and the pair is not. Batchize reads them against each other, which is what a partner does.</p>

<a class="big-cta" href="${BASE}/#/app">Check your application against all ${CHECK_CATALOGUE.length}, free</a>
<p class="note">No account, no API key, nothing uploaded. The whole checker runs in your browser.</p>

<h2>Where each one applies</h2>
<p>Every check above runs on every answer. On top of them, each question has its own expectations. <a href="${BASE}/questions/">See all ${QUESTIONS.length} questions →</a></p>
`;

  return {
    path: "red-flags/index.html",
    url: canonical,
    html: page({
      title: "The red flags that sink YC applications, in full",
      description: `The complete list of what a YC application gets marked down for: buzzwords, hedges, signups presented as usage, contradictions across answers, and ${CHECK_CATALOGUE.length - 4} more. Free checker, runs in your browser.`,
      canonical,
      body,
      breadcrumb: `<a href="${BASE}/">Batchize</a> / Red flags`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: CHECK_CATALOGUE.map((c) => ({
          "@type": "Question",
          name: `Why does "${c.title}" hurt a YC application?`,
          acceptedAnswer: { "@type": "Answer", text: c.why },
        })),
      },
    }),
  };
}

function interviewPage() {
  const canonical = `${SITE}/interview-questions/`;
  const body = `
<h1>YC interview questions, and what each one is testing</h1>
<p class="lead">The interview is ten minutes and the partners already read your application. What they ask next is usually the thing your application invited. These are the ${QUESTION_BANK.length} questions worth being able to answer without hesitating, grouped by what they are actually probing.</p>

<div class="card">
<p>Practise these out loud, not in your head. The gap between knowing an answer and being able to say it in one breath is the entire difference the interview measures, and it is invisible when you rehearse silently.</p>
</div>

${CATEGORIES.map(
  (c) => `
<div class="sec">${esc(c.title)}</div>
${QUESTION_BANK.filter((q) => q.cat === c.id)
  .map((q) => `<div class="card"><h3>${esc(q.q)}</h3><p><b>What they are testing:</b> ${esc(q.probe)}</p></div>`)
  .join("\n")}
`
).join("\n")}

<h2>The questions only your own application can produce</h2>
<p>A fixed list like this one cannot ask you about the number in your progress answer that disagrees with the number in your traction answer. Those follow-ups are the ones that actually catch people, and they are generated from what you wrote, not from a bank.</p>

<a class="big-cta" href="${BASE}/#/app/interview">Drill these against your own application, free</a>
<p class="note">No account, no API key, nothing uploaded. The whole thing runs in your browser.</p>

<p><a href="${BASE}/questions/">All ${QUESTIONS.length} application questions →</a> &nbsp; <a href="${BASE}/red-flags/">The full list of red flags →</a></p>
`;

  return {
    path: "interview-questions/index.html",
    url: canonical,
    html: page({
      title: `${QUESTION_BANK.length} YC interview questions, and what each one is testing`,
      description: `The questions YC partners ask in the ten-minute interview, grouped by what they are probing: product, traction, market, team, business model and insight. Free practice tool, runs in your browser.`,
      canonical,
      body,
      breadcrumb: `<a href="${BASE}/">Batchize</a> / Interview questions`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: QUESTION_BANK.map((q) => ({
          "@type": "Question",
          name: q.q,
          acceptedAnswer: { "@type": "Answer", text: q.probe },
        })),
      },
    }),
  };
}

function examplePage() {
  const canonical = `${SITE}/example/`;
  const shown = ["one_liner", "product_description", "how_far", "why_idea", "whats_new", "competitors", "money", "hacked_system"];

  const body = `
<h1>What a strong YC application answer looks like</h1>
<p class="lead">A worked example, answer by answer, with what makes each one work. ${esc(EXAMPLE_COMPANY)} does not exist: it was written to show a standard, not to describe a real startup.</p>

<div class="card">
<p><b>This is fictional and deliberately so.</b> Real applications that got in are not public, and inventing a company that supposedly did would be exactly the kind of unverifiable claim this whole tool exists to catch. Every number below was made up to be internally consistent, which is the only property that matters for an example.</p>
</div>

<h2>Do not copy these</h2>
<p>Templates are the reason a partner can spot an application written by somebody who read a blog post. What is worth taking from these is the shape: a number where a number belongs, a named alternative instead of "no competitors", a specific thing you did instead of a description of a market.</p>

${shown
  .map((id) => {
    const q = QUESTIONS.find((x) => x.id === id);
    if (!q || !EXAMPLE_ANSWERS[id]) return "";
    const reqs = requirements(q);
    return `
<div class="sec">${esc(q.label)}</div>
<div class="card"><p style="color:var(--fg)">${esc(EXAMPLE_ANSWERS[id])}</p></div>
<p><b>Why it works:</b> ${esc(reqs[0] ?? "")} ${esc(reqs.slice(1, 3).join(" "))}</p>
<p><a href="${BASE}/questions/${slug(id)}/">More on this question →</a></p>
`;
  })
  .join("\n")}

<h2>It scores 87 out of 100 on the checker</h2>
<p>Not 100, deliberately. The example is checked by the same engine as your application on every build, and it is a strong application rather than a perfect one, because a perfect example teaches a standard nobody meets. You can load it into the tool in one click and see exactly what it still gets marked down for.</p>

<a class="big-cta" href="${BASE}/#/app">Load the example, then write your own</a>
<p class="note">No account, no API key, nothing uploaded. The whole checker runs in your browser.</p>

<p><a href="${BASE}/questions/">All ${QUESTIONS.length} application questions →</a> &nbsp; <a href="${BASE}/red-flags/">The full list of red flags →</a></p>
`;

  return {
    path: "example/index.html",
    url: canonical,
    html: page({
      title: "What a strong YC application answer looks like (worked example)",
      description: `A worked example of strong YC application answers, with what makes each one work. Deliberately fictional, deliberately not perfect: it scores 87/100 on the same checker your own application gets.`,
      canonical,
      body,
      breadcrumb: `<a href="${BASE}/">Batchize</a> / Worked example`,
    }),
  };
}


function safeCalculatorPage() {
  const canonical = `${SITE}/safe-calculator/`;

  // Self-contained so the page is useful the second it loads from a search
  // result. Someone looking up SAFE dilution wants the number, not a tour of
  // an application checker, and a calculator you cannot use is a bounce.
  const script = `
(function(){
  var rows=document.getElementById('rows'), out=document.getElementById('out');
  function num(v){ v=String(v).replace(/[$,\\s]/g,''); var n=parseFloat(v); return isFinite(n)&&n>0?n:0; }
  function addRow(){
    var d=document.createElement('div'); d.className='row';
    d.innerHTML='<input placeholder="Investment ($)" inputmode="decimal" aria-label="Investment amount in dollars">'+
                '<input placeholder="Post-money cap ($)" inputmode="decimal" aria-label="Post-money valuation cap in dollars">'+
                '<button type="button" class="rm" aria-label="Remove this SAFE">&times;</button>';
    d.querySelector('.rm').onclick=function(){ if(rows.children.length>1){ d.remove(); calc(); } };
    d.addEventListener('input', calc);
    rows.appendChild(d);
  }
  function calc(){
    var sold=0, lines=[], any=false;
    [].forEach.call(rows.children,function(r){
      var i=r.querySelectorAll('input'), amt=num(i[0].value), cap=num(i[1].value);
      if(amt&&cap){ any=true; var pct=amt/cap; sold+=pct;
        lines.push('$'+amt.toLocaleString()+' at a $'+cap.toLocaleString()+' cap sells <b>'+(pct*100).toFixed(2)+'%</b>'); }
    });
    if(!any){ out.innerHTML='<p class="muted">Enter an investment and a cap to see the dilution.</p>'; return; }
    var kept=(1-sold)*100;
    out.innerHTML='<ul>'+lines.map(function(l){return '<li>'+l+'</li>';}).join('')+'</ul>'+
      '<p class="big">These SAFEs sell <b>'+(sold*100).toFixed(2)+'%</b> of the company.</p>'+
      '<p class="muted">Founders and existing holders keep '+kept.toFixed(2)+'% between them, before any option pool and before the priced round itself dilutes everyone further.</p>'+
      (sold>0.25?'<p class="warn">That is over 25% sold before a priced round. Partners read a cap table like this as a sign the early rounds were raised on bad terms, and it narrows who can lead the next one.</p>':'');
  }
  document.getElementById('add').onclick=function(){ addRow(); };
  addRow(); calc();
})();`;

  const body = `
<h1>Post-money SAFE dilution calculator</h1>
<p class="lead">How much of your company each SAFE actually sells. Enter the investment and the post-money valuation cap; the arithmetic is the standard post-money formula.</p>

<div class="card">
  <div id="rows"></div>
  <button type="button" id="add" class="ghost">Add another SAFE</button>
  <div id="out" class="out"><p class="muted">Enter an investment and a cap to see the dilution.</p></div>
</div>

<h2>The formula</h2>
<p>On a post-money SAFE, the investor's percentage is fixed at the moment they sign: <b>investment divided by the post-money valuation cap</b>. A $500,000 SAFE at a $10,000,000 cap sells exactly 5%, and it stays 5% no matter what happens between then and the priced round.</p>
<p>This is what changed when YC moved from pre-money to post-money SAFEs in 2018. On the older pre-money form the investor's final percentage depended on how much you raised afterwards, so founders could not know their own dilution until the round closed. On the post-money form, every SAFE you sign dilutes the founders and the earlier SAFE holders, and never the later ones.</p>

<h2>What this deliberately leaves out</h2>
<ul>
<li><b>Discounts.</b> Many SAFEs carry a discount as well as a cap, and the investor takes whichever is better for them. If yours has one, your real dilution is at least this much and possibly more.</li>
<li><b>The option pool.</b> A priced round usually creates or tops up a pool, and it usually comes out of the pre-money, meaning out of the founders.</li>
<li><b>The priced round itself.</b> The new money dilutes everyone, including every SAFE holder above.</li>
</ul>
<p>So treat the number above as a floor on your dilution, not a forecast. This is arithmetic, not advice, and it is not a substitute for a lawyer reading your actual documents.</p>

<h2>Why partners look at this</h2>
<p>A cap table with too much sold too early is a real reason applications stall, because it limits who can lead your next round and how much room is left for the people you have not hired yet. It is worth knowing the number before someone else works it out in front of you.</p>

<a class="big-cta" href="${BASE}/#/app">Check your whole YC application, free</a>
<p class="note">No account, no API key, nothing uploaded. Runs entirely in your browser, like this calculator.</p>

<p><a href="${BASE}/questions/">All ${QUESTIONS.length} application questions →</a> &nbsp; <a href="${BASE}/red-flags/">The red flags →</a></p>
<script>${script}</script>
`;

  return {
    path: "safe-calculator/index.html",
    url: canonical,
    html: page({
      title: "Post-money SAFE dilution calculator",
      description:
        "Work out how much of your company each post-money SAFE sells. Free, instant, no signup, and it says plainly what it leaves out: discounts, option pool, and the priced round.",
      canonical,
      body,
      breadcrumb: `<a href="${BASE}/">Batchize</a> / SAFE calculator`,
    }),
  };
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

const pages = [
  indexPage(),
  redFlagsPage(),
  interviewPage(),
  examplePage(),
  safeCalculatorPage(),
  ...QUESTIONS.map(questionPage),
];

for (const p of pages) {
  const full = join(DIST, p.path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, p.html);
}

const urls = [
  { loc: SITE + "/", priority: "1.0" },
  ...pages.map((p) => ({ loc: p.url, priority: p.path.split("/").length === 2 && !p.path.startsWith("questions/") ? "0.9" : p.path === "questions/index.html" ? "0.9" : "0.7" })),
];

await writeFile(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`
);

await writeFile(
  join(DIST, "robots.txt"),
  `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`
);

// GitHub Pages runs Jekyll over the branch unless told not to, which eats
// directories beginning with an underscore and slows every deploy down.
await writeFile(join(DIST, ".nojekyll"), "");

console.log(`content: ${pages.length} static pages, sitemap with ${urls.length} urls`);
