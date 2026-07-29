# Deploying

Live at **https://ivandubovyi.github.io/batchize/**
(repo `ivandubovyi/batchize`, GitHub Pages serving the `gh-pages` branch)

## Redeploy after changes

```bash
npm run build

# push the built site to the gh-pages branch
cd dist
touch .nojekyll
git init -q
git add -A
git commit -m "Deploy"
git branch -M gh-pages
git remote add origin https://github.com/ivandubovyi/batchize.git
git push -f origin gh-pages
cd ..

# and the source to main
git add -A && git commit -m "..." && git push origin main
```

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
