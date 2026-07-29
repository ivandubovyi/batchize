# Deploying

Live at **https://ivandubovyi.github.io/batchize/**
(repo `ivandubovyi/batchize`, GitHub Pages serving the `gh-pages` branch)

## Redeploy after changes

```bash
npm run build   # tsc, vite, then the 30 static content pages

# push the built site to the gh-pages branch
cd dist
git init -q                # skip if dist/.git already exists
git add -A
git commit -m "Deploy"
git branch -M gh-pages
git remote add origin https://github.com/ivandubovyi/batchize.git
git push -f origin gh-pages
cd ..

# and the source to main
git add -A && git commit -m "..." && git push origin main
```

`npm run build` writes `.nojekyll` itself, so Pages does not run Jekyll over
the output.

**Do not use `npx gh-pages`.** It keeps a stale local cache and eventually
fails every push with `non-fast-forward`, and none of the documented cleanup
commands fix it. The git commands above are what actually works. `dist/.git/`
is gitignored, so this leaves the source repo clean.

Give the Pages CDN about a minute: a `curl` immediately after pushing will
still return the previous build. Verify by checking the hashed asset name in
the live HTML against the one in `dist/`.

`vite.config.ts` sets `base: "/batchize/"` because Pages serves this from a
subpath. If you move it to a custom domain or a root deploy (Netlify, Vercel,
Cloudflare Pages), change `base` back to `"/"` or the assets will 404.

Routing is hash-based (`#/app/...`), so no server rewrite rules are needed.

## Every feature works, for free

Nothing on the site requires a key, an account, a server or a payment. The
Partner coach (`src/lib/coach.ts`) answers from the same analysis engine the
Full check uses, reading the application saved in the visitor's browser, so it
works for 100% of visitors instantly and costs nothing to run.

`aiReviewer.ts` (Claude) and `localAiReviewer.ts` (browser-native model) are
kept in the repo but are not wired into any screen, because both depend on
something the visitor may not have. If you ever want them back, the honest way
is a small backend holding **your** key with rate limiting.

Removed for launch: the newsletter form (never wired to a list), the
placeholder social buttons, dead Privacy/Terms links, and the
`support@batchize.ai` address, which does not exist.

## Known gap

There is no export/import. A visitor's application lives only in that
browser's local storage, so clearing browser data loses it and it does not
sync between devices.

## Analytics

GitHub Pages publishes no visitor statistics. None. `npm run traffic` reads
the GitHub API, but that counts views of the **repository page**, not the site,
so a zero there says nothing about whether founders are using the checker.

Right now nobody knows whether anyone visits. That is the single biggest gap in
this project, because every decision about what to build next is a guess until
it closes.

Closing it takes an account, which is why it is not already done. When you open
one, `index.html` has a marked slot for the tag:

**Cloudflare Web Analytics** (free, no cookies, no consent banner needed)
1. dash.cloudflare.com, Web Analytics, add a site.
2. Copy the beacon script tag.
3. Paste it into `index.html` where the analytics comment is.

**GoatCounter** (free for non-commercial, open source) works the same way.

Whichever you pick, keep it cookieless. The whole product is built on nothing
leaving the visitor's browser, and a tracker that sets an identifier would make
the front page's claim untrue.
