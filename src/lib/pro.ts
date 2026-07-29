// What Pro is, what it costs, and the one switch that turns selling on.
//
// Everything about the paid tier works today except taking the money, which
// needs a payment account only a human can open. Put a Stripe Payment Link or
// Gumroad URL in CHECKOUT_URL, rebuild, and the product is on sale. Until
// then the Pro surfaces stay hidden from visitors rather than showing a
// button that goes nowhere.

/** Paste the checkout URL here to start selling. See SELLING.md. */
export const CHECKOUT_URL = "";

/** One-time price, in whole dollars. Change here, it renders everywhere. */
export const PRICE_USD = 29;

export const PRO_LIVE = CHECKOUT_URL.length > 0;

/**
 * Lets the paid surfaces be opened locally for testing before checkout
 * exists: add ?pro=preview to the URL. This reveals the pages, it does not
 * unlock them. Unlocking still requires a validly signed key.
 */
export function proPreviewRequested(): boolean {
  return (
    new URLSearchParams(window.location.search).get("pro") === "preview" ||
    window.location.hash.includes("pro=preview")
  );
}

/** Should Pro exist in the interface at all right now? */
export function proVisible(): boolean {
  return PRO_LIVE || proPreviewRequested();
}

export interface ProFeature {
  id: "drafts" | "submit" | "grill";
  route: string;
  name: string;
  /** One line, concrete, no adjectives. */
  blurb: string;
  /** The moment it matters. Written for someone who has felt it. */
  why: string;
}

export const PRO_FEATURES: ProFeature[] = [
  {
    id: "drafts",
    route: "#/app/drafts",
    name: "Draft history",
    blurb:
      "Snapshot the application, see the score move, and diff any two versions word by word.",
    why:
      "You will rewrite the progress answer six times in the last week. Without snapshots you cannot tell whether draft four was better, so you keep a scratch document and lose track of which is current.",
  },
  {
    id: "submit",
    route: "#/app/submit",
    name: "Submission pack",
    blurb:
      "Every answer in form order with character counts, plus a checklist built from your actual answers. Print or copy as plain text.",
    why:
      "The last hour before a deadline is tabbing between a document and the form. This is the page for that hour.",
  },
  {
    id: "grill",
    route: "#/app/grill",
    name: "Partner grill",
    blurb:
      "Interview questions generated from your own weak spots, hardest first, each quoting the words that invited it.",
    why:
      "The follow-up you cannot answer in a ten-minute interview is nearly always the one your own application invited. A generic question bank cannot find it.",
  },
];

/** What stays free, stated plainly so the paid page cannot overclaim. */
export const FREE_INCLUDES = [
  "The full 26-question check, including cross-answer contradictions",
  "The quick score",
  "Rewrites, brainstorming and one-liner ideas on every question",
  "Interview prep across six topics",
  "Chancing, SAFE and equity tools",
  "The Partner coach",
  "Export and import of everything you write",
];
