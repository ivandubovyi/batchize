// The one thing this product cannot find on its own is a false positive.
//
// A checker that flags correct writing sends someone off rewriting a sentence
// that was already fine, and after the second time nobody trusts the third
// finding. There is no analytics and no server, so the only way a bad flag
// ever gets fixed is if the person who saw it says so.
//
// This opens a prefilled GitHub issue. Deliberately it carries the finding and
// the question, never the answer: what someone wrote about their own traction
// is not going into a public issue tracker because they clicked a link. The
// template asks them to paste the sentence themselves if they are willing,
// which makes it their decision rather than a side effect.

const REPO = "https://github.com/ivandubovyi/batchize";

export interface FeedbackContext {
  /** The finding's headline, e.g. 'Unsupported superlative: "the first"'. */
  title: string;
  /** The question it fired on, if it was not a cross-answer finding. */
  questionLabel?: string;
}

function body(ctx: FeedbackContext, kind: "wrong" | "missed"): string {
  const where = ctx.questionLabel
    ? `**Question:** ${ctx.questionLabel}`
    : `**Where:** across the whole application`;

  if (kind === "wrong") {
    return `**Finding:** ${ctx.title}

${where}

**Why it was wrong:**
<!-- What made this flag incorrect? -->

**The sentence it fired on** (optional, and only if you are happy for it to be
public. Feel free to change the details, the wording is what matters):
<!-- paste here, or delete this section -->
`;
  }

  return `**What it missed:**
<!-- What should have been flagged and was not? -->

${where}

**The sentence** (optional, and only if you are happy for it to be public.
Feel free to change the details, the wording is what matters):
<!-- paste here, or delete this section -->
`;
}

/** URL that opens a prefilled GitHub issue. Nothing is sent until they submit. */
export function reportUrl(ctx: FeedbackContext, kind: "wrong" | "missed" = "wrong"): string {
  const title =
    kind === "wrong"
      ? `False positive: ${ctx.title}`.slice(0, 120)
      : `Missed: `;
  const params = new URLSearchParams({
    title,
    body: body(ctx, kind),
    labels: kind === "wrong" ? "false-positive" : "missed-signal",
  });
  return `${REPO}/issues/new?${params.toString()}`;
}

export const REPO_URL = REPO;
