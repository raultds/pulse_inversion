import { format, startOfToday } from "date-fns";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createId } from "@/lib/utils";
import type { AppView, AssetSearchResult, BuyTransaction, RangeSelection, Transaction } from "@/types";

interface AddBuyPayload {
  asset: AssetSearchResult;
  quantity: number;
  price: number;
  date: string;
}

interface UpdateTransactionPayload {
  quantity?: number;
  price?: number;
  date?: string;
}

interface PortfolioState {
  activeView: AppView;
  finnhubApiKey: string;
  transactions: Transaction[];
  rangeSelection: RangeSelection;
  hideValues: boolean;
  setActiveView: (view: AppView) => void;
  setFinnhubApiKey: (apiKey: string) => void;
  setRangeSelection: (range: RangeSelection) => void;
  toggleHideValues: () => void;
  addBuyTransaction: (payload: AddBuyPayload) => void;
  updateTransaction: (id: string, payload: UpdateTransactionPayload) => void;
  removeTransaction: (id: string) => void;
  removeAsset: (symbol: string) => void;
  clearPortfolio: () => void;
}

const defaultCustomDate = format(startOfToday(), "yyyy-MM-dd");

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      activeView: "dashboard",
      finnhubApiKey: "",
      transactions: [],
      rangeSelection: {
        preset: "1M",
        from: defaultCustomDate,
        to: defaultCustomDate,
      },
      hideValues: false,
      setActiveView: (activeView) => set({ activeView }),
      setFinnhubApiKey: (finnhubApiKey) => set({ finnhubApiKey: finnhubApiKey.trim() }),
      setRangeSelection: (rangeSelection) => set({ rangeSelection }),
      toggleHideValues: () => set((state) => ({ hideValues: !state.hideValues })),
      addBuyTransaction: ({ asset, quantity, price, date }) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            {
              id: createId(),
              type: "buy",
              symbol: asset.symbol,
              ticker: asset.displaySymbol || asset.symbol,
              name: asset.description,
              isin: asset.isin,
              assetType: asset.assetType,
              quantity,
              price,
              date,
            } satisfies BuyTransaction,
          ],
        })),
      updateTransaction: (id, payload) =>
        set((state) => ({
          transactions: state.transactions.map((transaction) => {
            if (transaction.id !== id) {
              return transaction;
            }

            return {
              ...transaction,
              quantity: payload.quantity ?? transaction.quantity,
              price: payload.price ?? transaction.price,
              date: payload.date ?? transaction.date,
            };
          }),
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        })),
      removeAsset: (symbol) =>
        set((state) => ({
          transactions: state.transactions.filter(
            (transaction) => transaction.type !== "buy" || transaction.symbol !== symbol,
          ),
        })),
      clearPortfolio: () =>
        set({
          transactions: [],
          rangeSelection: {
            preset: "1M",
            from: defaultCustomDate,
            to: defaultCustomDate,
          },
        }),
    }),
    {
      name: "pulseinversion-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== "object") {
          return persistedState;
        }

        const state = persistedState as {
          transactions?: Array<{ type?: string }>;
        };

        return {
          ...state,
          transactions: (state.transactions ?? []).filter((transaction) => transaction.type === "buy"),
        };
      },
      partialize: ({ activeView, finnhubApiKey, transactions, rangeSelection, hideValues }) => ({
        activeView,
        finnhubApiKey,
        transactions,
        rangeSelection,
        hideValues,
      }),
    },
  ),
);
