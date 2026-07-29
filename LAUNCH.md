# Launch kit

Everything below is written to be posted as-is. It is honest about what
Batchize is: a free tool with no users yet, built by one person. Nothing here
claims traction that does not exist, because the first person who tries it and
finds the claim false is the one person whose opinion mattered.

**Post these yourself.** They are your words to send, from your accounts.

---

## Timing

Post in the two weeks before a YC deadline, not after. The audience for this
tool is people who are mid-application and anxious, and that is a window, not a
steady state. Check the current deadline at
[ycombinator.com/apply](https://www.ycombinator.com/apply).

One post per platform per launch. If it goes nowhere, that is information, not
a reason to repost the same thing louder.

---

## Hacker News

Show HN posts are text-light by convention. The title carries the weight.

**Title**

```
Show HN: A YC application checker that runs entirely in your browser
```

**URL**: `https://ivandubovyi.github.io/batchize/`

**First comment** (post this yourself, immediately after submitting):

```
I built this because every piece of feedback on a YC application judges one
answer at a time, and that is exactly how the worst mistakes survive. A partner
cross-references. They notice that one answer says 23 customers and another says
40, that you claim revenue in a section where you said you have no users, that a
launch date does not line up with how long you say you have been building. Each
answer is fine alone.

So it reads every answer against what that specific question is asking, then
reads all 26 against each other, and quotes the exact words that caused each
finding rather than giving advice you can nod at and not act on.

There is no model call. That is deliberate: it has to be free at the moment
somebody needs it, and it handles the honest version of your traction, so
uploading it was not an option. The engine is a rules system, which has an
obvious failure mode: cry wolf twice and nobody trusts the third finding. It is
measured on a labelled corpus for both recall and specificity, and false
positives are weighted the same as misses. Corpus and evals are in the repo.

The nastiest bugs came from running my own worked example through it. It flagged
"the first three hires" as a boastful superlative, read a video timestamp
("0:24 Brokers do this") as a count of 24 brokers, and decided "I drove to their
distribution yard at 5am and fixed the spreadsheet" contained no lived
experience because the verb was not on a list.

No account, no key, nothing uploaded, no analytics of any kind, which means I
genuinely have no idea if anyone uses it. Source: https://github.com/ivandubovyi/batchize

Happy to hear where it gets things wrong. Especially false positives.
```

**What HN will ask, and the honest answers**

- *"Why not just use an LLM?"* Cost at the moment of need, and privacy. Say
  that plainly. Do not claim the rules beat a model at judgement, because they
  do not; they beat a model at being free, offline, and consistent.
- *"Has anyone who used this got in?"* No, and you do not know, because it has
  no analytics and no account. Say exactly that. Do not gesture at anecdotes.
- *"This is just a linter for prose."* Agree. That is what it is, and the
  cross-answer contradiction check is the part that is not.

---

## Reddit

Read each subreddit's self-promotion rules before posting. Several ban tool
posts outright, and a removed post costs you the account's standing for later.

**r/ycombinator** (most relevant audience)

Title:
```
I built a free checker that reads your YC application answers against each other
```

Body:
```
Most feedback on an application looks at one answer at a time. The mistakes that
actually hurt are the ones that only exist between answers: a user count in one
place that disagrees with another, revenue in a section where you said you have
no users, a timeline that does not add up.

This checks every answer against what that question is really asking, then
cross-references all 26, and quotes the words that caused each finding.

Free, no account, no API key, and nothing you type leaves your browser, which
matters more than usual here because the honest version of your traction is
exactly the thing you do not want sitting on someone else's server.

https://ivandubovyi.github.io/batchize/

No users yet and no analytics, so I am asking directly: if it flags something
that was actually fine, tell me. False positives are the thing that makes a tool
like this useless.
```

**r/startups** works with the same body. Their rules are stricter about links,
so check the current ones first.

---

## X / Twitter

Thread. Do not post the link in the first tweet if you care about reach.

```
1/ Every piece of feedback on a YC application judges one answer at a time.

That is exactly how the worst mistakes survive.

2/ A partner cross-references. They notice one answer says 23 customers and
another says 40. That you claim revenue in a section where you said you have no
users. That your launch date does not match how long you say you have been
building.

Each answer is fine alone.

3/ So I built a checker that reads all 26 answers against each other, and quotes
the exact words that cost you rather than giving advice you can nod at and not
act on.

4/ No model call. It has to be free at the moment you need it, and it handles
the honest version of your traction, so uploading it was never an option.

Runs entirely in your browser. No account, no key, nothing leaves the tab.

5/ The obvious risk with rules is crying wolf. Flag correct writing twice and
nobody trusts the third finding.

So it is measured for both recall and specificity on a labelled corpus, and
false positives count the same as misses.

6/ The best bugs came from running my own worked example through it.

It called "the first three hires" a boastful superlative. It read the video
timestamp "0:24 Brokers do this" as 24 brokers.

7/ Free, no signup, no analytics, so I have no idea whether anyone uses it.

https://ivandubovyi.github.io/batchize/

Tell me where it is wrong. Especially the false positives.
```

---

## Product Hunt

Only worth it if you can be around all day to answer comments.

**Tagline** (60 characters):
```
Red-flag check for YC applications, free and offline
```

**Description**:
```
Batchize reads every answer in your YC application against what that question is
really asking, then reads all 26 against each other. It quotes the exact words
that caused each finding.

No account, no API key, no upload. The whole engine runs in your browser, which
is why it is free and why nothing you write reaches a server.

The analysis is measured against a labelled corpus for both what it catches and
what it wrongly flags, because a checker that cries wolf sends you off fixing
things that were already fine.
```

---

## The two instant tools

These are easier to share than the checker itself, because they need no
application and work in four seconds:

- `https://ivandubovyi.github.io/batchize/one-liner-tester/`
- `https://ivandubovyi.github.io/batchize/safe-calculator/`

Worth posting on their own where a full application checker would be off
topic. A reply in a thread where somebody is arguing about their one-liner
does more than a launch post, and it is not spam if the link answers the
question being asked.

## Email to people you know

Short, no pitch, ask for the one thing you need.

```
Subject: Built a thing for YC applications, would like it torn apart

I built a checker for YC applications. It reads each answer against what the
question is actually asking, then reads all of them against each other to find
contradictions, and quotes the specific words that caused each problem.

Free, no signup, runs in the browser: https://ivandubovyi.github.io/batchize/

The favour I actually want: if it flags something in your writing that was fine,
tell me what it was. False positives are what make a tool like this worthless,
and I cannot find them on my own.
```

---

## Things not to say

- Any number of users, applications checked, or founders helped. There are
  none, and inventing one is the fastest way to lose the only asset this
  project has.
- That it improves your odds of getting in. Nobody can know that, and the
  chancing screen already says so in the product.
- Any implication of Y Combinator endorsement. The footer disclaims it, and
  copy that muddies it would be worse than useless.
- "AI-powered". It is not, on purpose, and the reason is more interesting than
  the claim would be.

## After you post

`npm run traffic` shows GitHub repository views, not site visits. GitHub Pages
publishes no visitor analytics, so unless you have added a beacon (see
`DEPLOY.md`) you will learn nothing about traffic from a launch except what
people say to you.

Adding one before you post is worth more than the post itself, because a launch
you cannot measure teaches you nothing about whether to do the next one.
