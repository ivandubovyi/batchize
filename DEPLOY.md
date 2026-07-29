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

## Hidden before launch

These are built and tested but hidden, because they need something most
visitors do not have:

| Feature | Why hidden | Where |
|---|---|---|
| Batchize Partner (coach chat) | Requires an Anthropic key or a real browser-native model | `src/pages/app/Partner.tsx`, removed from `Shell.tsx` tabs and the `App.tsx` route |
| Claude / on-device AI second opinion | Same | The card was removed from `src/pages/app/AppReview.tsx`; `aiReviewer.ts` and `localAiReviewer.ts` are untouched |

To bring them back, restore the nav entry and route, and re-add the AI card.
The cleanest long-term fix is a small backend holding **your** key, so visitors
get AI without needing one of their own.

Also removed for launch: the newsletter form (never wired to a list), the
placeholder social buttons, dead Privacy/Terms links, and the
`support@batchize.ai` address, which does not exist.

## Known gap

There is no export/import. A visitor's application lives only in that
browser's local storage, so clearing browser data loses it and it does not
sync between devices.
