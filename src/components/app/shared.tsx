import type { Flag } from "@/lib/reviewer";

export const FLAG_STYLES: Record<string, string> = {
  red: "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
  amber: "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
  green: "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
};
export const FLAG_ICONS: Record<string, string> = {
  red: "🚩",
  amber: "⚠️",
  green: "✅",
};

export function FlagItem({ flag }: { flag: Flag }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm leading-relaxed ${FLAG_STYLES[flag.sev]}`}
    >
      <span className="shrink-0">{FLAG_ICONS[flag.sev]}</span>
      <p className="text-muted-foreground">
        <b className="text-foreground">{flag.title}</b> {flag.body}
      </p>
    </div>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm font-semibold">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="w-9 text-right text-sm font-bold">{value.toFixed(1)}</span>
    </div>
  );
}

export function donutColorFor(total: number): string {
  return total >= 70 ? "#12B76A" : total >= 45 ? "#F79009" : "#D92D20";
}

export function Donut({
  total,
  label = "Strength",
  size = 112,
}: {
  total: number;
  label?: string;
  size?: number;
}) {
  const color = donutColorFor(total);
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0 ${total}%, var(--muted) ${total}% 100%)`,
      }}
    >
      <div className="absolute inset-[10px] rounded-full bg-card" />
      <div className="relative text-center">
        <div className="text-2xl font-extrabold" style={{ color }}>
          {total}
        </div>
        <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
