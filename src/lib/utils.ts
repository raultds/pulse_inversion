import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { AssetType, YahooSearchQuote } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId() {
  return crypto.randomUUID();
}

export function mapMarketTypeToAssetType(type: string | undefined): AssetType {
  const normalized = (type ?? "").toLowerCase();

  if (normalized.includes("crypto")) {
    return "crypto";
  }

  if (normalized.includes("etf") || normalized.includes("etp")) {
    return "etf";
  }

  if (normalized.includes("fund") || normalized.includes("mutual")) {
    return "fund";
  }

  return "stock";
}

export function isIsinQuery(value: string) {
  return /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/i.test(value.trim());
}

export function isLikelyTickerQuery(value: string) {
  return /^[A-Z0-9.\-=]{1,20}$/i.test(value.trim());
}

export function serializeYahooSearchResult(item: YahooSearchQuote) {
  const description = item.longname || item.shortname || item.symbol || "Activo sin nombre";

  return {
    symbol: item.symbol ?? "",
    displaySymbol: item.symbol ?? "",
    description,
    type: item.quoteType ?? "EQUITY",
    assetType: mapMarketTypeToAssetType(item.quoteType),
  };
}

export function isFiniteNumber(value: number | undefined | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
