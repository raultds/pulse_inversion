const FRANKFURTER_BASE = "/api/frankfurter";

type FrankfurterLatest = {
  rates?: { EUR?: number };
};

type FrankfurterRange = {
  rates?: Record<string, { EUR?: number }>;
};

let latestCache: { key: string; multiplier: number; cachedAt: number } | null = null;
const LATEST_TTL_MS = 1000 * 60 * 30;

function normalizeFetchError(error: unknown) {
  if (error instanceof TypeError) {
    return new Error("No se pudo conectar con el servicio de tipos de cambio. Revisa la conexion o el servidor de desarrollo.");
  }

  return error instanceof Error ? error : new Error("Error al obtener tipo de cambio.");
}

/**
 * Yahoo uses "GBp" for prices in pence. Frankfurter quotes GBP; scale by 1/100.
 */
export function yahooCurrencyToFrankfurterBase(currency: string): { from: string; scale: number } {
  const trimmed = currency.trim();
  if (!trimmed) {
    return { from: "EUR", scale: 1 };
  }

  if (trimmed === "GBp" || trimmed === "GBX") {
    return { from: "GBP", scale: 1 / 100 };
  }

  const upper = trimmed.toUpperCase();
  if (upper === "EUR") {
    return { from: "EUR", scale: 1 };
  }

  return { from: upper, scale: 1 };
}

async function fetchFrankfurterJson<T>(path: string): Promise<T> {
  try {
    const response = await fetch(`${FRANKFURTER_BASE}${path}`);

    if (!response.ok) {
      throw new Error(`Tipo de cambio: respuesta ${response.status}.`);
    }

    return (await response.json()) as T;
  } catch (error) {
    throw normalizeFetchError(error);
  }
}

/** EUR value for 1 unit of Yahoo-quoted currency (handles GBp). */
export async function getYahooToEurMultiplier(currency: string | undefined | null): Promise<number> {
  if (!currency?.trim()) {
    return 1;
  }

  const { from, scale } = yahooCurrencyToFrankfurterBase(currency);
  if (from === "EUR") {
    return 1;
  }

  const cacheKey = `${from}::${scale}`;
  if (latestCache && latestCache.key === cacheKey && Date.now() - latestCache.cachedAt < LATEST_TTL_MS) {
    return latestCache.multiplier;
  }

  const data = await fetchFrankfurterJson<FrankfurterLatest>(`/latest?from=${encodeURIComponent(from)}&to=EUR`);
  const eurPerUnit = data.rates?.EUR;
  if (typeof eurPerUnit !== "number" || !Number.isFinite(eurPerUnit) || eurPerUnit <= 0) {
    throw new Error(`No hay tipo EUR para la divisa ${from}.`);
  }

  const multiplier = scale * eurPerUnit;
  latestCache = { key: cacheKey, multiplier, cachedAt: Date.now() };
  return multiplier;
}

function buildDateRateLookup(rates: Record<string, { EUR?: number }>): Map<string, number> {
  const sortedDates = Object.keys(rates).sort();
  const map = new Map<string, number>();
  let last = 0;

  for (const date of sortedDates) {
    const eur = rates[date]?.EUR;
    if (typeof eur === "number" && Number.isFinite(eur) && eur > 0) {
      last = eur;
    }
    if (last > 0) {
      map.set(date, last);
    }
  }

  return map;
}

/** For each calendar date in [start, end], EUR per 1 unit of `from` (Frankfurter base), forward-filled. */
export async function getEurPerUnitByDate(
  frankfurterFrom: string,
  startDate: string,
  endDate: string,
): Promise<Map<string, number>> {
  if (frankfurterFrom === "EUR") {
    return new Map();
  }

  const path = `/${encodeURIComponent(startDate)}..${encodeURIComponent(endDate)}?from=${encodeURIComponent(
    frankfurterFrom,
  )}&to=EUR`;
  const data = await fetchFrankfurterJson<FrankfurterRange>(path);
  const raw = data.rates ?? {};
  return buildDateRateLookup(raw);
}

export function resolveRateForPointDate(lookup: Map<string, number>, pointDate: string): number {
  let candidate = pointDate;
  for (let i = 0; i < 12 && !lookup.has(candidate); i += 1) {
    const d = new Date(`${candidate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    candidate = `${y}-${m}-${day}`;
  }

  return lookup.get(candidate) ?? lookup.values().next().value ?? 1;
}
