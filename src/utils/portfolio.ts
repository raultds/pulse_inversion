import {
  eachDayOfInterval,
  format,
  isToday,
  max,
  parseISO,
  startOfDay,
  startOfToday,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";

import type {
  BuyTransaction,
  ChartRangePreset,
  Holding,
  HistoricalPricePoint,
  PortfolioPoint,
  PortfolioSnapshot,
  QuoteData,
  RangeSelection,
  Transaction,
} from "@/types";

type QuoteMap = Record<string, QuoteData>;
type HistoryMap = Record<string, HistoricalPricePoint[]>;

interface PositionState {
  symbol: string;
  ticker: string;
  name: string;
  assetType: BuyTransaction["assetType"];
  quantity: number;
  costBasis: number;
}

export function sortTransactions(transactions: Transaction[]) {
  return [...transactions].sort((left, right) => {
    if (left.date === right.date) {
      return left.id.localeCompare(right.id);
    }

    return left.date.localeCompare(right.date);
  });
}

export function getEarliestTransactionDate(transactions: Transaction[]) {
  const sorted = sortTransactions(transactions);
  return sorted[0]?.date ?? format(startOfToday(), "yyyy-MM-dd");
}

export function calculateHoldings(transactions: Transaction[], quotes: QuoteMap) {
  const positions = new Map<string, PositionState>();

  for (const transaction of transactions) {
    const current = positions.get(transaction.symbol) ?? {
      symbol: transaction.symbol,
      ticker: transaction.ticker,
      name: transaction.name,
      assetType: transaction.assetType,
      quantity: 0,
      costBasis: 0,
    };

    current.quantity += transaction.quantity;
    current.costBasis += transaction.quantity * transaction.price;
    positions.set(transaction.symbol, current);
  }

  return [...positions.values()]
    .map<Holding>((position) => {
      const quote = quotes[position.symbol];
      const averagePrice = position.quantity > 0 ? position.costBasis / position.quantity : 0;
      const currentPrice = quote?.c ?? averagePrice;
      const providerUpdatedAt = quote?.t ? quote.t * 1000 : null;
      const priceUpdatedAt = providerUpdatedAt && providerUpdatedAt > 0 ? providerUpdatedAt : (quote?.fetchedAt ?? null);
      const currentValue = position.quantity * currentPrice;
      const totalReturnValue = currentValue - position.costBasis;
      const totalReturnPct = position.costBasis > 0 ? (totalReturnValue / position.costBasis) * 100 : 0;
      const previousClose = quote?.pc ?? currentPrice;
      const dailyChangeValue = position.quantity * (currentPrice - previousClose);
      const dailyChangePct = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

      return {
        symbol: position.symbol,
        ticker: position.ticker,
        name: position.name,
        assetType: position.assetType,
        quantity: position.quantity,
        averagePrice,
        currentPrice,
        priceUpdatedAt,
        currentValue,
        costBasis: position.costBasis,
        totalReturnPct,
        totalReturnValue,
        dailyChangePct,
        dailyChangeValue,
      };
    })
    .sort((left, right) => right.currentValue - left.currentValue);
}

export function calculatePortfolioSnapshot(holdings: Holding[]): PortfolioSnapshot {
  const totalCostBasis = holdings.reduce((sum, holding) => sum + holding.costBasis, 0);
  const holdingsValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
  const totalValue = holdingsValue;
  const totalPreviousCloseValue = holdings.reduce(
    (sum, holding) => sum + (holding.currentValue - holding.dailyChangeValue),
    0,
  );
  const dailyChangeValue = holdings.reduce((sum, holding) => sum + holding.dailyChangeValue, 0);
  const dailyChangePct =
    totalPreviousCloseValue > 0 ? (dailyChangeValue / totalPreviousCloseValue) * 100 : 0;
  const totalReturnValue = holdingsValue - totalCostBasis;
  const totalReturnPct = totalCostBasis > 0 ? (totalReturnValue / totalCostBasis) * 100 : 0;

  return {
    totalValue,
    holdingsValue,
    cashBalance: 0,
    investedAmount: totalCostBasis,
    totalReturnValue,
    totalReturnPct,
    dailyChangeValue,
    dailyChangePct,
  };
}

export function buildPortfolioHistory(
  transactions: Transaction[],
  historicalPrices: HistoryMap,
  quotes: QuoteMap,
) {
  if (!transactions.length) {
    return [] as PortfolioPoint[];
  }

  const sortedTransactions = sortTransactions(transactions);
  const startDate = parseISO(sortedTransactions[0].date);
  const endDate = startOfToday();
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const positions = new Map<string, PositionState>();
  const historyState = new Map(
    Object.entries(historicalPrices).map(([symbol, points]) => [
      symbol,
      {
        index: 0,
        lastClose: undefined as number | undefined,
        points: [...points].sort((left, right) => left.timestamp - right.timestamp),
      },
    ]),
  );

  const points: PortfolioPoint[] = [];
  let transactionIndex = 0;
  let investedCapital = 0;

  for (const day of days) {
    const dayKey = format(day, "yyyy-MM-dd");
    let dayHasBuy = false;
    const dayBoughtAssets = new Set<string>();

    while (transactionIndex < sortedTransactions.length && sortedTransactions[transactionIndex].date <= dayKey) {
      const transaction = sortedTransactions[transactionIndex];

      dayHasBuy = true;
      dayBoughtAssets.add(transaction.ticker);
      investedCapital += transaction.quantity * transaction.price;
      const current = positions.get(transaction.symbol) ?? {
        symbol: transaction.symbol,
        ticker: transaction.ticker,
        name: transaction.name,
        assetType: transaction.assetType,
        quantity: 0,
        costBasis: 0,
      };

      current.quantity += transaction.quantity;
      current.costBasis += transaction.quantity * transaction.price;
      positions.set(transaction.symbol, current);

      transactionIndex += 1;
    }

    let holdingsValue = 0;

    for (const [symbol, position] of positions.entries()) {
      if (position.quantity <= 0) {
        continue;
      }

      const history = historyState.get(symbol);
      if (history) {
        while (
          history.index < history.points.length &&
          history.points[history.index].date <= dayKey
        ) {
          history.lastClose = history.points[history.index].close;
          history.index += 1;
        }
      }

      const liveQuote = isToday(day) ? quotes[symbol]?.c : undefined;
      const fallbackPrice = position.costBasis / position.quantity;
      const price = liveQuote ?? history?.lastClose ?? fallbackPrice;
      holdingsValue += position.quantity * price;
    }

    points.push({
      date: dayKey,
      timestamp: day.getTime(),
      value: holdingsValue,
      holdingsValue,
      cashBalance: 0,
      investedCapital,
      hasBuy: dayHasBuy,
      boughtAssets: [...dayBoughtAssets],
    });
  }

  return points;
}

export function getRangeStartDate(preset: Exclude<ChartRangePreset, "CUSTOM" | "ALL">) {
  const today = startOfToday();

  switch (preset) {
    case "1W":
      return subWeeks(today, 1);
    case "1M":
      return subMonths(today, 1);
    case "3M":
      return subMonths(today, 3);
    case "6M":
      return subMonths(today, 6);
    case "1Y":
      return subYears(today, 1);
  }
}

export function filterHistoryByRange(history: PortfolioPoint[], selection: RangeSelection) {
  if (!history.length) {
    return history;
  }

  if (selection.preset === "ALL") {
    return history;
  }

  const firstDate = parseISO(history[0].date);
  const lastDate = parseISO(history[history.length - 1].date);

  if (selection.preset === "CUSTOM") {
    const from = selection.from ? parseISO(selection.from) : firstDate;
    const to = selection.to ? parseISO(selection.to) : lastDate;

    return history.filter((point) => point.date >= format(from, "yyyy-MM-dd") && point.date <= format(to, "yyyy-MM-dd"));
  }

  const computedStart = max([getRangeStartDate(selection.preset), firstDate]);
  const computedStartKey = format(computedStart, "yyyy-MM-dd");

  return history.filter((point) => point.date >= computedStartKey);
}
