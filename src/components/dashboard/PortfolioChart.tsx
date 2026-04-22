import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CircleAlert, LineChart, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { RangeSelector } from "@/components/shared/RangeSelector";
import { formatCurrencyPrivate, formatDateLabel } from "@/lib/formatters";
import type { PortfolioPoint, RangeSelection } from "@/types";

interface PortfolioChartProps {
  data: PortfolioPoint[];
  rangeSelection: RangeSelection;
  onRangeChange: (selection: RangeSelection) => void;
  isLoading: boolean;
  hasTransactions: boolean;
  hideValues: boolean;
}

type ChartMode = "value" | "performance";
type ChartPoint = PortfolioPoint & { plottedValue: number; performancePct: number };

function StarMarker({ cx, cy, outerRadius = 7, innerRadius = 3.2 }: { cx: number; cy: number; outerRadius?: number; innerRadius?: number }) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 5);
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    return `${x},${y}`;
  }).join(" ");

  return (
    <g>
      <polygon points={points} fill="#00FF9D" stroke="#0F1117" strokeWidth={1.5} />
    </g>
  );
}

function ChartTooltip({
  active,
  payload,
  hideValues,
  mode,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  hideValues: boolean;
  mode: ChartMode;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-card backdrop-blur-2xl">
      <div className="text-sm font-semibold text-white">{formatDateLabel(point.date)}</div>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">{mode === "value" ? "Valor activos" : "Rendimiento"}</span>
          <span className="font-semibold text-white">
            {mode === "value"
              ? formatCurrencyPrivate(point.value, hideValues)
              : `${point.performancePct >= 0 ? "+" : ""}${point.performancePct.toFixed(2)}%`}
          </span>
        </div>
        {point.hasBuy ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 font-semibold text-primary">
            Compra de: {point.boughtAssets.join(", ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PortfolioChart({
  data,
  rangeSelection,
  onRangeChange,
  isLoading,
  hasTransactions,
  hideValues,
}: PortfolioChartProps) {
  const [chartMode, setChartMode] = useState<ChartMode>("performance");
  const baseValue = data[0]?.value ?? 0;
  const chartData = useMemo<ChartPoint[]>(() => {
    if (!data.length) {
      return [];
    }

    return data.map((point) => {
      const performancePct = baseValue > 0 ? ((point.value - baseValue) / baseValue) * 100 : 0;
      return {
        ...point,
        performancePct,
        plottedValue: chartMode === "value" ? point.value : performancePct,
      };
    });
  }, [chartMode, data]);
  if (!hasTransactions) {
    return (
      <EmptyState
        icon={LineChart}
        title="Tu grafica aparecera aqui"
        description="Anade una compra para reconstruir automaticamente la curva historica del portafolio desde la primera transaccion."
      />
    );
  }

  return (
    <Card className="overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="label">Evolucion historica</div>
            <div className="mt-3 flex items-center gap-3 text-white">
              <h2 className="text-2xl font-bold tracking-tight">Valor de los activos</h2>
              <span className="surface-chip">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Compras marcadas
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              La curva muestra solo el valor de mercado de tus posiciones segun el historico de precios. Las compras se marcan con una estrella en la linea temporal.
            </p>
          </div>

          <div className="xl:max-w-[520px] xl:flex-1">
            <div className="mb-3 flex justify-end">
              <div className="flex gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setChartMode("value")}
                  className={
                    chartMode === "value"
                      ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-slate-950"
                      : "rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300"
                  }
                >
                  Dinero
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("performance")}
                  className={
                    chartMode === "performance"
                      ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-slate-950"
                      : "rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300"
                  }
                >
                  %
                </button>
              </div>
            </div>
            <RangeSelector value={rangeSelection} onChange={onRangeChange} />
          </div>
        </div>

        <div className="h-[420px] w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.03] text-slate-400">
              Reconstruyendo historico del portfolio...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] px-6 text-center text-sm text-slate-400">
              <div className="max-w-sm space-y-3">
                <CircleAlert className="mx-auto h-6 w-6 text-slate-500" />
                <p>El rango seleccionado no tiene datos. Ajusta el periodo o revisa las fechas de tus transacciones.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#76FFE0" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#76FFE0" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  minTickGap={32}
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  tickFormatter={(value) => formatDateLabel(value)}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={84}
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  tickFormatter={(value) =>
                    chartMode === "value"
                      ? formatCurrencyPrivate(value, hideValues, 0)
                      : `${value >= 0 ? "+" : ""}${Number(value).toFixed(1)}% · ${formatCurrencyPrivate(
                          baseValue * (1 + Number(value) / 100),
                          hideValues,
                          0,
                        )}`
                  }
                />
                <Tooltip
                  content={<ChartTooltip hideValues={hideValues} mode={chartMode} />}
                  cursor={{ stroke: "rgba(118,255,224,0.14)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="plottedValue"
                  stroke="#76FFE0"
                  strokeWidth={3}
                  fill="url(#portfolioFill)"
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#0F1117", fill: "#76FFE0" }}
                />
                <Scatter
                  data={chartData}
                  dataKey="plottedValue"
                  fill="#76FFE0"
                  shape={(shapeProps: unknown) => {
                    const { cx = 0, cy = 0, payload } = shapeProps as {
                      cx?: number;
                      cy?: number;
                      payload?: ChartPoint;
                    };

                    if (payload?.hasBuy) {
                      return <StarMarker cx={cx} cy={cy} />;
                    }

                    return <circle cx={cx} cy={cy} r={2.8} fill="#76FFE0" fillOpacity={0.85} />;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Card>
  );
}
