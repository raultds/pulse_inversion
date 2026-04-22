# PulseInversion

PulseInversion is a web app (React + Vite) for recording purchases, tracking portfolio value, and visualizing historical performance with market data.

## Stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS
- Zustand
- Recharts
- lucide-react
- date-fns

## Requirements

- Node.js 18+ (20+ recommended)
- npm

## Installation

```bash
npm install
```

## Run

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Build preview:

```bash
npm run preview
```

## Market Data Sources

- **Primary:** Yahoo Finance
- **Optional fallback:** Finnhub (requires an API key configured in Settings)
- **Identification support:** OpenFIGI (to resolve ISIN when applicable)
- **FX for EUR normalization:** Frankfurter

In development and preview, Vite proxies these routes:

- `/api/yahoo1` and `/api/yahoo2`
- `/api/openfigi`
- `/api/finnhub`
- `/api/frankfurter`

## Current Features

- Dashboard with total asset value and daily change.
- Daily historical chart starting from the first transaction.
- Chart display selector: `Money` or `%`.
- Daily markers on the curve and a **star on purchase days**.
- Chart tooltip with value/performance details and assets bought that day.
- Range selector: `1W`, `1M`, `3M`, `6M`, `1Y`, `ALL`, and `CUSTOM`.
- Create and manage buy transactions.
- Holdings table with profitability metrics.
- Local persistence in `localStorage` (state, search/quote/history cache).

## Main Structure

```text
src/
  components/
    add/
    dashboard/
    history/
    layout/
    portfolio/
    settings/
    shared/
  hooks/
  lib/
  services/
  store/
  utils/
  App.tsx
  main.tsx
```

## Operational Notes

- The UI displays amounts in EUR.
- Purchases increase holdings and update invested capital.
- The historical curve uses daily candles and, for the current day, tries to use live quotes.
- The Finnhub fallback is only used when Yahoo fails and an API key is configured.

## Pending

- Add sells, dividends, and fees.
- Portfolio export/import.
- Alerts and watchlist.
