import {
  BarChart3,
  CreditCard,
  History,
  LayoutDashboard,
  Settings2,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AppView } from "@/types";

const items: { id: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "portfolio", label: "Portafolio", icon: Wallet },
  { id: "add", label: "Anadir", icon: CreditCard },
  { id: "history", label: "Historial", icon: History },
  { id: "settings", label: "Ajustes", icon: Settings2 },
];

interface SidebarProps {
  activeView: AppView;
  onSelect: (view: AppView) => void;
}

export function Sidebar({ activeView, onSelect }: SidebarProps) {
  return (
    <>
      <aside className="hidden w-[260px] shrink-0 lg:block">
        <div className="glass-card-strong sticky top-6 flex min-h-[calc(100vh-3rem)] flex-col gap-8 p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-3xl bg-primary p-3 text-slate-950 shadow-neon">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight text-white">PulseInversion</div>
                <div className="text-sm text-slate-400">Portfolio intelligence</div>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left",
                    active
                      ? "bg-white text-slate-950 shadow-neon"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-transparent p-5">
            <div className="label">Always on</div>
            <div className="mt-2 text-lg font-semibold text-white">Auto refresh cada 30 segundos</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Las cotizaciones en vivo se recalculan automaticamente y la grafica se vuelve a construir con el ultimo snapshot.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:hidden">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold tracking-tight text-white">PulseInversion</div>
            <div className="text-sm text-slate-400">Portfolio intelligence</div>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
            LIVE
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold",
                  active
                    ? "border-primary/20 bg-primary text-slate-950 shadow-neon"
                    : "border-white/10 bg-white/[0.04] text-slate-300",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
