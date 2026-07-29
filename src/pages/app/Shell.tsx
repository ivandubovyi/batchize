import type { ReactNode } from "react";
import {
  ClipboardList,
  Gauge,
  LayoutDashboard,
  MessageCircle,
  Mic,
  SearchCheck,
  Wrench,
  Zap,
} from "lucide-react";

const TABS = [
  { hash: "#/app", label: "Dashboard", icon: LayoutDashboard },
  { hash: "#/app/quick", label: "Quick score", icon: Zap },
  { hash: "#/app/application", label: "Application", icon: ClipboardList },
  { hash: "#/app/review", label: "Review", icon: SearchCheck },
  { hash: "#/app/interview", label: "Interview", icon: Mic },
  { hash: "#/app/chancing", label: "Chancing", icon: Gauge },
  { hash: "#/app/tools", label: "Tools", icon: Wrench },
  { hash: "#/app/partner", label: "Partner", icon: MessageCircle },
];

export function AppShell({
  route,
  children,
}: {
  route: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-24 md:px-6">
      <nav className="mb-8 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 shadow-sm">
        {TABS.map((t) => {
          const active = route === t.hash;
          return (
            <a
              key={t.hash}
              href={t.hash}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </a>
          );
        })}
      </nav>
      {children}
    </main>
  );
}
