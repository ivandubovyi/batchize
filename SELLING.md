# Turning Batchize Pro on

Everything about the paid tier works today except taking the money. That needs
a payment account, which only you can open. This is the whole list.

## 1. Take a payment method

Either works. Stripe keeps more of the money; Gumroad is faster to set up and
handles EU VAT for you.

**Stripe Payment Link** (recommended)
1. stripe.com, create the account, finish the identity check.
2. Product catalogue, add a product: "Batchize Pro", one-time, $29.
3. Payment links, create a link for it.
4. Turn on "Collect customer email" so you can issue the key.
5. Copy the link, it looks like `https://buy.stripe.com/xxxx`.

**Gumroad**
1. gumroad.com, new product, one-time $29, digital, no file.
2. Copy the product URL.

## 2. Point Batchize at it

In `src/lib/pro.ts`:

```ts
export const CHECKOUT_URL = "https://buy.stripe.com/xxxx";
```

That single line turns on the Pricing page, the Pricing nav link, the three Pro
tabs, and every buy button. Then:

```bash
npm run build && npx gh-pages -d dist -t
```

## 3. Issue a key when someone buys

You get the buyer's email from the Stripe or Gumroad receipt.

```bash
node tools/license.mjs issue buyer@example.com ORDER-REF
```

That prints one line starting `BATCHIZE-PRO-`. Email it to them. They paste it
at `/#/pricing` and Pro unlocks in their browser, permanently and offline.

To check a key someone sends you:

```bash
node tools/license.mjs verify BATCHIZE-PRO-...
```

### Automating it later

Manual issuing is fine for the first fifty sales and it keeps you talking to
buyers, which is worth more than the time it saves. When it stops being fine,
a Stripe webhook running `tools/license.mjs issue` and emailing the result is
about forty lines of server code.

## The signing key

`node tools/license.mjs keygen` has already been run. The private key is at
`~/.batchize-license-key.json`, mode 600, outside this repository so it can
never be committed.

- **Back it up somewhere safe.** Lose it and you cannot issue keys to anyone,
  including people who have already paid.
- **Never commit or paste it.** Anyone holding it can mint unlimited keys.
- Regenerating it invalidates every key you have issued, so if you ever have
  to, you must reissue to every existing customer.

The matching public key is compiled into `src/lib/license.ts`. That is the part
that is meant to be public.

## What you are actually selling

Free stays genuinely free: the whole 26-question check, cross-answer
contradictions, the quick score, rewrites, interview prep, tools, the coach,
export and import. Pro is draft history, the submission pack, and the partner
grill. The analysis is identical in both tiers.

This split is deliberate. The check is the thing that earns trust and the thing
people tell each other about, so putting it behind a paywall would cost more
than it collects. Pro is the set of things you only want once you are already
committed, in the last week before a deadline.

## What a key cannot do

A key can be shared, because there is no server to phone home to. That is the
same property that means nothing anyone writes is ever uploaded. The pricing
page says this outright rather than pretending otherwise.

If sharing ever becomes a real revenue problem, the fix is a keyserver, and the
cost of that fix is the privacy promise. Do not make that trade quietly.

## What is not built

- No refunds flow. Handle them in Stripe and just stop caring about the key.
- No licence expiry. Keys are permanent by design.
- No revocation. See above about there being no server.
