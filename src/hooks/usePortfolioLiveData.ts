import { useEffect, useMemo, useState } from "react";

import { fetchMarketHistoricalPrices, fetchMarketQuote } from "@/services/marketData";
import { getEarliestTransactionDate } from "@/utils/portfolio";
import type { HistoricalPricePoint, MarketInstrument, QuoteData, Transaction } from "@/types";

interface LiveDataState {
  quotes: Record<string, QuoteData>;
  historicalPrices: Record<string, HistoricalPricePoint[]>;
  isLoadingQuotes: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export function usePortfolioLiveData(transactions: Transaction[]) {
  const [state, setState] = useState<LiveDataState>({
    quotes: {},
    historicalPrices: {},
    isLoadingQuotes: false,
    isLoadingHistory: false,
    error: null,
    lastUpdated: null,
  });

  const heldInstruments = useMemo(() => {
    const instruments = new Map<string, MarketInstrument>();

    for (const transaction of transactions) {
      if (transaction.type !== "buy") {
        continue;
      }

      const key = transaction.symbol.trim().toUpperCase();
      if (!instruments.has(key)) {
        instruments.set(key, {
          symbol: transaction.symbol,
          isin: transaction.isin,
        });
      } else if (transaction.isin && !instruments.get(key)?.isin) {
        instruments.set(key, {
          symbol: transaction.symbol,
          isin: transaction.isin,
        });
      }
    }

    return [...instruments.values()].sort((left, right) => left.symbol.localeCompare(right.symbol));
  }, [transactions]);

  const earliestDate = useMemo(() => getEarliestTransactionDate(transactions), [transactions]);

  useEffect(() => {
    if (heldInstruments.length === 0) {
      setState((previous) => ({
        ...previous,
        quotes: {},
        historicalPrices: {},
        isLoadingQuotes: false,
        isLoadingHistory: false,
        error: null,
      }));
      return;
    }

    let cancelled = false;

    const loadQuotes = async (force = false) => {
      setState((previous) => ({ ...previous, isLoadingQuotes: true, error: null }));

      const results = await Promise.allSettled(
        heldInstruments.map(async (instrument) => {
          return [instrument.symbol, await fetchMarketQuote(instrument, force)] as const;
        }),
      );

      if (cancelled) {
        return;
      }

      const successfulQuotes = Object.fromEntries(
        results
          .filter((result): result is PromiseFulfilledResult<readonly [string, QuoteData]> => result.status === "fulfilled")
          .map((result) => result.value),
      );

      const failedSymbols = results
        .map((result, index) =>
          result.status === "rejected"
            ? {
                symbol: heldInstruments[index].symbol,
                message: result.reason instanceof Error ? result.reason.message : "Error al cargar cotizacion.",
              }
            : null,
        )
        .filter((item): item is { symbol: string; message: string } => Boolean(item));

      setState((previous) => ({
        ...previous,
        quotes: {
          ...previous.quotes,
          ...successfulQuotes,
        },
        isLoadingQuotes: false,
        lastUpdated: Object.keys(successfulQuotes).length > 0 ? Date.now() : previous.lastUpdated,
        error:
          failedSymbols.length > 0
            ? `No se pudieron actualizar estas cotizaciones: ${failedSymbols.map((item) => item.symbol).join(", ")}.`
            : previous.error,
      }));
    };

    const loadHistory = async () => {
      setState((previous) => ({ ...previous, isLoadingHistory: true, error: previous.error }));

      const results = await Promise.allSettled(
        heldInstruments.map(async (instrument) => {
          return [instrument.symbol, await fetchMarketHistoricalPrices(instrument, earliestDate)] as const;
        }),
      );

      if (cancelled) {
        return;
      }

      const successfulHistory = Object.fromEntries(
        results
          .filter(
            (result): result is PromiseFulfilledResult<readonly [string, HistoricalPricePoint[]]> =>
              result.status === "fulfilled",
          )
          .map((result) => result.value),
      );

      const failedSymbols = results
        .map((result, index) => (result.status === "rejected" ? heldInstruments[index].symbol : null))
        .filter((item): item is string => Boolean(item));

      setState((previous) => ({
        ...previous,
        historicalPrices: {
          ...previous.historicalPrices,
          ...successfulHistory,
        },
        isLoadingHistory: false,
        error:
          failedSymbols.length > 0 && !previous.error
            ? `No se pudo reconstruir el historico de: ${failedSymbols.join(", ")}.`
            : previous.error,
      }));
    };

    void loadQuotes();
    void loadHistory();

    const interval = window.setInterval(() => {
      void loadQuotes(true);
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [earliestDate, heldInstruments]);

  return state;
}
