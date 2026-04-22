import { useEffect, useMemo, useState } from "react";
import { BanknoteArrowDown, Bitcoin, CircleDollarSign, Loader2, Plus, SearchCheck, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

import { Card } from "@/components/shared/Card";
import { SearchInput } from "@/components/shared/SearchInput";
import { useAssetSearch } from "@/hooks/useAssetSearch";
import { formatCurrencyPrivate } from "@/lib/formatters";
import { fetchMarketQuote } from "@/services/marketData";
import type { AssetSearchResult } from "@/types";

interface TransactionFormProps {
  onAddBuy: (payload: { asset: AssetSearchResult; quantity: number; price: number; date: string }) => void;
  onAddDeposit: (payload: { amount: number; date: string }) => void;
  hideValues: boolean;
}

const defaultDate = format(new Date(), "yyyy-MM-dd");

export function TransactionForm({ onAddBuy, onAddDeposit, hideValues }: TransactionFormProps) {
  const [mode, setMode] = useState<"buy" | "deposit">("buy");
  const [query, setQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<AssetSearchResult | null>(null);
  const [bitcoinCurrency, setBitcoinCurrency] = useState<"EUR" | "USD">("EUR");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDate, setDepositDate] = useState(defaultDate);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { results, isLoading, error } = useAssetSearch(query);

  const bitcoinPreset = useMemo<AssetSearchResult>(
    () => ({
      symbol: bitcoinCurrency === "EUR" ? "BTC-EUR" : "BTC-USD",
      displaySymbol: "BTC",
      description: `Bitcoin (BTC) · cotiza en ${bitcoinCurrency}`,
      type: "CRYPTOCURRENCY",
      assetType: "crypto",
    }),
    [bitcoinCurrency],
  );

  useEffect(() => {
    if (!selectedAsset) {
      return;
    }

    let cancelled = false;

    const loadQuote = async () => {
      try {
        setLoadingQuote(true);
        const quote = await fetchMarketQuote(
          {
            symbol: selectedAsset.symbol,
            isin: selectedAsset.isin,
          },
          true,
        );
        if (!cancelled) {
          setPrice(String(quote.c));
        }
      } catch {
        if (!cancelled && !price) {
          setPrice("");
        }
      } finally {
        if (!cancelled) {
          setLoadingQuote(false);
        }
      }
    };

    void loadQuote();

    return () => {
      cancelled = true;
    };
  }, [selectedAsset]);

  const handleAssetSelect = (asset: AssetSearchResult) => {
    setSelectedAsset(asset);
    setQuery(asset.displaySymbol);
    setFeedback(null);
  };

  const handleBitcoinSelect = () => {
    setSelectedAsset(bitcoinPreset);
    setQuery(bitcoinPreset.displaySymbol);
    setFeedback(null);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (selectedAsset && value !== selectedAsset.displaySymbol) {
      setSelectedAsset(null);
    }
  };

  const resetBuyForm = () => {
    setSelectedAsset(null);
    setQuery("");
    setQuantity("1");
    setPrice("");
    setDate(defaultDate);
  };

  const submitBuy = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAsset) {
      return;
    }

    onAddBuy({
      asset: selectedAsset,
      quantity: Number(quantity),
      price: Number(price),
      date,
    });

    setFeedback(`Compra registrada para ${selectedAsset.displaySymbol}.`);
    resetBuyForm();
  };

  const submitDeposit = (event: React.FormEvent) => {
    event.preventDefault();
    onAddDeposit({
      amount: Number(depositAmount),
      date: depositDate,
    });
    setFeedback("Deposito anadido al historial del portafolio.");
    setDepositAmount("");
    setDepositDate(defaultDate);
  };

  return (
    <Card className="overflow-visible p-6 sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="label">Nueva transaccion</div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Compra activos o anade cash-in</h2>
          </div>

          <div className="flex gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setMode("buy")}
              className={mode === "buy" ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-slate-950" : "rounded-full px-4 py-2 text-sm font-semibold text-slate-300"}
            >
              Comprar
            </button>
            <button
              type="button"
              onClick={() => setMode("deposit")}
              className={mode === "deposit" ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-slate-950" : "rounded-full px-4 py-2 text-sm font-semibold text-slate-300"}
            >
              Deposito
            </button>
          </div>
        </div>

        {feedback ? (
          <div className="rounded-[24px] border border-gain/20 bg-gain/10 px-4 py-3 text-sm font-medium text-gain">
            {feedback}
          </div>
        ) : null}

        {mode === "buy" ? (
          <form className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]" onSubmit={submitBuy}>
            <div className="space-y-5">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <SearchCheck className="h-4 w-4 text-primary" />
                  Busqueda inteligente
                </div>

                <div className="mb-4 flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5">
                      <Bitcoin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Bitcoin</div>
                      <div className="text-xs text-slate-400">Anadir BTC cotizado en EUR o USD</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                      <button
                        type="button"
                        onClick={() => setBitcoinCurrency("EUR")}
                        className={
                          bitcoinCurrency === "EUR"
                            ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-slate-950"
                            : "rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300"
                        }
                      >
                        EUR
                      </button>
                      <button
                        type="button"
                        onClick={() => setBitcoinCurrency("USD")}
                        className={
                          bitcoinCurrency === "USD"
                            ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-slate-950"
                            : "rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300"
                        }
                      >
                        USD
                      </button>
                    </div>

                    <button type="button" className="btn-secondary !px-4 !py-2.5" onClick={handleBitcoinSelect}>
                      <Plus className="mr-2 h-4 w-4" />
                      Anadir BTC
                    </button>
                  </div>
                </div>

                <SearchInput
                  query={query}
                  onQueryChange={handleQueryChange}
                  results={results}
                  isLoading={isLoading}
                  error={error}
                  onSelect={handleAssetSelect}
                />

                {selectedAsset ? (
                  <div className="mt-4 rounded-[24px] border border-primary/10 bg-primary/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold text-white">{selectedAsset.displaySymbol}</div>
                        <div className="mt-1 text-sm text-slate-400">{selectedAsset.description}</div>
                      </div>
                      <div className="surface-chip">{selectedAsset.assetType.toUpperCase()}</div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="label">Cantidad</span>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="label">Precio de compra</span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                    />
                    {loadingQuote ? <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" /> : null}
                  </div>
                </label>
              </div>

              <label className="space-y-2">
                <span className="label">Fecha</span>
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={!selectedAsset || !Number(quantity) || !Number(price) || !date}
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar compra
              </button>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-5">
              <div className="label">Vista previa</div>
              <div className="mt-4 space-y-4">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm text-slate-400">Activo</div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {selectedAsset ? `${selectedAsset.displaySymbol} - ${selectedAsset.description}` : "Selecciona un asset"}
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm text-slate-400">Importe total estimado</div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    {Number(quantity) && Number(price)
                      ? formatCurrencyPrivate(Number(quantity) * Number(price), hideValues)
                      : "0 EUR"}
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-400">
                  Si no cambias el precio, el formulario intenta precargar la cotizacion actual del simbolo para que el alta sea mas rapida.
                </div>
              </div>
            </div>
          </form>
        ) : (
          <form className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]" onSubmit={submitDeposit}>
            <div className="space-y-5">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <BanknoteArrowDown className="h-4 w-4 text-primary" />
                  Cash-in del portafolio
                </div>
                <p className="text-sm leading-6 text-slate-400">
                  Cada deposito genera una marca visible en la grafica para separar las aportaciones del rendimiento real del mercado.
                </p>
              </div>

              <label className="space-y-2">
                <span className="label">Importe</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="label">Fecha</span>
                <input
                  type="date"
                  value={depositDate}
                  onChange={(event) => setDepositDate(event.target.value)}
                />
              </label>

              <button type="submit" className="btn-primary w-full" disabled={!Number(depositAmount) || !depositDate}>
                <CircleDollarSign className="mr-2 h-4 w-4" />
                Anadir deposito
              </button>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-gain/10 to-transparent p-5">
              <div className="flex items-start gap-3 rounded-[24px] border border-gain/20 bg-gain/10 p-4">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gain" />
                <div className="text-sm leading-6 text-slate-200">
                  El deposito se suma al cash disponible. Cuando compres un activo, el cash baja y el valor se traslada automaticamente a holdings.
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm text-slate-400">Preview</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {Number(depositAmount) ? formatCurrencyPrivate(Number(depositAmount), hideValues) : "0 EUR"}
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
