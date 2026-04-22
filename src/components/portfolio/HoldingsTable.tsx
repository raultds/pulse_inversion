import { useMemo, useState } from "react";
import { ArrowDownUp, BadgeEuro, Bitcoin, CandlestickChart, Gem, Landmark, Trash2 } from "lucide-react";

import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrencyPrivate, formatDateTimeLabel, formatNumber, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Holding, SortKey } from "@/types";

const assetIcons = {
  stock: CandlestickChart,
  etf: Landmark,
  fund: Gem,
  crypto: Bitcoin,
};

type HoldingsFilterTab = "ALL" | "INDEX_FUNDS" | "FUNDS" | "ETF" | "STOCKS" | "CRYPTO";

interface HoldingsTableProps {
  holdings: Holding[];
  onDeleteAsset?: (symbol: string) => void;
  hideValues: boolean;
}

export function HoldingsTable({ holdings, onDeleteAsset, hideValues }: HoldingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("currentValue");
  const [descending, setDescending] = useState(true);
  const [filterTab, setFilterTab] = useState<HoldingsFilterTab>("ALL");

  const isIndexFund = (holding: Holding) => {
    if (holding.assetType !== "fund") {
      return false;
    }

    const haystack = `${holding.ticker} ${holding.name}`.toLowerCase();
    return haystack.includes("index") || haystack.includes("indice") || haystack.includes("índice");
  };

  const filteredHoldings = useMemo(() => {
    switch (filterTab) {
      case "ALL":
        return holdings;
      case "ETF":
        return holdings.filter((holding) => holding.assetType === "etf");
      case "STOCKS":
        return holdings.filter((holding) => holding.assetType === "stock");
      case "CRYPTO":
        return holdings.filter((holding) => holding.assetType === "crypto");
      case "INDEX_FUNDS":
        return holdings.filter((holding) => isIndexFund(holding));
      case "FUNDS":
        return holdings.filter((holding) => holding.assetType === "fund" && !isIndexFund(holding));
    }
  }, [filterTab, holdings]);

  const sortedHoldings = useMemo(() => {
    return [...filteredHoldings].sort((left, right) => {
      const multiplier = descending ? 1 : -1;
      return (right[sortKey] - left[sortKey]) * multiplier;
    });
  }, [descending, filteredHoldings, sortKey]);

  const toggleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setDescending((previous) => !previous);
      return;
    }

    setSortKey(nextKey);
    setDescending(true);
  };

  const handleDeleteAsset = (symbol: string, ticker: string) => {
    if (!onDeleteAsset) {
      return;
    }

    if (window.confirm(`Se eliminaran todas las compras registradas para ${ticker}. Continuar?`)) {
      onDeleteAsset(symbol);
    }
  };

  if (!holdings.length) {
    return (
      <EmptyState
        icon={BadgeEuro}
        title="Todavia no tienes activos"
        description="Usa la vista Anadir para buscar un simbolo, registrar una compra y empezar a ver la tabla completa del portafolio."
      />
    );
  }

  return (
    <Card className="overflow-hidden p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="label">Assets actuales</div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Portafolio vivo</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary !px-4 !py-2.5" onClick={() => toggleSort("currentValue")}>
            <ArrowDownUp className="mr-2 h-4 w-4" />
            Ordenar por valor
          </button>
          <button type="button" className="btn-secondary !px-4 !py-2.5" onClick={() => toggleSort("totalReturnPct")}>
            <ArrowDownUp className="mr-2 h-4 w-4" />
            Ordenar por ganancia
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          className={cn("btn-secondary !px-4 !py-2.5", filterTab === "ALL" && "border-primary/30 bg-primary/10 text-white")}
          onClick={() => setFilterTab("ALL")}
        >
          Todos
        </button>
        <button
          type="button"
          className={cn(
            "btn-secondary !px-4 !py-2.5",
            filterTab === "INDEX_FUNDS" && "border-primary/30 bg-primary/10 text-white",
          )}
          onClick={() => setFilterTab("INDEX_FUNDS")}
        >
          Index Funds
        </button>
        <button
          type="button"
          className={cn(
            "btn-secondary !px-4 !py-2.5",
            filterTab === "FUNDS" && "border-primary/30 bg-primary/10 text-white",
          )}
          onClick={() => setFilterTab("FUNDS")}
        >
          Funds
        </button>
        <button
          type="button"
          className={cn("btn-secondary !px-4 !py-2.5", filterTab === "ETF" && "border-primary/30 bg-primary/10 text-white")}
          onClick={() => setFilterTab("ETF")}
        >
          ETF
        </button>
        <button
          type="button"
          className={cn(
            "btn-secondary !px-4 !py-2.5",
            filterTab === "STOCKS" && "border-primary/30 bg-primary/10 text-white",
          )}
          onClick={() => setFilterTab("STOCKS")}
        >
          Stocks
        </button>
        <button
          type="button"
          className={cn(
            "btn-secondary !px-4 !py-2.5",
            filterTab === "CRYPTO" && "border-primary/30 bg-primary/10 text-white",
          )}
          onClick={() => setFilterTab("CRYPTO")}
        >
          Crypto
        </button>
      </div>

      {filteredHoldings.length === 0 ? (
        <div className="mb-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-400">
          No hay assets para esta pestaña.
        </div>
      ) : null}

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full table-auto border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-500">
              <th className="px-4 py-2 font-semibold">Activo</th>
              <th className="px-4 py-2 font-semibold">Valor actual</th>
              <th className="px-4 py-2 font-semibold">% G/P total</th>
              <th className="px-4 py-2 font-semibold">Cantidad</th>
              <th className="px-4 py-2 font-semibold">Compra media</th>
              <th className="px-4 py-2 font-semibold">Precio actual</th>
              <th className="px-4 py-2 font-semibold">Actualizado</th>
              <th className="px-4 py-2 font-semibold">% vs cierre</th>
              <th className="px-4 py-2 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedHoldings.map((holding) => {
              const AssetIcon = assetIcons[holding.assetType];
              const positiveReturn = holding.totalReturnPct >= 0;
              const positiveDay = holding.dailyChangePct >= 0;

              return (
                <tr key={holding.symbol} className="rounded-[24px] bg-white/[0.03] text-sm text-slate-300">
                  <td className="rounded-l-[24px] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                        <AssetIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{holding.name}</div>
                        <div className="text-xs text-slate-500">{holding.ticker}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold text-white">
                    {formatCurrencyPrivate(holding.currentValue, hideValues)}
                  </td>
                  <td className={cn("px-4 py-4 font-semibold", positiveReturn ? "text-gain" : "text-loss")}>
                    {formatPercent(holding.totalReturnPct)}
                  </td>
                  <td className="px-4 py-4">{formatNumber(holding.quantity, 4)}</td>
                  <td className="px-4 py-4">{formatCurrencyPrivate(holding.averagePrice, hideValues)}</td>
                  <td className="px-4 py-4 font-semibold text-white">
                    {formatCurrencyPrivate(holding.currentPrice, hideValues)}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-400">
                    {holding.priceUpdatedAt ? formatDateTimeLabel(holding.priceUpdatedAt) : "Sin actualizar"}
                  </td>
                  <td className={cn("px-4 py-4 font-semibold", positiveDay ? "text-gain" : "text-loss")}>
                    {formatPercent(holding.dailyChangePct)}
                  </td>
                  <td className="rounded-r-[24px] px-4 py-4 text-right">
                    {onDeleteAsset ? (
                      <button
                        type="button"
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-slate-400 hover:border-loss/20 hover:bg-loss/10 hover:text-loss"
                        onClick={() => handleDeleteAsset(holding.symbol, holding.ticker)}
                        title={`Eliminar ${holding.ticker}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {sortedHoldings.map((holding) => {
          const AssetIcon = assetIcons[holding.assetType];
          return (
            <div key={holding.symbol} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                  <AssetIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white">{holding.ticker}</div>
                  <div className="truncate text-sm text-slate-400">{holding.name}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-500">Valor actual</div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {formatCurrencyPrivate(holding.currentValue, hideValues)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">% G/P total</div>
                  <div
                    className={cn(
                      "mt-1 text-lg font-semibold",
                      holding.totalReturnPct >= 0 ? "text-gain" : "text-loss",
                    )}
                  >
                    {formatPercent(holding.totalReturnPct)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Cantidad</div>
                  <div className="mt-1 text-white">{formatNumber(holding.quantity, 4)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Compra media</div>
                  <div className="mt-1 text-white">{formatCurrencyPrivate(holding.averagePrice, hideValues)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Precio actual</div>
                  <div className="mt-1 font-semibold text-white">
                    {formatCurrencyPrivate(holding.currentPrice, hideValues)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Actualizado</div>
                  <div className="mt-1 text-white">
                    {holding.priceUpdatedAt ? formatDateTimeLabel(holding.priceUpdatedAt) : "Sin actualizar"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">% vs cierre</div>
                  <div className={cn("mt-1 font-semibold", holding.dailyChangePct >= 0 ? "text-gain" : "text-loss")}>
                    {formatPercent(holding.dailyChangePct)}
                  </div>
                </div>
              </div>
              {onDeleteAsset ? (
                <button
                  type="button"
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300 hover:border-loss/20 hover:bg-loss/10 hover:text-loss"
                  onClick={() => handleDeleteAsset(holding.symbol, holding.ticker)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar asset
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
