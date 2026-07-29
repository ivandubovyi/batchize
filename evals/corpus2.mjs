// Tier 2: adversarial cases probing gaps the easy corpus doesn't reach.
export const HARD_CASES = [
  // Inflected / cased buzzwords
  { name: "hard/buzzword-inflected", qid: "product_description",
    text: "We are Revolutionizing how brokers work and our platform disrupts the legacy workflow completely for every team involved.",
    expect: ["Buzzwords"], forbid: [] },

  // Numbers written as words should still count as evidence
  { name: "hard/numbers-as-words", qid: "how_far",
    text: "We launched six weeks ago and twelve hundred brokers have signed up, with forty paying us every month.",
    expect: [], forbid: ["No numbers at all"] },

  // Vague time references instead of real dates
  { name: "hard/vague-timeframe", qid: "how_far",
    text: "We launched recently and have 200 users already, with more joining soon.",
    expect: ["Vague timing"], forbid: [] },

  // Answer that ignores the question entirely
  { name: "hard/off-topic-competitors", qid: "competitors",
    text: "Our team has deep experience in logistics and we have been working incredibly hard on this problem for months now.",
    expect: ["No alternative is actually named"], forbid: [] },

  // Passive voice hiding the actor
  { name: "hard/passive-agentless", qid: "who_codes",
    text: "The product was built and the backend was designed to be maintained going forward.",
    expect: ["Passive"], forbid: [] },

  // Acronym soup with no explanation
  { name: "hard/jargon-soup", qid: "product_description",
    text: "Our EDI to TMS bridge normalizes ANSI X12 204 and 214 payloads into the WMS via an OTM-compatible API layer for 3PLs.",
    expect: ["jargon"], forbid: [] },

  // Signups presented as if they were active users
  { name: "hard/signups-as-users", qid: "users",
    text: "We have 5,000 users who signed up for our launch waitlist.",
    expect: ["signups, not active users"], forbid: [] },

  // Padding: very long with low information density
  { name: "hard/padded", qid: "why_idea",
    text: "This is a really important problem that matters a lot to many people in the industry, and we care deeply about solving it because we think it is meaningful work that could help a lot of companies operate better and more effectively over time in many different ways.",
    expect: ["No lived experience"], forbid: [] },

  // Honest pre-launch should NOT be punished as "no numbers"
  { name: "hard/honest-prelaunch", qid: "revenue",
    text: "No revenue yet. We start charging next month.",
    expect: [], forbid: ["No numbers at all", "currency or period"] },

  // Percentage with no absolute base is misleading
  { name: "hard/percent-no-base", qid: "how_far",
    text: "We grew 300% last month and retention is up 50% week over week.",
    expect: ["percentage"], forbid: [] },

  // Solid concise answer must stay clean
  { name: "hard/clean-tech-stack", qid: "tech_stack",
    text: "TypeScript, Postgres, and Temporal for workflow orchestration.",
    expect: [], forbid: ["Buzzwords", "Only", "jargon"] },
];

export const HARD_CROSS = [
  // Contradictory revenue between answers
  { name: "hardcross/revenue-mismatch",
    answers: { how_far: "We are at $9,000 MRR today.", revenue: "$4,000 MRR currently." },
    expect: ["Contradictory revenue"], forbid: [] },

  // Contradictory launch timing
  { name: "hardcross/timeline-mismatch",
    answers: { how_far: "We launched 8 weeks ago.", work_duration: "We launched 6 months ago and have been full-time since." },
    expect: ["timeline"], forbid: [] },

  // Price and revenue in the same sentence is NOT a revenue contradiction
  { name: "hardcross/price-vs-revenue-ok",
    answers: { how_far: "23 brokers paying $400/mo, $9.2k MRR growing 18% w/w.", revenue: "$9.2k MRR, growing 18% week over week." },
    expect: [], forbid: ["Contradictory revenue"] },

  // Same number, different phrasing: not a contradiction
  { name: "hardcross/same-number-ok",
    answers: { how_far: "23 brokers pay us.", users: "We have 23 paying brokers." },
    expect: [], forbid: ["Contradictory"] },
];
