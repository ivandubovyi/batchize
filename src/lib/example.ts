// A worked example application.
//
// This is a FICTIONAL company, included so a first-time visitor can see what a
// strong answer looks like instead of staring at 26 blank boxes. It is
// labelled as an example everywhere it appears and is never presented as a
// real company, a real customer, or a result anyone achieved. Loading it is
// always an explicit choice and never overwrites work already written.

import type { AppData } from "./application";

export const EXAMPLE_COMPANY = "Ledgerhaul (fictional)";

export const EXAMPLE_ANSWERS: Record<string, string> = {
  video_script:
    "0:00 We're Ada and Riley. We ran operations at two freight carriers. 0:12 Ledgerhaul is one API that generates, finances and reconciles freight invoices. 0:24 Brokers do this today across three tools and eleven days. We do it in one call. 0:40 23 brokers pay us $400 a month, growing 18% week over week. 0:52 We know this problem because we lived it every Friday for three years.",
  how_met:
    "We worked together for three years at a 40-truck carrier, Ada in operations and Riley building internal tools. We shipped two internal products together there before this one, including the dispatch tool that team still uses.",
  who_codes:
    "Both of us. Riley owns the backend and the reconciliation engine, Ada owns the broker-facing dashboard. No contractors and no agency have touched the product.",
  hacked_system:
    "To get our old carrier onto a large shipper's approved vendor list, I drove to their distribution yard at 5am and fixed the dock scheduling spreadsheet that had been broken for months. I stayed and trained two of their staff on it. They added us to the list that week, which normally takes a quarter.",
  company_name: "Ledgerhaul",
  one_liner: "Stripe for freight invoices",
  company_url: "https://example.com",
  product_description:
    "A freight broker connects their transport management system once. After that, every invoice is generated automatically, financed within 24 hours, and reconciled against the carrier settlement without anyone touching a spreadsheet. Brokers see the status of every invoice on a single dashboard instead of switching between their TMS, their factoring portal and email.",
  location:
    "We both live in Chicago and would move to the Bay Area for the batch.",
  how_far:
    "Launched 8 weeks ago. 23 brokers pay us $400 a month, which is $9.2k MRR growing 18% week over week. We process $1.4M of invoices a month with 92% of brokers still active after 30 days.",
  tech_stack:
    "TypeScript and Postgres, with Temporal for the reconciliation workflows. We are on AWS.",
  users:
    "23 paying brokers and 41 weekly active users inside those brokers, since larger brokers put two or three people on it.",
  revenue: "$9.2k MRR, growing 18% week over week for the last six weeks.",
  work_duration:
    "9 months since our first prototype, and both of us have been full-time for the last 5 months.",
  why_idea:
    "When I was running operations at a 40-truck carrier, I spent every Friday chasing invoices by phone. We assumed brokers were slow because they wanted to hold cash. After talking to 30 brokers we discovered the real reason: their factoring provider and their TMS have no shared record, so someone reconciles by hand. The insight that changed our product is that brokers will pay for reconciliation, not for faster money.",
  whats_new:
    "Today brokers use a factoring portal plus Excel plus email, and it takes about eleven days per cycle. Nothing connects the money to the load record. That became fixable in the last two years because the major TMS vendors finally shipped usable APIs, so we can read the load record directly instead of parsing PDFs.",
  competitors:
    "TriumphPay and Denim are the closest. Both optimise how fast a broker gets money. We learned brokers care more about not reconciling by hand than about getting paid two days sooner, so we sell the reconciliation and treat financing as a feature. Plenty of brokers also just use spreadsheets, and that is who we take business from most often.",
  money:
    "We charge $400 per broker per month, and we take 0.4% on invoices we finance. There are about 12,000 licensed freight brokers in the US, so the subscription alone is a $57M annual market at today's price, before financing revenue or expanding to carriers.",
  category: "Fintech",
  legal_entity: "Delaware C corporation, formed March 2026.",
  equity_split:
    "50/50 between the two founders, with a 10% option pool reserved for the first three hires. We split evenly because we both left jobs on the same day and both build.",
  investment:
    "$500k on a post-money SAFE at a $10M cap, from two angels who ran freight brokerages.",
  fundraising: "No, not currently raising.",
  other_ideas:
    "A dispatch scheduling tool for carriers, and a driver payments app. We picked invoicing because it was the problem we were asked about most by people who already trusted us.",
  other_accelerators:
    "No. This is the first accelerator we have applied to.",
  how_heard:
    "From a founder in freight who went through the batch two years ago.",
};

export function exampleAppData(): AppData {
  return {
    answers: { ...EXAMPLE_ANSWERS },
    interview: {},
    chancing: {
      launched: "yes",
      growth: "18",
      paying: "23",
      fulltime: "yes",
      technical: "yes",
      domain: "3",
      talked: "30",
    },
  };
}

export const EXAMPLE_QUICK: Record<string, string> = {
  one_liner: "Stripe for freight invoices",
  launched: "yes",
  users: "41",
  paying: "23",
  revenue: "9200",
  growth: "18",
  weeks: "8",
  fulltime: "yes",
  technical: "yes",
  why: "I ran operations at a 40-truck carrier and chased invoices every Friday.",
  competitor: "TriumphPay and Denim, or brokers reconciling in Excel.",
};
