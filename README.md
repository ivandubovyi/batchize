# Batchize

**A red-flag check for Y Combinator applications that runs entirely in your
browser.** No account needed, no API key, no upload. Your application is saved
to local storage on your own machine and only leaves it if you create an
account and press Upload yourself.

→ **[ivandubovyi.github.io/batchize](https://ivandubovyi.github.io/batchize/)**

Not affiliated with or endorsed by Y Combinator.

---

## Why it exists

Feedback on an application almost always judges one answer at a time, which is
exactly how the worst mistakes survive. A partner cross-references. They notice
that one answer says 23 customers and another says 40, that you claim revenue in
a section where you said you have no users, that a launch date does not match
how long you say you have been building. Each answer is fine alone. The pair is
not, and rereading your own answers one by one is precisely the way to miss it.

Batchize reads every answer against what that specific question is asking, then
reads all 26 against each other, and quotes the exact words that cost you.

## How it works without a model

There is no LLM call, and that is a design decision rather than a limitation to
apologise for. An application checker has to be free at the moment somebody
needs it, which rules out per-request cost, and it handles the honest version of
your traction, which rules out uploading it.

So the engine is a rules system in [`src/lib/analyzer.ts`](src/lib/analyzer.ts):
per-question expectations, sixteen classes of finding, and cross-answer
consistency checks. It quotes evidence rather than describing problems in the
abstract, which is the part that makes findings actionable.

The obvious risk with rules is crying wolf. A checker that flags correct
writing sends you off fixing things that were already fine, and after two false
positives nobody trusts the third finding. So it is measured on both axes
against a labelled corpus:

```
evals/corpus.mjs    26 signals that MUST fire, 29 that must NOT
evals/corpus2.mjs   adversarial cases: 10 hard positives, 8 hard negatives
evals/corpus3.mjs   precision first: mostly writing that must NOT be flagged
```

Current: **100% recall, 100% specificity** on both, plus a third tier that
tests precision under pressure at 7/7 and 25/25. Ten suites in total, all run
by one command:

```bash
sh evals/build.sh
```

`expect` lists signals that must fire; `forbid` lists signals that must not.
False positives are treated as equal in severity to misses, which is the whole
reason the numbers stay honest.

### It is dogfooded

[`evals/eval-example.mjs`](evals/eval-example.mjs) runs a worked example
application through the engine and asserts it scores well. When it was first
written it failed, and the four causes were all false positives in the checker:
video timestamps (`0:24 Brokers do this`) read as counts, "talking to 30
brokers" not recognised as research, "the first three hires" flagged as a
superlative boast, and "I drove to their yard at 5am" not counted as lived
experience because the verb was not on a list. All four are fixed and locked
with regression cases.

## What is in it

| | |
|---|---|
| **Quick score** | Eleven short questions, a score in about a minute |
| **Application** | All 26 real questions with what each one is actually asking, checked live as you type |
| **Full check** | Every answer graded, contradictions found across answers, prioritised fix list |
| **Tighten & brainstorm** | Cuts filler and hedging using only your own words. Leaves a bracket where a fact is missing rather than inventing one |
| **Partner coach** | Intent-routed, answers from the same engines, no key needed |
| **Interview** | Drills by topic with self-rated mastery |
| **Chancing** | A transparent readiness score. Explicitly not a prediction |
| **Tools** | SAFE dilution, runway, equity split, one-liner tester |
| **Export / import** | A JSON file you own, so clearing site data does not lose the work |
| **Account and sync** | Optional. Carries your application between machines. Off by default, and the app is fully usable having never signed in |

Three paid features exist behind a licence check ([`SELLING.md`](SELLING.md)):
draft history with word-level diffs, a printable submission pack, and a partner
grill that generates interview questions from your own weak spots. The analysis
is identical in both tiers. Pro does not make the check smarter, and the
pricing page says so.

## Licensing without a server

Selling something usually means accounts, which would break the one promise the
product makes. So a licence key is an ECDSA P-256 signature over a small
payload, verified in the browser against a public key compiled into the bundle.
Unlocking works offline and makes no request. Keys are re-verified on every
load, so editing local storage unlocks nothing.

A key can be shared, because there is nothing to phone home to. That is the same
property that means nothing you write is uploaded, and the pricing page states
it rather than pretending otherwise.

## Accounts

Optional, and structured so the privacy claim survives them: the browser copy
is the truth and the cloud is a copy of it, never the other way round. Nothing
is uploaded until somebody presses Upload.

Postgres on Supabase, one row per user, behind row level security keyed to
`auth.uid()`. Verified against the live project with two real accounts that a
second user cannot list, select by id, or overwrite another user's row. See
[`SUPABASE.md`](SUPABASE.md), including the two rough edges (no email
verification, weak password reset) and the twenty-minute SMTP fix for both.

Conflicts are never merged automatically. Stitching two versions of an answer
somebody rewrote six times produces a sentence neither version said, so it
asks.

## Static content

The app is hash-routed, which is fine for the product and invisible to
crawlers. [`scripts/gen-content.mjs`](scripts/gen-content.mjs) generates 32
static pages at build time from the same data the app uses: every question with
what it is really asking, and the full catalogue of red flags with the exact
words each one catches. Nothing is written twice, so adding a buzzword to the
lexicon changes the published page on the next build.

## Develop

```bash
npm install
npm run dev       # http://localhost:4690
npm run build     # tsc, vite, then the static content pages
sh evals/build.sh # rebuild every eval bundle and run all ten suites
npm run traffic   # GitHub repo traffic (not site visits, see DEPLOY.md)
```

**The eval bundles in `evals/` are build artifacts.** Editing `src/lib/*`
changes nothing until they are rebuilt, so always go through `evals/build.sh`
rather than running a suite directly.

## Stack

React 18, Vite 6, TypeScript, Tailwind v4 with the shadcn structure, deployed
to GitHub Pages. `vite.config.ts` sets `base: "/batchize/"` because Pages serves
from a subpath.

## Honesty rules this repo follows

- No invented testimonials, user counts, ratings, or capability claims.
- The worked example is labelled fictional in the file header and in the UI.
- Where something does not work, it says so instead of hiding. The site has no
  visitor analytics at all, and `DEPLOY.md` says that plainly rather than
  implying otherwise. The sign-up screen states that emails are unverified and
  that password reset barely works, rather than letting somebody find out.
- Adding accounts made "nothing leaves your browser" conditional, so every
  place that claimed it now says "unless you turn on sync" instead.
- The chancing score is called a heuristic, not a prediction, because that is
  what it is.
