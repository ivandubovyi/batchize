// Tier 3: precision under pressure.
//
// Tiers 1 and 2 mostly ask "does the check fire on writing that deserves it".
// This tier asks the harder question: does it stay quiet on writing that looks
// superficially like a violation and is actually correct? A checker that cries
// wolf sends a founder off rewriting a sentence that was already fine, and the
// third finding is the one they stop believing.
//
// So most of these are `forbid` cases. The `expect` cases here are the ones a
// naive keyword matcher would sail past.

export const PRECISION_CASES = [
  // --- Buzzword lookalikes that are literal, correct usage --------------
  {
    name: "precision/disrupt-literal",
    qid: "why_idea",
    text: "When I ran dispatch at a 40-truck carrier, a single bad ELD update would disrupt the whole day's routing. I rebuilt the schedule by hand 14 times in one quarter, which is when I understood the real cost was reconciliation, not the outage.",
    expect: [],
    forbid: ["Buzzwords"],
  },
  {
    name: "precision/innovation-as-a-noun-about-others",
    qid: "competitors",
    text: "McLeod and Aljex own the incumbent share. Their innovation budget goes to compliance features because that is what enterprise buyers renew on, which is exactly why the reconciliation gap has sat open for 11 years.",
    expect: [],
    forbid: ["Buzzwords"],
  },

  // --- Superlatives that are ordinary counting, not boasts ---------------
  {
    name: "precision/first-as-ordinal",
    qid: "how_far",
    text: "Our first three customers signed in March. The first of them now runs 400 invoices a week through us, and we have 23 paying brokers in total.",
    expect: [],
    forbid: ["superlative"],
  },
  {
    name: "precision/only-as-quantity",
    qid: "revenue",
    text: "$9,200 MRR. It took only 4 months to get there from our first paid invoice.",
    expect: [],
    forbid: ["superlative"],
  },
  {
    name: "precision/best-in-a-quote-about-users",
    qid: "how_far",
    text: "One dispatcher told us it was the best part of her week, which we did not believe until she renewed. 23 paying brokers, $9,200 MRR, up from $6,100 in April.",
    expect: [],
    forbid: [],
  },

  // --- Hedges that are honest calibration, not evasion -------------------
  {
    name: "precision/honest-uncertainty-with-numbers",
    qid: "money",
    text: "We charge $400 per month per broker. At 23 brokers that is $9,200 MRR. We do not know yet whether mid-size brokers will pay double for the multi-carrier version, so we are testing it with 4 of them in August.",
    expect: [],
    forbid: ["Hedg"],
  },

  // --- Weasel lookalikes -------------------------------------------------
  {
    name: "precision/various-as-a-real-list",
    qid: "competitors",
    text: "We lose deals to three things: McLeod, Aljex, and a spreadsheet. The spreadsheet wins most often.",
    expect: [],
    forbid: ["Weasel", "Vague"],
  },

  // --- Percentages that DO have a base -----------------------------------
  {
    name: "precision/percent-with-base",
    qid: "how_far",
    text: "Revenue grew 51% last month, from $6,100 to $9,200. 23 of the 31 brokers who trialled us converted.",
    expect: [],
    forbid: ["percent", "no base", "denominator"],
  },

  // --- Signup words used correctly, alongside real usage ------------------
  {
    name: "precision/waitlist-plus-real-usage",
    qid: "users",
    text: "23 paying brokers, 19 of whom logged in every week last month. There are another 140 on the waitlist that we have not onboarded yet, and we count those separately on purpose.",
    expect: [],
    forbid: ["signups, not active"],
  },

  // --- Passive voice that is correct because the actor is irrelevant ------
  {
    name: "precision/passive-about-the-industry",
    qid: "why_idea",
    text: "Freight invoices are reconciled by hand at almost every broker we visited. I spent two years doing it myself at a carrier, and we have now watched 30 brokers do the same thing on video calls.",
    expect: [],
    forbid: ["Passive"],
  },

  // --- Explicit zeros are honest answers, not missing numbers ------------
  {
    name: "precision/honest-zero-revenue",
    qid: "revenue",
    text: "None. We have not charged anyone yet and will not until the multi-carrier version ships in September.",
    expect: [],
    forbid: ["No numbers", "no number"],
  },
  {
    name: "precision/honest-zero-investment",
    qid: "investment",
    text: "No outside money. We have put in $14,000 of our own.",
    expect: [],
    forbid: ["No numbers", "no number"],
  },

  // --- Short answers to questions that genuinely want short answers ------
  {
    name: "precision/short-factual-fundraising",
    qid: "fundraising",
    text: "No.",
    expect: [],
    forbid: ["Only", "thin", "short"],
  },
  {
    name: "precision/category-is-two-words",
    qid: "category",
    text: "Freight logistics",
    expect: [],
    forbid: ["Only", "thin", "short"],
  },

  // --- Things that SHOULD fire and a keyword matcher would miss ----------
  {
    name: "hard3/growth-percent-no-base",
    qid: "how_far",
    text: "We have grown 340% since launch and our week over week numbers keep climbing, with retention holding steady across the board.",
    expect: ["percent"],
    forbid: [],
  },
  {
    name: "hard3/superlative-primacy-claim",
    qid: "whats_new",
    text: "We are the first platform to connect factoring and dispatch in one place, and nobody else has attempted this.",
    expect: ["superlative"],
    forbid: [],
  },
  {
    name: "hard3/mission-dressed-as-product",
    qid: "product_description",
    text: "We believe in a world where every small carrier gets paid on time, and our purpose is to make that real for the whole industry.",
    expect: ["Mission"],
    forbid: [],
  },
  {
    name: "hard3/no-lived-experience-market-description",
    qid: "why_idea",
    text: "The freight brokerage market is worth $200 billion and is highly fragmented, with over 17,000 licensed brokers in the US alone. Payment terms average 45 days.",
    expect: ["lived experience"],
    forbid: [],
  },
  {
    name: "hard3/competitors-deflected",
    qid: "competitors",
    text: "Nobody else does this the way we do it, and the incumbents are too slow to catch up with a team of our calibre.",
    expect: ["alternative"],
    forbid: [],
  },
];

export const PRECISION_CROSS = [
  // Research counts vs customer counts are not a contradiction.
  {
    name: "precision-cross/research-vs-customers",
    answers: {
      why_idea:
        "After interviewing 30 brokers we found the real reason: their factoring provider and their TMS have no shared record.",
      users: "23 paying brokers, 19 active weekly.",
      how_far: "23 paying brokers as of this week, up from 12 in April.",
    },
    expect: [],
    forbid: ["Contradictory"],
  },
  // Market sizing is not a customer count either.
  {
    name: "precision-cross/market-size-vs-customers",
    answers: {
      why_idea: "There are 17,000 licensed brokers in the US.",
      users: "23 paying brokers.",
    },
    expect: [],
    forbid: ["Contradictory"],
  },
  // A number that grew over a stated period is not a contradiction.
  {
    name: "precision-cross/growth-over-time",
    answers: {
      how_far: "We went from 12 paying brokers in April to 23 in July.",
      users: "23 paying brokers.",
    },
    expect: [],
    forbid: ["Contradictory"],
  },
  // Real contradiction: two current counts of the same thing that disagree.
  {
    name: "hard3-cross/genuine-count-conflict",
    answers: {
      users: "We have 23 paying brokers.",
      how_far: "We have 40 paying brokers using it today.",
    },
    expect: ["Contradictory"],
    forbid: [],
  },
  // Real contradiction: revenue claimed with no users.
  {
    name: "hard3-cross/revenue-without-users",
    answers: {
      users: "We have no users yet.",
      revenue: "$4,000 MRR.",
    },
    expect: ["revenue"],
    forbid: [],
  },
];
