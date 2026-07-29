#!/bin/sh
# Build and publish to GitHub Pages.
#
# Two papercuts this exists to avoid:
#
# 1. `npx gh-pages` keeps a stale local cache and eventually fails every push
#    with non-fast-forward, and none of its documented cleanup commands fix it.
#    Plain git works.
# 2. Vite normally empties dist/ before a build, but skips it when dist/.git
#    exists, which it must for the deploy to work. Assets from every previous
#    build therefore pile up and get published forever. So this clears dist/
#    by hand, keeping only .git.
set -e
cd "$(dirname "$0")/.."

REPO="https://github.com/ivandubovyi/batchize.git"

echo "→ clearing dist (keeping .git)"
if [ -d dist ]; then
  find dist -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
fi

echo "→ building"
npm run build

echo "→ publishing to gh-pages"
cd dist
[ -d .git ] || {
  git init -q
  git branch -M gh-pages
  git remote add origin "$REPO"
}
git add -A
git -c user.email=wgtsfamily@gmail.com -c user.name=ivandubovyi \
  commit -q -m "Deploy $(git -C .. rev-parse --short HEAD)" || echo "  (nothing changed)"
git push -qf origin gh-pages
cd ..

MAIN=$(grep -oE 'index-[A-Za-z0-9_-]+\.js' dist/index.html | head -1)
echo "→ published $MAIN"
echo "→ waiting for the CDN"
until curl -s https://ivandubovyi.github.io/batchize/ | grep -q "$MAIN"; do sleep 5; done
echo "✓ live at https://ivandubovyi.github.io/batchize/"
