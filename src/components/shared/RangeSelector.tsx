import { cn } from "@/lib/utils";
import type { RangeSelection } from "@/types";

const presets = [
  { label: "1S", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1A", value: "1Y" },
  { label: "Todo", value: "ALL" },
  { label: "Custom", value: "CUSTOM" },
] as const;

interface RangeSelectorProps {
  value: RangeSelection;
  onChange: (next: RangeSelection) => void;
}

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const active = value.preset === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange({ ...value, preset: preset.value })}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300",
                active
                  ? "border-primary/30 bg-primary text-slate-950 shadow-neon"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {value.preset === "CUSTOM" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="label">Desde</span>
            <input
              type="date"
              value={value.from ?? ""}
              onChange={(event) => onChange({ ...value, from: event.target.value })}
            />
          </label>
          <label className="space-y-2">
            <span className="label">Hasta</span>
            <input
              type="date"
              value={value.to ?? ""}
              onChange={(event) => onChange({ ...value, to: event.target.value })}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
