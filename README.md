# PulseInversion

PulseInversion es una app web (React + Vite) para registrar compras y depositos, seguir el valor de la cartera y visualizar su evolucion historica con datos de mercado.

## Stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS
- Zustand
- Recharts
- lucide-react
- date-fns

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm

## Instalacion

```bash
npm install
```

## Ejecucion

Desarrollo:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview de build:

```bash
npm run preview
```

## Fuentes de datos de mercado

- **Principal:** Yahoo Finance
- **Fallback opcional:** Finnhub (requiere API key configurada en Ajustes)
- **Soporte de identificacion:** OpenFIGI (para resolver ISIN cuando aplica)
- **FX para normalizacion a EUR:** Frankfurter

En desarrollo y preview, Vite proxya estas rutas:

- `/api/yahoo1` y `/api/yahoo2`
- `/api/openfigi`
- `/api/finnhub`
- `/api/frankfurter`

## Funcionalidades actuales

- Dashboard con valor total de activos y variacion diaria.
- Grafica historica diaria desde la primera transaccion.
- Selector de visualizacion de la grafica: `Dinero` o `%`.
- Marcadores diarios en la curva y **estrella en los dias con compra**.
- Tooltip de la grafica con detalle de valor/rendimiento, depositos y assets comprados ese dia.
- Selector de rango: `1W`, `1M`, `3M`, `6M`, `1Y`, `ALL` y `CUSTOM`.
- Alta y gestion de transacciones de compra y deposito.
- Tabla de holdings con metricas de rentabilidad.
- Persistencia local en `localStorage` (estado, cache de busquedas/cotizaciones/historicos).

## Estructura principal

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

## Notas de funcionamiento

- La UI presenta importes en EUR.
- Las compras incrementan holdings; los depositos registran capital aportado.
- La curva historica usa velas diarias y para el dia actual intenta usar cotizacion en vivo.
- El fallback a Finnhub solo se utiliza cuando Yahoo falla y hay API key configurada.

## Pendiente 

- Añadir ventas, dividendos y comisiones.
- Exportacion/importacion de cartera.
- Alertas y watchlist.
