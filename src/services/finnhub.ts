import { endOfYesterday, format, parseISO, startOfDay } from "date-fns";

import { isFiniteNumber } from "@/lib/utils";
import type {
  FinnhubSearchResponseItem,
  HistoricalCandleResponse,
  HistoricalPricePoint,
  MarketInstrument,
  QuoteData,
  QuoteResponse,
} from "@/types";

const FINNHUB_BASE_URL = "/api/finnhub";
const FINNHUB_SYMBOL_CACHE_KEY = "pulseinversion:finnhub:symbol-map";

type FinnhubSymbolCache = Record<string, string>;

function readSymbolCache() {
  try {
    const raw = localStorage.getItem(FINNHUB_SYMBOL_CACHE_KEY);
    return raw ? (JSON.parse(raw) as FinnhubSymbolCache) : {};
  } catch {
    return {};
  }
}

function writeSymbolCache(cache: FinnhubSymbolCache) {
  localStorage.setItem(FINNHUB_SYMBOL_CACHE_KEY, JSON.stringify(cache));
}

async function fetchFinnhub<T>(path: string, apiKey: string, query: Record<string, string>) {
  const params = new URLSearchParams({ ...query, token: apiKey });

  try {
    const response = await fetch(`${FINNHUB_BASE_URL}${path}?${params.toString()}`);

    if (!response.ok) {
      let details = "";

      try {
        const data = (await response.json()) as { error?: string };
        details = data.error ? ` ${data.error}` : "";
      } catch {
        details = "";
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Finnhub rechazo la solicitud (${response.status}). Revisa la API key o la cobertura del activo.${details}`);
      }

      if (response.status === 429) {
        throw new Error("Finnhub ha aplicado rate limit. Espera unos segundos e intentalo de nuevo.");
      }

      throw new Error(`No se pudo completar la solicitud con Finnhub.${details}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("No se pudo conectar con Finnhub. Revisa tu conexion o el proxy local.");
    }

    throw error;
  }
}

function scoreResult(result: FinnhubSearchResponseItem, query: string) {
  const normalizedQuery = query.trim().toUpperCase();
  const symbol = result.symbol?.toUpperCase() ?? "";
  const display = result.displaySymbol?.toUpperCase() ?? "";
  const description = result.description?.toUpperCase() ?? "";

  if (display === normalizedQuery || symbol === normalizedQuery) {
    return 100;
  }

  if (display.startsWith(normalizedQuery) || symbol.startsWith(normalizedQuery)) {
    return 80;
  }

  const queryWithoutSuffix = normalizedQuery.split(".")[0];
  if (
    queryWithoutSuffix &&
    queryWithoutSuffix !== normalizedQuery &&
    (display === queryWithoutSuffix || symbol === queryWithoutSuffix)
  ) {
    return 70;
  }

  if (description.includes(normalizedQuery)) {
    return 40;
  }

  if (queryWithoutSuffix && description.includes(queryWithoutSuffix)) {
    return 20;
  }

  return 0;
}

async function searchFinnhubSymbol(query: string, apiKey: string) {
  const payload = await fetchFinnhub<{ result?: FinnhubSearchResponseItem[] }>("/search", apiKey, {
    q: query.trim(),
  });

  return (payload.result ?? [])
    .filter((item) => item.symbol && item.displaySymbol)
    .sort((left, right) => scoreResult(right, query) - scoreResult(left, query));
}

async function resolveFinnhubSymbolFromQuery(query: string, apiKey: string) {
  const normalized = query.trim().toUpperCase();
  const cache = readSymbolCache();

  if (cache[normalized]) {
    return cache[normalized];
  }

  const candidates = await searchFinnhubSymbol(normalized, apiKey);
  let resolved = candidates[0]?.symbol;

  if (!resolved && normalized.includes(".")) {
    const base = normalized.split(".")[0];
    const baseCandidates = await searchFinnhubSymbol(base, apiKey);
    resolved = baseCandidates[0]?.symbol;
  }

  if (!resolved) {
    throw new Error(`Finnhub no encontro un simbolo compatible para ${normalized}.`);
  }

  cache[normalized] = resolved;
  writeSymbolCache(cache);
  return resolved;
}

export async function resolveFinnhubInstrument(
  instrument: MarketInstrument,
  apiKey: string,
) {
  if (instrument.isin?.trim()) {
    try {
      return await resolveFinnhubSymbolFromQuery(instrument.isin, apiKey);
    } catch {
      // Fall through to symbol-based resolution.
    }
  }

  return resolveFinnhubSymbolFromQuery(instrument.symbol, apiKey);
}

export async function fetchFinnhubQuote(instrument: MarketInstrument, apiKey: string) {
  const resolvedSymbol = await resolveFinnhubInstrument(instrument, apiKey);
  const payload = await fetchFinnhub<QuoteResponse>("/quote", apiKey, {
    symbol: resolvedSymbol,
  });

  if (!isFiniteNumber(payload.c) || payload.c <= 0) {
    throw new Error(`Finnhub no devolvio cotizacion valida para ${instrument.symbol} (${resolvedSymbol}).`);
  }

  return {
    ...payload,
    fetchedAt: Date.now(),
  } satisfies QuoteData;
}

export async function fetchFinnhubHistoricalPrices(
  instrument: MarketInstrument,
  fromDate: string,
  apiKey: string,
) {
  const resolvedSymbol = await resolveFinnhubInstrument(instrument, apiKey);
  const from = startOfDay(parseISO(fromDate));
  const yesterday = endOfYesterday();
  const fromTimestamp = Math.floor(from.getTime() / 1000);
  const toTimestamp = Math.floor(yesterday.getTime() / 1000);

  if (fromTimestamp > toTimestamp) {
    return [] as HistoricalPricePoint[];
  }

  const payload = await fetchFinnhub<HistoricalCandleResponse>("/stock/candle", apiKey, {
    symbol: resolvedSymbol,
    resolution: "D",
    from: String(fromTimestamp),
    to: String(toTimestamp),
  });

  const points =
    payload.s === "ok"
      ? payload.t
          .map((timestamp, index) => ({
            timestamp: timestamp * 1000,
            date: format(timestamp * 1000, "yyyy-MM-dd"),
            close: payload.c[index],
          }))
          .filter((point) => isFiniteNumber(point.close))
      : [];

  if (points.length === 0) {
    throw new Error(`Finnhub no devolvio historico util para ${instrument.symbol} (${resolvedSymbol}).`);
  }

  return points;
}
