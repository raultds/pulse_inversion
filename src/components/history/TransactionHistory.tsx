import { BadgeEuro, Check, Pencil, Trash2, TrendingUp, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo, useState } from "react";

import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrencyPrivate, formatNumber } from "@/lib/formatters";
import type { Transaction } from "@/types";

interface TransactionHistoryProps {
  transactions: Transaction[];
  onUpdate: (id: string, payload: { quantity?: number; price?: number; date?: string }) => void;
  onRemove: (id: string) => void;
  hideValues: boolean;
}

export function TransactionHistory({ transactions, onUpdate, onRemove, hideValues }: TransactionHistoryProps) {
  const sorted = useMemo(
    () => [...transactions].sort((left, right) => right.date.localeCompare(left.date)),
    [transactions],
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [buyQuantity, setBuyQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [editDate, setEditDate] = useState("");

  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditDate(transaction.date);
    setBuyQuantity(String(transaction.quantity));
    setBuyPrice(String(transaction.price));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  if (!sorted.length) {
    return (
      <EmptyState
        icon={BadgeEuro}
        title="Sin movimientos por ahora"
        description="Tus compras apareceran aqui con detalle de importe, fecha y posibilidad de eliminarlas si te equivocas."
      />
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="label">Registro local</div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Historial de transacciones</h2>
      </div>

      <div className="space-y-3">
        {sorted.map((transaction) => {
          const Icon = TrendingUp;
          const title = transaction.ticker;
          const amount = transaction.quantity * transaction.price;
          const isEditing = editingId === transaction.id;

          const saveEdit = () => {
            const nextQuantity = Number(buyQuantity);
            const nextPrice = Number(buyPrice);
            if (!nextQuantity || !nextPrice || !editDate) {
              return;
            }
            onUpdate(transaction.id, { quantity: nextQuantity, price: nextPrice, date: editDate });
            setEditingId(null);
          };

          return (
            <div key={transaction.id} className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-lg font-semibold text-white">{title}</div>
                    <span className="surface-chip">Compra</span>
                  </div>
                  {isEditing ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-xs text-slate-400">Cantidad</span>
                        <input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={buyQuantity}
                          onChange={(event) => setBuyQuantity(event.target.value)}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-slate-400">Precio</span>
                        <input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={buyPrice}
                          onChange={(event) => setBuyPrice(event.target.value)}
                        />
                      </label>
                      <label className="space-y-1 sm:col-span-2">
                        <span className="text-xs text-slate-400">Fecha</span>
                        <input type="date" value={editDate} onChange={(event) => setEditDate(event.target.value)} />
                      </label>
                    </div>
                  ) : (
                    <>
                      <div className="mt-1 text-sm text-slate-400">
                        {`${transaction.name} · ${formatNumber(transaction.quantity, 4)} unidades a ${formatCurrencyPrivate(transaction.price, hideValues)}`}
                      </div>
                      <div className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                        {format(parseISO(transaction.date), "d MMM yyyy", { locale: es })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-right">
                  <div className="text-sm text-slate-500">Importe</div>
                  <div className="text-lg font-semibold text-white">{formatCurrencyPrivate(amount, hideValues)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-slate-400 hover:border-gain/20 hover:bg-gain/10 hover:text-gain"
                        onClick={saveEdit}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white"
                        onClick={cancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-slate-400 hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
                      onClick={() => startEdit(transaction)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-slate-400 hover:border-loss/20 hover:bg-loss/10 hover:text-loss"
                    onClick={() => onRemove(transaction.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
