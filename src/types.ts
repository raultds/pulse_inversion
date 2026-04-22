export type AppView = "dashboard" | "portfolio" | "add" | "history" | "settings";

export type TransactionType = "buy" | "deposit";

export type AssetType = "stock" | "etf" | "fund" | "crypto";

export type SortKey = "currentValue" | "totalReturnPct";

export type ChartRangePreset = "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL" | "CUSTOM";

export interface BuyTransaction {
  id: string;
  type: "buy";
  symbol: string;
  ticker: string;
  name: string;
  isin?: string;
  assetType: AssetType;
  quantity: number;
  price: number;
  date: string;
}

export interface DepositTransaction {
  id: string;
  type: "deposit";
  amount: number;
  date: string;
}

export type Transaction = BuyTransaction | DepositTransaction;

export interface AssetSearchResult {
  symbol: string;
  displaySymbol: string;
  description: string;
  isin?: string;
  type: string;
  assetType: AssetType;
}

export interface MarketInstrument {
  symbol: string;
  isin?: string;
}

export interface QuoteResponse {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

export interface QuoteData extends QuoteResponse {
  fetchedAt: number;
  /** Yahoo venue currency before converting to EUR for portfolio math */
  nativeCurrency?: string;
}

export interface HistoricalCandleResponse {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  s: "ok" | "no_data";
  t: number[];
  v: number[];
}

export interface FinnhubSearchResponseItem {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

export interface YahooSearchQuote {
  symbol?: string;
  shortname?: string;
  longname?: string;
  quoteType?: string;
}

export interface YahooSearchResponse {
  quotes?: YahooSearchQuote[];
}

export interface YahooQuoteItem {
  symbol?: string;
  shortName?: string;
  longName?: string;
  quoteType?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketOpen?: number;
  regularMarketPreviousClose?: number;
  regularMarketTime?: number;
}

export interface YahooQuoteResponse {
  quoteResponse?: {
    result?: YahooQuoteItem[];
  };
}

export interface YahooChartResponse {
  chart?: {
    error?: {
      description?: string;
    } | null;
    result?: Array<{
      meta?: {
        symbol?: string;
        shortName?: string;
        longName?: string;
        instrumentType?: string;
        currency?: string;
        regularMarketPrice?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
}

export interface OpenFigiMappingItem {
  ticker?: string;
  name?: string;
  exchCode?: string;
  compositeFIGI?: string;
  securityType?: string;
  securityType2?: string;
}

export interface OpenFigiMappingResponseItem {
  data?: OpenFigiMappingItem[];
  error?: string;
}

export interface HistoricalPricePoint {
  date: string;
  timestamp: number;
  close: number;
}

export interface Holding {
  symbol: string;
  ticker: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  priceUpdatedAt: number | null;
  currentValue: number;
  costBasis: number;
  totalReturnPct: number;
  totalReturnValue: number;
  dailyChangePct: number;
  dailyChangeValue: number;
}

export interface PortfolioSnapshot {
  totalValue: number;
  holdingsValue: number;
  cashBalance: number;
  investedAmount: number;
  totalReturnValue: number;
  totalReturnPct: number;
  dailyChangeValue: number;
  dailyChangePct: number;
}

export interface PortfolioPoint {
  date: string;
  timestamp: number;
  value: number;
  holdingsValue: number;
  cashBalance: number;
  investedCapital: number;
  depositAmount: number;
  hasBuy: boolean;
  boughtAssets: string[];
}

export interface RangeSelection {
  preset: ChartRangePreset;
  from?: string;
  to?: string;
}

export interface ApiError {
  title: string;
  message: string;
}
