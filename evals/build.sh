#!/bin/sh
# Rebuild every eval bundle from src, then run every suite.
# Run from the repo root: sh evals/build.sh
set -e
cd "$(dirname "$0")/.."

bundle() {
  name=$1; exports=$2
  printf '%s\n' "$exports" > "_e_$name.ts"
  ./node_modules/.bin/esbuild "./_e_$name.ts" --bundle --format=esm \
    --outfile="evals/$name.bundle.mjs" --log-level=warning
  rm "_e_$name.ts"
}

bundle analyzer 'export { auditApplication, auditAnswer } from "./src/lib/analyzer";
export { QUESTIONS } from "./src/lib/application";'

bundle rewrite 'export { rewriteAnswer, oneLinerIdeas, narrativeCheck, brainstormFor } from "./src/lib/rewrite";'

bundle quick 'export { scoreQuick, quickToFullAnswers, QUICK_FIELDS } from "./src/lib/quickScore";'

bundle coach 'export { coachReply, STARTER_CHIPS } from "./src/lib/coach";'

bundle example 'export { auditApplication } from "./src/lib/analyzer";
export { exampleAppData, EXAMPLE_QUICK, EXAMPLE_ANSWERS, EXAMPLE_COMPANY } from "./src/lib/example";
export { scoreQuick } from "./src/lib/quickScore";
export { coachReply } from "./src/lib/coach";
export { narrativeCheck } from "./src/lib/rewrite";'

echo "--- bundles rebuilt ---"

fail=0
for suite in train train2 eval-analyzer eval-rewrite eval-quick eval-coach eval-example; do
  echo ""
  echo "=== $suite ==="
  node "evals/$suite.mjs" || fail=1
done
exit $fail
