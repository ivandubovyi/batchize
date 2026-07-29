#!/usr/bin/env node
// Repository traffic, free and with no tracking script.
//
// IMPORTANT: this measures the GitHub *repository* page, not the deployed
// site. GitHub Pages publishes no visitor analytics at all, so views here mean
// developers who found the code, not founders who used the checker. Do not
// read a zero as nobody visiting the site.
//
// For site analytics you need a provider and therefore an account. See the
// analytics section of DEPLOY.md: it is one script tag and about two minutes.
//
//   npm run traffic
//
// Needs the gh CLI, already authenticated.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);

const REPO = "ivandubovyi/batchize";

async function api(path) {
  try {
    const { stdout } = await run("gh", ["api", `repos/${REPO}/${path}`]);
    return JSON.parse(stdout);
  } catch (e) {
    if (/Not Found|403/.test(String(e.stderr))) return null;
    throw e;
  }
}

const [views, clones, referrers, paths] = await Promise.all([
  api("traffic/views"),
  api("traffic/clones"),
  api("traffic/popular/referrers"),
  api("traffic/popular/paths"),
]);

if (!views) {
  console.error(`Could not read traffic for ${REPO}. Run: gh auth login`);
  process.exit(1);
}

const bar = (n, max) => "█".repeat(Math.max(n && 1, Math.round((n / (max || 1)) * 28)));

console.log(`\nBatchize REPOSITORY traffic, last 14 days\n${"─".repeat(46)}`);
console.log("(the GitHub repo page, not the deployed site. Pages has no analytics.)\n");
console.log(`Views   ${views.count} total, ${views.uniques} unique visitors`);
if (clones) console.log(`Clones  ${clones.count} total, ${clones.uniques} unique`);

const max = Math.max(...views.views.map((v) => v.count), 1);
console.log(`\nBy day`);
for (const v of views.views) {
  const day = v.timestamp.slice(5, 10);
  console.log(`  ${day}  ${String(v.count).padStart(4)} ${bar(v.count, max)}`);
}

if (referrers?.length) {
  console.log(`\nWhere they came from`);
  for (const r of referrers) {
    console.log(`  ${r.referrer.padEnd(28)} ${String(r.count).padStart(4)} views, ${r.uniques} unique`);
  }
} else {
  console.log(`\nNo referrers recorded yet. Every visit so far was typed or from a private link.`);
}

if (paths?.length) {
  console.log(`\nMost visited pages`);
  for (const p of paths.slice(0, 12)) {
    console.log(`  ${p.path.padEnd(40).slice(0, 40)} ${String(p.count).padStart(4)} views`);
  }
}

console.log(
  `\nGitHub only keeps 14 days, so this is the whole record. Run it weekly if\nyou want a longer one. For visits to the live site rather than the repo,\nsee the analytics section of DEPLOY.md.\n`
);
