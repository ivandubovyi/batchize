import { useState } from "react";
import { Card } from "@/components/app/shared";
import { FlagItem } from "@/components/app/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { quickFlags } from "@/lib/reviewer";
import { Plus, Trash2 } from "lucide-react";

const n = (v: string) => {
  const x = parseFloat(v);
  return Number.isFinite(x) && x >= 0 ? x : 0;
};

function SafeCalculator() {
  const [rows, setRows] = useState([{ amount: "", cap: "" }]);
  const sold = rows.reduce((s, r) => {
    const amount = n(r.amount);
    const cap = n(r.cap);
    return s + (cap > 0 ? amount / cap : 0);
  }, 0);
  const soldPct = Math.min(sold, 1) * 100;

  return (
    <Card>
      <h2 className="font-bold">SAFE dilution calculator</h2>
      <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">
        Post-money SAFE math: each SAFE sells amount divided by valuation cap.
        This is the standard formula, simplified (no discounts, no pro-rata).
      </p>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Amount raised ($)"
              value={r.amount}
              onChange={(e) =>
                setRows(rows.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))
              }
            />
            <Input
              type="number"
              placeholder="Post-money cap ($)"
              value={r.cap}
              onChange={(e) =>
                setRows(rows.map((x, j) => (j === i ? { ...x, cap: e.target.value } : x)))
              }
            />
            <button
              onClick={() => setRows(rows.filter((_, j) => j !== i))}
              disabled={rows.length === 1}
              className="shrink-0 text-muted-foreground hover:text-red-500 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => setRows([...rows, { amount: "", cap: "" }])}
        className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"
      >
        <Plus className="h-3.5 w-3.5" /> Add another SAFE
      </button>
      <div className="mt-4 rounded-xl border border-border bg-background p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Ownership sold via SAFEs</span>
          <b>{soldPct.toFixed(1)}%</b>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-muted-foreground">Founders + team keep</span>
          <b>{(100 - soldPct).toFixed(1)}%</b>
        </div>
        {sold > 0.25 && (
          <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            Over 25% sold before a priced round is a number investors will ask
            about.
          </p>
        )}
      </div>
    </Card>
  );
}

function RunwayCalculator() {
  const [cash, setCash] = useState("");
  const [burn, setBurn] = useState("");
  const months = n(burn) > 0 ? n(cash) / n(burn) : null;
  const outDate =
    months !== null
      ? new Date(Date.now() + months * 30.44 * 86400000).toLocaleDateString(
          undefined,
          { month: "long", year: "numeric" }
        )
      : null;

  return (
    <Card>
      <h2 className="font-bold">Runway calculator</h2>
      <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">
        Cash divided by monthly burn. Partners often ask this in interviews;
        know it cold.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-xs">Cash in bank ($)</Label>
          <Input type="number" value={cash} onChange={(e) => setCash(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Monthly burn ($)</Label>
          <Input type="number" value={burn} onChange={(e) => setBurn(e.target.value)} className="mt-1" />
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm">
        {months === null ? (
          <span className="text-muted-foreground">Enter cash and burn.</span>
        ) : (
          <>
            <b>{months.toFixed(1)} months</b>
            <span className="text-muted-foreground"> of runway, out around {outDate}.</span>
          </>
        )}
      </div>
    </Card>
  );
}

function EquitySplitChecker() {
  const [founders, setFounders] = useState([{ pct: "" }, { pct: "" }]);
  const total = founders.reduce((s, f) => s + n(f.pct), 0);
  const values = founders.map((f) => n(f.pct)).filter((x) => x > 0);
  const spread =
    values.length >= 2 ? Math.max(...values) - Math.min(...values) : 0;

  return (
    <Card>
      <h2 className="font-bold">Equity split sanity check</h2>
      <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">
        Enter each founder's percentage. Unequal splits aren't fatal, but
        partners probe them, so know your reasoning.
      </p>
      <div className="space-y-2">
        {founders.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={`Founder ${i + 1} (%)`}
              value={f.pct}
              onChange={(e) =>
                setFounders(founders.map((x, j) => (j === i ? { pct: e.target.value } : x)))
              }
            />
            <button
              onClick={() => setFounders(founders.filter((_, j) => j !== i))}
              disabled={founders.length <= 1}
              className="shrink-0 text-muted-foreground hover:text-red-500 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => setFounders([...founders, { pct: "" }])}
        className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"
      >
        <Plus className="h-3.5 w-3.5" /> Add founder
      </button>
      <div className="mt-4 space-y-1 rounded-xl border border-border bg-background p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total allocated</span>
          <b className={Math.abs(total - 100) > 0.01 && total > 0 ? "text-amber-600" : ""}>
            {total.toFixed(1)}%
          </b>
        </div>
        {total > 0 && Math.abs(total - 100) > 0.01 && (
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            Doesn't sum to 100%. Remember the option pool if that's deliberate.
          </p>
        )}
        {spread >= 30 && (
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            A {spread.toFixed(0)}-point spread between founders will get asked
            about in an interview. Have a plain one-sentence reason ready.
          </p>
        )}
      </div>
    </Card>
  );
}

function OneLinerTester() {
  const [text, setText] = useState("");
  const flags = text.trim() ? quickFlags(text, { charCap: 50 }) : [];
  return (
    <Card>
      <h2 className="font-bold">One-liner tester</h2>
      <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">
        Test "describe what your company does" against the 50-character cap and
        the buzzword checks.
      </p>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Stripe: Payment processing API for developers"
      />
      <p
        className={`mt-1 text-right text-xs font-semibold ${
          text.length === 0
            ? "text-muted-foreground"
            : text.length > 50
            ? "text-red-500"
            : "text-emerald-600"
        }`}
      >
        {text.length} / 50
      </p>
      {flags.length > 0 && (
        <div className="mt-2 space-y-2">
          {flags.map((f, i) => (
            <FlagItem key={i} flag={f} />
          ))}
        </div>
      )}
    </Card>
  );
}

export function Tools() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Founder tools</h1>
        <p className="mt-1 text-muted-foreground">
          Small calculators for the numbers your application and interview will
          get asked about. All math runs locally.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <SafeCalculator />
        <RunwayCalculator />
        <EquitySplitChecker />
        <OneLinerTester />
      </div>
    </div>
  );
}
