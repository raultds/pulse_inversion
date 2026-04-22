import { endOfYesterday, format, parseISO, startOfDay } from "date-fns";

import {
  isFiniteNumber,
  isIsinQuery,
  isLikelyTickerQuery,
  mapMarketTypeToAssetType,
  serializeYahooSearchResult,
} from "@/lib/utils";
import {
  getEurPerUnitByDate,
  getYahooToEurMultiplier,
  resolveRateForPointDate,
  yahooCurrencyToFrankfurterBase,
} from "@/services/exchangeRates";
import type {
  AssetSearchResult,
  HistoricalPricePoint,
  MarketInstrument,
  OpenFigiMappingItem,
  OpenFigiMappingResponseItem,
  QuoteData,
  YahooChartResponse,
  YahooQuoteItem,
  YahooQuoteResponse,
  YahooSearchResponse,
} from "@/types";

const YAHOO_BASE_URLS = ["/api/yahoo1", "/api/yahoo2"] as const;
const OPENFIGI_BASE_URL = "/api/openfigi";
const SEARCH_CACHE_KEY = "pulseinversion:yahoo:search";
const QUOTE_CACHE_KEY = "pulseinversion:yahoo:quote";
const HISTORY_CACHE_KEY = "pulseinversion:yahoo:history";
const YAHOO_SYMBOL_CACHE_KEY = "pulseinversion:yahoo:symbol-map";

const SEARCH_TTL_MS = 1000 * 60 * 60 * 6;
const QUOTE_TTL_MS = 1000 * 20;

type SearchCache = Record<string, { value: AssetSearchResult[]; cachedAt: number }>;
type QuoteCache = Record<string, QuoteData>;
type SymbolCache = Record<string, string>;
type HistoryCache = Record<
  string,
  {
    from: number;
    to: number;
    points: HistoricalPricePoint[];
  }
>;

function readCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readSymbolCache() {
  return readCache<SymbolCache>(YAHOO_SYMBOL_CACHE_KEY, {});
}

function writeSymbolCache(cache: SymbolCache) {
  writeCache(YAHOO_SYMBOL_CACHE_KEY, cache);
}

function normalizeFetchError(provider: string, error: unknown) {
  if (error instanceof TypeError) {
    return new Error(`No se pudo conectar con ${provider}. Revisa que el servidor de desarrollo este activo e intentalo de nuevo.`);
  }

  return error instanceof Error ? error : new Error(`Error inesperado al consultar ${provider}.`);
}

async function fetchYahoo<T>(path: string, query?: Record<string, string>) {
  const params = new URLSearchParams(query);
  let lastError: Error | null = null;

  for (const baseUrl of YAHOO_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}${params.size ? `?${params.toString()}` : ""}`);

      if (!response.ok) {
        if (response.status === 429) {
          lastError = new Error("Yahoo Finance ha limitado temporalmente las peticiones. Espera unos segundos e intentalo de nuevo.");
          continue;
        }

        lastError = new Error(`Yahoo Finance devolvio ${response.status} en ${baseUrl}.`);
        continue;
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = normalizeFetchError("Yahoo Finance", error);
    }
  }

  throw lastError ?? new Error("No se pudo completar la solicitud con Yahoo Finance.");
}

async function fetchOpenFigi<T>(path: string, body: unknown) {
  try {
    const response = await fetch(`${OPENFIGI_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("OpenFIGI ha alcanzado temporalmente el limite gratuito. Espera un momento e intentalo de nuevo.");
      }

      throw new Error("No se pudo completar la solicitud con OpenFIGI.");
    }

    return (await response.json()) as T;
  } catch (error) {
    throw normalizeFetchError("OpenFIGI", error);
  }
}

async function searchYahoo(query: string) {
  const payload = await fetchYahoo<YahooSearchResponse>("/v1/finance/search", {
    q: query.trim(),
    quotesCount: "8",
    newsCount: "0",
    listsCount: "0",
    enableFuzzyQuery: "false",
  });

  return (payload.quotes ?? [])
    .map(serializeYahooSearchResult)
    .filter(
      (item) =>
        item.symbol &&
        item.description &&
        ["stock", "etf", "fund"].includes(item.assetType),
    );
}

function quoteItemToSearchResult(item: YahooQuoteItem): AssetSearchResult | null {
  if (!item.symbol) {
    return null;
  }

  return {
    symbol: item.symbol,
    displaySymbol: item.symbol,
    description: item.longName || item.shortName || item.symbol,
    type: item.quoteType ?? "EQUITY",
    assetType: mapMarketTypeToAssetType(item.quoteType),
  };
}

async function resolveDirectYahooSymbol(query: string) {
  const normalized = query.trim().toUpperCase();
  if (!isLikelyTickerQuery(normalized)) {
    return null;
  }

  const payload = await fetchYahoo<YahooQuoteResponse>("/v7/finance/quote", {
    symbols: normalized,
  });
  const result = payload.quoteResponse?.result?.[0];

  if (!result || result.symbol?.toUpperCase() !== normalized || !isFiniteNumber(result.regularMarketPrice)) {
    return null;
  }

  return quoteItemToSearchResult(result);
}

async function resolveDirectYahooSymbolByChart(query: string) {
  const normalized = query.trim().toUpperCase();
  if (!isLikelyTickerQuery(normalized)) {
    return null;
  }

  const payload = await fetchYahoo<YahooChartResponse>(`/v8/finance/chart/${encodeURIComponent(normalized)}`, {
    interval: "1d",
    range: "1mo",
    includePrePost: "false",
    events: "div,splits",
  });

  const result = payload.chart?.result?.[0];
  const meta = result?.meta;
  const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter(isFiniteNumber);
  const hasPrice = isFiniteNumber(meta?.regularMarketPrice) || closes.length > 0;
  const resolvedSymbol = meta?.symbol?.trim();

  if (!resolvedSymbol || resolvedSymbol.toUpperCase() !== normalized || !hasPrice) {
    return null;
  }

  const inferredType = meta?.instrumentType ?? "EQUITY";
  const inferredDescription = meta?.longName || meta?.shortName || resolvedSymbol;

  return {
    symbol: resolvedSymbol,
    displaySymbol: resolvedSymbol,
    description: inferredDescription,
    type: inferredType,
    assetType: mapMarketTypeToAssetType(inferredType),
  } satisfies AssetSearchResult;
}

function scoreYahooResult(result: AssetSearchResult, query: string) {
  const normalizedQuery = query.trim().toUpperCase();
  const symbol = result.symbol.toUpperCase();
  const display = result.displaySymbol.toUpperCase();
  const description = result.description.toUpperCase();

  if (symbol === normalizedQuery || display === normalizedQuery) {
    return 100;
  }

  if (symbol.startsWith(normalizedQuery) || display.startsWith(normalizedQuery)) {
    return 80;
  }

  if (description.includes(normalizedQuery)) {
    return 40;
  }

  return 0;
}

async function resolveYahooSymbolFromQuery(query: string) {
  const normalized = query.trim().toUpperCase();
  const cache = readSymbolCache();

  if (cache[normalized]) {
    return cache[normalized];
  }

  let candidates: AssetSearchResult[] = [];

  try {
    candidates = await searchYahoo(normalized);
  } catch {
    candidates = [];
  }

  if (candidates.length === 0) {
    const direct = await resolveDirectYahooSymbol(normalized);
    if (direct) {
      candidates = [direct];
    }
  }

  if (candidates.length === 0) {
    const directByChart = await resolveDirectYahooSymbolByChart(normalized);
    if (directByChart) {
      candidates = [directByChart];
    }
  }

  const best = candidates.sort((left, right) => scoreYahooResult(right, normalized) - scoreYahooResult(left, normalized))[0];

  if (!best) {
    throw new Error(`Yahoo Finance no encontro un simbolo compatible para ${normalized}.`);
  }

  cache[normalized] = best.symbol;
  writeSymbolCache(cache);
  return best.symbol;
}

async function getYahooSymbolCandidates(instrument: MarketInstrument) {
  const candidates: string[] = [];
  const pushCandidate = (value: string | undefined) => {
    const normalized = value?.trim().toUpperCase();
    if (!normalized || candidates.includes(normalized)) {
      return;
    }

    candidates.push(normalized);
  };

  pushCandidate(instrument.symbol);

  // Try to map the entered symbol to a Yahoo-compatible symbol.
  try {
    const resolvedBySymbol = await resolveYahooSymbolFromQuery(instrument.symbol);
    pushCandidate(resolvedBySymbol);
  } catch {
    // Continue with other candidate sources.
  }

  const normalizedSymbol = instrument.symbol.trim().toUpperCase();
  const [baseSymbol, suffix] = normalizedSymbol.split(".");
  if (baseSymbol) {
    pushCandidate(baseSymbol);
  }

  // Common exchange-suffix fallbacks for symbols that may be saved with
  // one marketplace suffix but priced in another Yahoo listing.
  if (baseSymbol && suffix === "F") {
    pushCandidate(`${baseSymbol}.DE`);
    pushCandidate(`${baseSymbol}.XETRA`);
  }

  if (baseSymbol && suffix === "MU") {
    pushCandidate(`${baseSymbol}.DE`);
    pushCandidate(`${baseSymbol}.F`);
  }

  if (baseSymbol && suffix === "L") {
    pushCandidate(`${baseSymbol}.LON`);
  }

  if (instrument.isin?.trim()) {
    try {
      const isinResolved = await resolveYahooSymbolFromQuery(instrument.isin);
      pushCandidate(isinResolved);
    } catch {
      // Continue with other candidate sources.
    }

    try {
      const openFigiMatches = await resolveByIsinWithOpenFigi(instrument.isin);
      for (const match of openFigiMatches) {
        pushCandidate(match.symbol);
      }
    } catch {
      // Continue with other candidate sources.
    }
  }

  return candidates;
}

export async function resolveYahooInstrument(instrument: MarketInstrument) {
  const candidates = await getYahooSymbolCandidates(instrument);
  const firstCandidate = candidates[0];

  if (!firstCandidate) {
    throw new Error(`Yahoo Finance no encontro un simbolo compatible para ${instrument.symbol}.`);
  }

  return firstCandidate;
}

function scoreOpenFigiVenue(exchCode: string | undefined): number {
  if (!exchCode) {
    return 50;
  }

  const code = exchCode.toUpperCase();
  const prefersEuroArea: Record<string, number> = {
    GR: 130,
    DE: 130,
    F: 130,
    BE: 125,
    DU: 125,
    HA: 125,
    MU: 125,
    ST: 125,
    PA: 130,
    FP: 130,
    AS: 130,
    BR: 125,
    MC: 125,
    MA: 125,
    MI: 125,
    IR: 125,
    HE: 125,
    VI: 125,
    WA: 122,
    L: 85,
    US: 40,
    UW: 40,
    UN: 40,
    UA: 40,
    UQ: 40,
    UF: 40,
    CN: 38,
    TO: 38,
    V: 36,
  };

  return prefersEuroArea[code] ?? 55;
}

function sortOpenFigiMappingsForEurPreference(mappings: OpenFigiMappingItem[]) {
  return [...mappings].sort(
    (left, right) => scoreOpenFigiVenue(right.exchCode) - scoreOpenFigiVenue(left.exchCode),
  );
}

async function convertQuotePricesToEur(quote: QuoteData, nativeCurrency: string | undefined): Promise<QuoteData> {
  const mult = await getYahooToEurMultiplier(nativeCurrency);
  const { from } = yahooCurrencyToFrankfurterBase(nativeCurrency ?? "");
  if (from === "EUR") {
    return { ...quote, nativeCurrency: "EUR" };
  }

  return {
    c: quote.c * mult,
    d: quote.d * mult,
    h: quote.h * mult,
    l: quote.l * mult,
    o: quote.o * mult,
    pc: quote.pc * mult,
    dp: quote.dp,
    t: quote.t,
    fetchedAt: quote.fetchedAt,
    nativeCurrency: nativeCurrency?.trim(),
  };
}

async function resolveByIsinWithOpenFigi(query: string) {
  const normalized = query.trim().toUpperCase();
  if (!isIsinQuery(normalized)) {
    return [];
  }

  const payload = await fetchOpenFigi<OpenFigiMappingResponseItem[]>("/v3/mapping", [
    {
      idType: "ID_ISIN",
      idValue: normalized,
    },
  ]);

  const mappings = sortOpenFigiMappingsForEurPreference(payload[0]?.data ?? []);

  return mappings
    .map<AssetSearchResult | null>((item) => {
      if (!item.ticker) {
        return null;
      }

      return {
        symbol: item.ticker,
        displaySymbol: item.ticker,
        description: item.name || item.ticker,
        isin: normalized,
        type: item.securityType2 || item.securityType || "EQUITY",
        assetType: mapMarketTypeToAssetType(item.securityType2 || item.securityType),
      };
    })
    .filter((item): item is AssetSearchResult => Boolean(item));
}

function dedupeSearchResults(results: AssetSearchResult[]) {
  const seen = new Set<string>();

  return results.filter((item) => {
    const key = `${item.symbol.toUpperCase()}::${item.description.toUpperCase()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export async function searchAssets(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized || normalized.length < 2) {
    return [];
  }

  const cache = readCache<SearchCache>(SEARCH_CACHE_KEY, {});
  const cached = cache[normalized];

  if (cached && Date.now() - cached.cachedAt < SEARCH_TTL_MS) {
    return cached.value;
  }

  const results: AssetSearchResult[] = [];
  let lastError: Error | null = null;

  try {
    results.push(...(await searchYahoo(query.trim())));
  } catch (error) {
    lastError = error instanceof Error ? error : new Error("No se pudo completar la busqueda.");
  }

  if (results.length === 0) {
    try {
      const directMatch = await resolveDirectYahooSymbol(query);
      if (directMatch) {
        results.push(directMatch);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : lastError;
    }
  }

  if (results.length === 0) {
    try {
      const directChartMatch = await resolveDirectYahooSymbolByChart(query);
      if (directChartMatch) {
        results.push(directChartMatch);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : lastError;
    }
  }

  if (results.length === 0 && isIsinQuery(query)) {
    try {
      results.push(...(await resolveByIsinWithOpenFigi(query)));
    } catch (error) {
      lastError = error instanceof Error ? error : lastError;
    }
  }

  const finalResults = dedupeSearchResults(results).slice(0, 8);

  if (finalResults.length === 0 && lastError) {
    throw lastError;
  }

  cache[normalized] = {
    value: finalResults,
    cachedAt: Date.now(),
  };

  writeCache(SEARCH_CACHE_KEY, cache);
  return finalResults;
}

export async function fetchQuote(instrument: MarketInstrument, force = false) {
  const normalized = instrument.symbol.trim().toUpperCase();
  const cache = readCache<QuoteCache>(QUOTE_CACHE_KEY, {});
  const cached = cache[normalized];

  if (!force && cached && Date.now() - cached.fetchedAt < QUOTE_TTL_MS) {
    return cached;
  }

  const candidates = await getYahooSymbolCandidates(instrument);
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      try {
        const payload = await fetchYahoo<YahooQuoteResponse>("/v7/finance/quote", {
          symbols: candidate,
        });
        const result = payload.quoteResponse?.result?.[0];

        if (result && isFiniteNumber(result.regularMarketPrice)) {
          const previousClose = result.regularMarketPreviousClose ?? result.regularMarketPrice;
          const quote: QuoteData = {
            c: result.regularMarketPrice,
            d: result.regularMarketChange ?? result.regularMarketPrice - previousClose,
            dp:
              result.regularMarketChangePercent ??
              (previousClose > 0 ? ((result.regularMarketPrice - previousClose) / previousClose) * 100 : 0),
            h: result.regularMarketDayHigh ?? result.regularMarketPrice,
            l: result.regularMarketDayLow ?? result.regularMarketPrice,
            o: result.regularMarketOpen ?? previousClose,
            pc: previousClose,
            t: result.regularMarketTime ?? Math.floor(Date.now() / 1000),
            fetchedAt: Date.now(),
          };

          const converted = await convertQuotePricesToEur(quote, result.currency);
          cache[normalized] = converted;
          writeCache(QUOTE_CACHE_KEY, cache);
          return converted;
        }
      } catch {
        // Some instruments return 401/empty on quote endpoint while chart still works.
      }

      const chartPayload = await fetchYahoo<YahooChartResponse>(`/v8/finance/chart/${encodeURIComponent(candidate)}`, {
        interval: "1d",
        range: "1mo",
        includePrePost: "false",
        events: "div,splits",
      });

      const chartResult = chartPayload.chart?.result?.[0];
      const chartTimestamps = chartResult?.timestamp ?? [];
      const closes = (chartResult?.indicators?.quote?.[0]?.close ?? []).filter(isFiniteNumber);

      if (closes.length >= 1) {
        const currentPrice = closes[closes.length - 1];
        const previousClose = closes.length > 1 ? closes[closes.length - 2] : currentPrice;
        const lastChartTimestamp = chartTimestamps.length > 0 ? chartTimestamps[chartTimestamps.length - 1] : null;
        const quoteTimestamp = lastChartTimestamp && lastChartTimestamp > 0 ? lastChartTimestamp : Math.floor(Date.now() / 1000);
        const chartQuote: QuoteData = {
          c: currentPrice,
          d: currentPrice - previousClose,
          dp: previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0,
          h: currentPrice,
          l: currentPrice,
          o: previousClose,
          pc: previousClose,
          t: quoteTimestamp,
          fetchedAt: Date.now(),
        };

        const converted = await convertQuotePricesToEur(chartQuote, chartResult?.meta?.currency);
        cache[normalized] = converted;
        writeCache(QUOTE_CACHE_KEY, cache);
        return converted;
      }

      lastError = new Error(`Yahoo Finance no devolvio cotizacion valida para ${normalized} (${candidate}).`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(`Error al consultar Yahoo para ${candidate}.`);
    }
  }

  throw lastError ?? new Error(`Yahoo Finance no devolvio cotizacion valida para ${normalized}.`);
}

export async function fetchQuotes(symbols: string[], force = false) {
  const uniqueSymbols = [...new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))];
  const entries = await Promise.all(
    uniqueSymbols.map(async (symbol) => [symbol, await fetchQuote({ symbol }, force)] as const),
  );

  return Object.fromEntries(entries);
}

export async function fetchHistoricalPrices(instrument: MarketInstrument, fromDate: string) {
  const normalized = instrument.symbol.trim().toUpperCase();
  const cache = readCache<HistoryCache>(HISTORY_CACHE_KEY, {});
  const existing = cache[normalized];

  const from = startOfDay(parseISO(fromDate));
  const yesterday = endOfYesterday();
  const fromTimestamp = Math.floor(from.getTime() / 1000);
  const toTimestamp = Math.floor(yesterday.getTime() / 1000);

  if (fromTimestamp > toTimestamp) {
    return [] as HistoricalPricePoint[];
  }

  if (existing && existing.from <= fromTimestamp && existing.to >= toTimestamp) {
    return existing.points.filter(
      (point) => point.timestamp >= fromTimestamp * 1000 && point.timestamp <= toTimestamp * 1000,
    );
  }

  const candidates = await getYahooSymbolCandidates(instrument);
  let lastError: Error | null = null;

  for (const candidate of candidates) {
    try {
      const payload = await fetchYahoo<YahooChartResponse>(`/v8/finance/chart/${encodeURIComponent(candidate)}`, {
        interval: "1d",
        period1: String(fromTimestamp),
        period2: String(toTimestamp),
        includePrePost: "false",
        events: "div,splits",
      });

      const result = payload.chart?.result?.[0];
      const timestamps = result?.timestamp ?? [];
      const closes = result?.indicators?.quote?.[0]?.close ?? [];

      if (!result && payload.chart?.error?.description) {
        lastError = new Error(payload.chart.error.description);
        continue;
      }

      const points = timestamps
        .map((timestamp, index) => ({
          timestamp: timestamp * 1000,
          date: format(timestamp * 1000, "yyyy-MM-dd"),
          close: closes[index] ?? undefined,
        }))
        .filter((point): point is HistoricalPricePoint => isFiniteNumber(point.close));

      if (points.length > 0) {
        const nativeCurrency = result?.meta?.currency;
        const { from, scale } = yahooCurrencyToFrankfurterBase(nativeCurrency ?? "");
        let finalPoints = points;

        if (from !== "EUR") {
          try {
            const rangeStart = format(startOfDay(parseISO(fromDate)), "yyyy-MM-dd");
            const rangeEnd = format(endOfYesterday(), "yyyy-MM-dd");
            const lookup = await getEurPerUnitByDate(from, rangeStart, rangeEnd);
            finalPoints = points.map((point) => ({
              ...point,
              close: point.close * scale * resolveRateForPointDate(lookup, point.date),
            }));
          } catch (error) {
            lastError =
              error instanceof Error
                ? error
                : new Error(`No se pudo convertir el historico a EUR para ${normalized} (${candidate}).`);
            continue;
          }
        }

        cache[normalized] = {
          from: fromTimestamp,
          to: toTimestamp,
          points: finalPoints,
        };

        writeCache(HISTORY_CACHE_KEY, cache);
        return finalPoints;
      }

      lastError = new Error(`Yahoo Finance no devolvio historico util para ${normalized} (${candidate}).`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(`Error al consultar historico en Yahoo para ${candidate}.`);
    }
  }

  throw lastError ?? new Error(`Yahoo Finance no devolvio historico util para ${normalized}.`);
}

export function clearMarketCache() {
  localStorage.removeItem(SEARCH_CACHE_KEY);
  localStorage.removeItem(QUOTE_CACHE_KEY);
  localStorage.removeItem(HISTORY_CACHE_KEY);
  localStorage.removeItem(YAHOO_SYMBOL_CACHE_KEY);
}
