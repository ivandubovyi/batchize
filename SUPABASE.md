# Accounts and sync

Batchize is local-first and stays that way. An account does exactly one thing:
keeps a copy of your application so you can carry on writing it on another
machine. Nothing is uploaded until somebody presses Upload themselves.

**Project**: `bqgknxlnoptnpjxucsfx` (org SeptAlert, us-east-1, free plan)
**URL**: `https://bqgknxlnoptnpjxucsfx.supabase.co`

## What is stored

One row per user in `public.applications`, holding the same JSON document the
Export button produces: answers, deadline, interview progress, chancing, quick
score, and Pro draft history. Nothing else. No analytics, no usage tracking,
no third parties.

## Security

Row level security is on, with four owner-only policies keyed to `auth.uid()`.
There is deliberately no policy granting anyone read access to anyone else.

Verified against the live project with two real accounts:

| Attempt | Result |
|---|---|
| Anonymous read of the table | `[]` |
| Second user lists the table | `[]` |
| Second user selects the first user's row by `user_id` | `[]` |
| Second user PATCHes the first user's row | no rows affected |
| First user's row afterwards | unchanged, version 1 |

`version` and `updated_at` are set by a database trigger rather than the
client, so a client cannot claim to be newer than it is. A size constraint
caps a document at 2 MB.

## Conflicts

Never merged automatically. Stitching together two versions of an answer
somebody rewrote six times produces a sentence neither version said. When both
sides have changed the UI says so and offers both, and says plainly that
nothing has been overwritten yet.

A browser with zero answers in it is not treated as a conflict, because there
is nothing there to lose.

## The two rough edges, and why

**Email is not verified.** `enable_confirmations = false` in
`supabase/config.toml`. The built-in mail sender is rate limited to a couple of
messages an hour, so the third person to sign up in an hour would never get
their link and would reasonably assume the product was broken. The sign-up
screen states this outright rather than hiding it.

**Password reset barely works**, for the same reason.

Both are fixed by the same twenty-minute job: add SMTP.

1. Get an SMTP sender: Resend, Postmark and SES all have a usable free tier.
2. Verify the sending domain with them.
3. Supabase dashboard → Project Settings → Authentication → SMTP Settings.
4. Set `enable_confirmations = true` in `supabase/config.toml`.
5. `supabase config push`.
6. Update the caveat text in `src/pages/app/Account.tsx`, which will no longer
   be true. It is written to be deleted.

## Operating it

```bash
supabase link --project-ref bqgknxlnoptnpjxucsfx   # once per machine
supabase db push        # apply migrations in supabase/migrations/
supabase config push    # apply auth settings from config.toml
```

`[auth.sessions]` timebox and inactivity timeout are Pro-plan only; the API
returns 402 on the free plan, so session lifetime is left at the default.

## Keys

The anon key is compiled into the bundle and is meant to be public: it
identifies the project and grants access to no rows on its own, because every
row is behind RLS.

**The service_role key must never appear in this repository or in the built
site.** It bypasses RLS entirely. Nothing in the client needs it.

The database password is at `~/.batchize-supabase.json`, mode 600, outside the
repo. Back it up.

## Free plan limits

Two free projects per organization, 500 MB of database, and projects pause
after a week of no requests. A paused project means sync stops working while
the rest of Batchize carries on exactly as before, which is the whole point of
being local-first.
