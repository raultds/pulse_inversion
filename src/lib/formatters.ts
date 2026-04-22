import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatCurrency(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function formatCurrencyPrivate(value: number, hidden: boolean, maximumFractionDigits = 2) {
  if (hidden) {
    return "••••";
  }

  return formatCurrency(value, maximumFractionDigits);
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number, maximumFractionDigits = 2) {
  const formatter = new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });

  const sign = value > 0 ? "+" : "";
  return `${sign}${formatter.format(value)}%`;
}

export function formatDateLabel(date: string) {
  return format(parseISO(date), "d MMM", { locale: es });
}

export function formatDateTimeLabel(value: number | string) {
  const date = typeof value === "number" ? new Date(value) : parseISO(value);
  return format(date, "d MMM yyyy, HH:mm", { locale: es });
}

export function formatRelativeTime(date: number | null) {
  if (!date) {
    return "Sin actualizar";
  }

  return formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: es,
  });
}
