# Batchize

A YC application workspace that runs entirely in your browser. No account, no
API key, no server: your application is saved to local storage on your own
device and nothing you type is uploaded.

- **Quick score** — eleven short questions, a score in about a minute
- **Application** — all 26 real YC application questions, with what each one is
  actually asking, plus live checks as you type
- **Full check** — every answer graded against that question's intent, with the
  exact words that cause each problem quoted back, contradictions found across
  answers, and a prioritised fix list
- **Tighten & brainstorm** — cuts filler and hedging using only your own words;
  outlines and prompts when you're stuck
- **Interview** — rapid-fire drills by topic with self-rated mastery
- **Chancing** — a transparent readiness score and a balanced accelerator list
- **Tools** — SAFE dilution, runway, equity split, one-liner tester

Not affiliated with or endorsed by Y Combinator.

## Develop

```bash
npm install
npm run dev      # http://localhost:4690
npm run build
```

## Evals

The analysis engine is tuned against a labelled corpus. See `evals/README.md`.
