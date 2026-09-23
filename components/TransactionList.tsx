"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Transaction, TransactionType } from "@/lib/schemas";
import { formatDate, formatMoney, TYPE_LABEL } from "@/lib/format";

const FILTERS: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "income", label: "Ingresos" },
  { value: "expense", label: "Gastos" },
];

export default function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const visible =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.type === filter);

  async function onDelete(t: Transaction) {
    const label = `${TYPE_LABEL[t.type]} de ${formatMoney(t.amount)} (${t.category})`;
    if (!confirm(`¿Borrar ${label}?`)) return;

    setDeleting(t.id);
    const res = await fetch(`/api/transactions/${t.id}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) {
      alert("No se pudo borrar el registro");
      return;
    }
    router.refresh();
  }

  return (
    <section className="space-y-3">
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              filter === f.value
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No hay registros todavía. Creá uno con el botón o pedíselo al asistente.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {visible.map((t) => (
            <li
              key={t.id}
              className={`flex items-center gap-4 px-4 py-3 ${
                deleting === t.id ? "opacity-50" : ""
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  t.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                }`}
                aria-label={TYPE_LABEL[t.type]}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.category}</p>
                <p className="truncate text-xs text-zinc-500">
                  {formatDate(t.date)}
                  {t.description ? ` · ${t.description}` : ""}
                </p>
              </div>
              <p
                className={`shrink-0 text-sm font-semibold tabular-nums ${
                  t.type === "income"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-700 dark:text-rose-400"
                }`}
              >
                {t.type === "income" ? "+" : "−"}
                {formatMoney(t.amount)}
              </p>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/${t.id}/edit`}
                  className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Editar
                </Link>
                <button
                  onClick={() => onDelete(t)}
                  disabled={deleting === t.id}
                  className="rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
