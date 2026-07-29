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
const { EXPECT } = await import(join(ROOT, ".content-data.mjs"));

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
<p><a href="${BASE}/questions/">See all ${QUESTIONS.length} questions →</a></p>
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

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

const pages = [indexPage(), ...QUESTIONS.map(questionPage)];

for (const p of pages) {
  const full = join(DIST, p.path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, p.html);
}

const urls = [
  { loc: SITE + "/", priority: "1.0" },
  ...pages.map((p) => ({ loc: p.url, priority: p.path === "questions/index.html" ? "0.9" : "0.7" })),
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
