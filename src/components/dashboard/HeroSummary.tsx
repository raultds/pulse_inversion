import { useEffect, useState } from "react";
import { Coins, Info, RefreshCcw } from "lucide-react";

import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { Card } from "@/components/shared/Card";
import { TrendBadge } from "@/components/shared/TrendBadge";
import { formatCurrencyPrivate, formatRelativeTime } from "@/lib/formatters";
import type { PortfolioSnapshot } from "@/types";

interface HeroSummaryProps {
  snapshot: PortfolioSnapshot;
  lastUpdated: number | null;
  hideValues: boolean;
}

const TRANSFERS_ADJUSTMENT_STORAGE_KEY = "pulseinversion-transfers-adjustment";

export function HeroSummary({ snapshot, lastUpdated, hideValues }: HeroSummaryProps) {
  const [transfersAdjustmentInput, setTransfersAdjustmentInput] = useState(() => {
    if (typeof window === "undefined") {
      return "959.8";
    }

    return localStorage.getItem(TRANSFERS_ADJUSTMENT_STORAGE_KEY) ?? "959.8";
  });
  const [showTransfersInfo, setShowTransfersInfo] = useState(false);
  const transfersAdjustment = Number.parseFloat(transfersAdjustmentInput) || 0;
  const totalReturnIncludingTransfers = snapshot.totalReturnValue + transfersAdjustment;

  useEffect(() => {
    localStorage.setItem(TRANSFERS_ADJUSTMENT_STORAGE_KEY, transfersAdjustmentInput);
  }, [transfersAdjustmentInput]);

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
      <Card className="glass-card-strong relative overflow-hidden p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="label">Valor total (activos)</div>
              <div className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
                <AnimatedNumber value={snapshot.totalValue} formatter={(value) => formatCurrencyPrivate(value, hideValues)} />
              </div>
            </div>

            <div className="space-y-3 text-right">
              <div>
                <div className="mb-1.5 text-xs uppercase tracking-[0.16em] text-slate-500">Hoy</div>
                <TrendBadge value={snapshot.dailyChangePct} label="hoy" />
              </div>
              <div className="flex items-center justify-end gap-2 text-sm text-slate-400">
                <RefreshCcw className="h-4 w-4 text-primary" />
                Actualizado {formatRelativeTime(lastUpdated)}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Rentabilidad total</div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    {formatCurrencyPrivate(snapshot.totalReturnValue, hideValues)}
                  </div>
                </div>
              </div>
              <TrendBadge value={snapshot.totalReturnPct} label="total" />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    Rentabilidad incluyendo los traspasos realizados
                    <button
                      type="button"
                      onClick={() => setShowTransfersInfo((current) => !current)}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                      aria-label="Mostrar información sobre el ajuste de traspasos"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  {showTransfersInfo ? (
                    <p className="mt-2 max-w-xl text-xs text-slate-500">
                      Puedes añadir aquí un importe que incluya el beneficio de traspasos anteriores
                      realizados y que no se contemple en los movimientos actuales.
                    </p>
                  ) : null}
                  <div className="mt-1 text-2xl font-bold text-white">
                    {formatCurrencyPrivate(totalReturnIncludingTransfers, hideValues)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <label htmlFor="transfers-adjustment">Ajuste manual por traspasos</label>
                    <input
                      id="transfers-adjustment"
                      type="number"
                      step="0.01"
                      value={transfersAdjustmentInput}
                      onChange={(event) => setTransfersAdjustmentInput(event.target.value)}
                      className="w-32 rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-primary"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <TrendBadge value={snapshot.totalReturnPct} label="total" />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="label">Resumen</div>
        <div className="mt-4 space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm text-slate-400">Cambio hoy (activos)</div>
            <div className="mt-2 text-2xl font-bold text-white">
              {formatCurrencyPrivate(snapshot.dailyChangeValue, hideValues)}
            </div>
            <div className="mt-2">
              <TrendBadge value={snapshot.dailyChangePct} compact />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm text-slate-400">Coste total de compra</div>
            <div className="mt-2 text-2xl font-bold text-white">
              {formatCurrencyPrivate(snapshot.investedAmount, hideValues)}
            </div>
            <div className="mt-2 text-sm text-slate-500">Base para calcular la rentabilidad total de la cartera.</div>
          </div>
        </div>
      </Card>
    </section>
  );
}
