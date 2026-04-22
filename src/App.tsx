import { AlertTriangle, Eye, EyeOff, Sparkles } from "lucide-react";
import { useMemo } from "react";

import { TransactionForm } from "@/components/add/TransactionForm";
import { HeroSummary } from "@/components/dashboard/HeroSummary";
import { PortfolioChart } from "@/components/dashboard/PortfolioChart";
import { TransactionHistory } from "@/components/history/TransactionHistory";
import { Sidebar } from "@/components/layout/Sidebar";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Card } from "@/components/shared/Card";
import { usePortfolioLiveData } from "@/hooks/usePortfolioLiveData";
import { formatCurrencyPrivate } from "@/lib/formatters";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import {
  buildPortfolioHistory,
  calculateHoldings,
  calculatePortfolioSnapshot,
  filterHistoryByRange,
} from "@/utils/portfolio";

function App() {
  const {
    activeView,
    finnhubApiKey,
    transactions,
    rangeSelection,
    hideValues,
    setActiveView,
    setFinnhubApiKey,
    setRangeSelection,
    toggleHideValues,
    addBuyTransaction,
    updateTransaction,
    removeTransaction,
    removeAsset,
    clearPortfolio,
  } = usePortfolioStore();

  const { quotes, historicalPrices, isLoadingHistory, isLoadingQuotes, error, lastUpdated } =
    usePortfolioLiveData(transactions);

  const holdings = useMemo(() => calculateHoldings(transactions, quotes), [transactions, quotes]);
  const snapshot = useMemo(() => calculatePortfolioSnapshot(holdings), [holdings]);
  const fullHistory = useMemo(
    () => buildPortfolioHistory(transactions, historicalPrices, quotes),
    [historicalPrices, quotes, transactions],
  );
  const filteredHistory = useMemo(
    () => filterHistoryByRange(fullHistory, rangeSelection),
    [fullHistory, rangeSelection],
  );

  const dashboardView = (
    <div className="space-y-6">
      <HeroSummary snapshot={snapshot} lastUpdated={lastUpdated} hideValues={hideValues} />
      <PortfolioChart
        data={filteredHistory}
        rangeSelection={rangeSelection}
        onRangeChange={setRangeSelection}
        isLoading={isLoadingHistory}
        hasTransactions={transactions.length > 0}
        hideValues={hideValues}
      />
      <HoldingsTable holdings={holdings} onDeleteAsset={removeAsset} hideValues={hideValues} />
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-grid-fade bg-[size:28px_28px] opacity-20" />
      <div className="mx-auto flex max-w-[1680px] gap-6">
        <Sidebar activeView={activeView} onSelect={setActiveView} />

        <main className="min-w-0 flex-1 py-2 lg:py-6">
          {error ? (
            <Card className="mb-6 border border-loss/20 bg-loss/10 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-loss" />
                <div>
                  <div className="font-semibold text-white">No se pudieron cargar algunos datos en directo</div>
                  <p className="mt-1 text-sm leading-6 text-slate-200">{error}</p>
                </div>
              </div>
            </Card>
          ) : null}

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="label">PulseInversion</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Una vista para tu patrimonio invertido
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="surface-chip">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {transactions.length} transacciones
              </div>
              <div className="surface-chip">Activos {formatCurrencyPrivate(snapshot.totalValue, hideValues)}</div>
              <div className="surface-chip">{isLoadingQuotes ? "Actualizando precios..." : "Mercado sincronizado"}</div>
              <button
                type="button"
                className="surface-chip cursor-pointer select-none"
                onClick={toggleHideValues}
                title={hideValues ? "Mostrar importes" : "Ocultar importes"}
              >
                {hideValues ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-primary" />}
                {hideValues ? "Privado" : "Visible"}
              </button>
            </div>
          </div>

          {activeView === "dashboard" ? dashboardView : null}
          {activeView === "portfolio" ? (
            <HoldingsTable holdings={holdings} onDeleteAsset={removeAsset} hideValues={hideValues} />
          ) : null}
          {activeView === "add" ? (
            <TransactionForm onAddBuy={addBuyTransaction} hideValues={hideValues} />
          ) : null}
          {activeView === "history" ? (
            <TransactionHistory
              transactions={transactions}
              onUpdate={updateTransaction}
              onRemove={removeTransaction}
              hideValues={hideValues}
            />
          ) : null}
          {activeView === "settings" ? (
            <SettingsPanel
              finnhubApiKey={finnhubApiKey}
              onSaveFinnhubApiKey={setFinnhubApiKey}
              onClearPortfolio={clearPortfolio}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default App;
