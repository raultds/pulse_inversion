import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-card flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-[32px] border-dashed px-8 py-12 text-center">
      <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-primary shadow-neon">
        <Icon className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="max-w-md text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  );
}
