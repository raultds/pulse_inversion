import { TrendingDown, TrendingUp } from "lucide-react";

import { formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  value: number;
  label?: string;
  compact?: boolean;
}

export function TrendBadge({ value, label, compact = false }: TrendBadgeProps) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-semibold",
        positive
          ? "border-gain/20 bg-gain/10 text-gain"
          : "border-loss/20 bg-loss/10 text-loss",
        compact ? "text-xs" : "text-sm",
      )}
    >
      <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span>{formatPercent(value)}</span>
      {label ? <span className="text-white/60">{label}</span> : null}
    </span>
  );
}
