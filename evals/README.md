# Batchize evals

The labeled corpus the analysis engine was tuned against. Re-run all of these
after touching `src/lib/analyzer.ts` or `src/lib/rewrite.ts`.

```bash
# bundle the engine, then run every suite
cat > _e.ts <<'TS'
export { auditApplication, auditAnswer } from "./src/lib/analyzer";
export { QUESTIONS } from "./src/lib/application";
TS
./node_modules/.bin/esbuild ./_e.ts --bundle --format=esm --outfile=evals/analyzer.bundle.mjs && rm _e.ts

cat > _r.ts <<'TS'
export { rewriteAnswer, oneLinerIdeas, narrativeCheck, brainstormFor } from "./src/lib/rewrite";
TS
./node_modules/.bin/esbuild ./_r.ts --bundle --format=esm --outfile=evals/rewrite.bundle.mjs && rm _r.ts

node evals/train.mjs          # tier 1: 26 signals, expects 100% / 100%
node evals/train2.mjs         # tier 2 adversarial: expects 100% / 100%
node evals/eval-analyzer.mjs  # score ladder: empty=0, weak=12, strong=87
node evals/eval-rewrite.mjs   # rewrite, one-liner ideas, narrative
```

`expect` lists signals that MUST fire; `forbid` lists signals that must NOT
fire. False positives matter as much as misses here: a checker that cries wolf
sends founders off fixing things that are already correct.
