import { fetchFinnhubHistoricalPrices, fetchFinnhubQuote } from "@/services/finnhub";
import { fetchHistoricalPrices as fetchYahooHistoricalPrices, fetchQuote as fetchYahooQuote } from "@/services/yahooFinance";
import type { HistoricalPricePoint, MarketInstrument, QuoteData } from "@/types";

function getFinnhubApiKey() {
  try {
    const raw = localStorage.getItem("pulseinversion-store");
    if (!raw) {
      return "";
    }

    const parsed = JSON.parse(raw) as { state?: { finnhubApiKey?: string } };
    return parsed.state?.finnhubApiKey?.trim() ?? "";
  } catch {
    return "";
  }
}

export async function fetchMarketQuote(instrument: MarketInstrument, force = false) {
  try {
    return await fetchYahooQuote(instrument, force);
  } catch (yahooError) {
    const finnhubApiKey = getFinnhubApiKey();
    if (!finnhubApiKey) {
      throw yahooError;
    }

    return fetchFinnhubQuote(instrument, finnhubApiKey);
  }
}

export async function fetchMarketHistoricalPrices(instrument: MarketInstrument, fromDate: string) {
  try {
    return await fetchYahooHistoricalPrices(instrument, fromDate);
  } catch (yahooError) {
    const finnhubApiKey = getFinnhubApiKey();
    if (!finnhubApiKey) {
      throw yahooError;
    }

    return fetchFinnhubHistoricalPrices(instrument, fromDate, finnhubApiKey);
  }
}

export async function fetchMarketQuotes(instruments: MarketInstrument[], force = false) {
  const uniqueSymbols = [
    ...new Map(
      instruments
        .filter((instrument) => instrument.symbol.trim())
        .map((instrument) => [instrument.symbol.trim().toUpperCase(), instrument]),
    ).values(),
  ];
  const entries = await Promise.all(
    uniqueSymbols.map(async (instrument) => [instrument.symbol, await fetchMarketQuote(instrument, force)] as const),
  );

  return Object.fromEntries(entries) as Record<string, QuoteData>;
}

export async function fetchMarketHistoryBatch(instruments: MarketInstrument[], fromDate: string) {
  const uniqueSymbols = [
    ...new Map(
      instruments
        .filter((instrument) => instrument.symbol.trim())
        .map((instrument) => [instrument.symbol.trim().toUpperCase(), instrument]),
    ).values(),
  ];
  const entries = await Promise.all(
    uniqueSymbols.map(async (instrument) => [
      instrument.symbol,
      await fetchMarketHistoricalPrices(instrument, fromDate),
    ] as const),
  );

  return Object.fromEntries(entries) as Record<string, HistoricalPricePoint[]>;
}
