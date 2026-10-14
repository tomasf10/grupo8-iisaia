"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Transaction, TransactionType } from "@/lib/schemas";
import { formatDate, formatMoney, TYPE_LABEL } from "@/lib/format";
import { monthLabel, totals } from "@/lib/months";

const FILTERS: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "income", label: "Ingresos" },
  { value: "expense", label: "Gastos" },
];

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<TransactionType | "all">("all");
  const [period, setPeriod] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);


  const categories = useMemo(
    () => [...new Set(transactions.map((t) => t.category))].sort((a, b) => a.localeCompare(b, "es")),
    [transactions],
  );
  const visible = transactions.filter((t) => {
    const matchesType = filter === "all" || t.type === filter;
    const matchesPeriod = !period || t.date.startsWith(period);
    const matchesCategory = !category || t.category === category;
    const term = search.trim().toLocaleLowerCase("es");
    const matchesSearch = !term || `${t.category} ${t.description ?? ""}`.toLocaleLowerCase("es").includes(term);
    return matchesType && matchesPeriod && matchesCategory && matchesSearch;
  });
  const groups = visible.reduce<{ month: string; items: Transaction[] }[]>((result, t) => {
    const month = t.date.slice(0, 7);
    const last = result[result.length - 1];
    if (last?.month === month) last.items.push(t);
    else result.push({ month, items: [t] });
    return result;
  }, []);
  const hasActiveFilters = Boolean(period || category || search.trim());

  function exportCsv() {
    const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      ["Fecha", "Tipo", "Categoría", "Descripción", "Monto"],
      ...visible.map((t) => [
        t.date,
        t.type === "income" ? "Ingreso" : "Gasto",
        t.category,
        t.description ?? "",
        t.amount.toFixed(2),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `movimientos${period ? `-${period}` : ""}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

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
    <section className="rise space-y-3" style={{ "--i": 1 } as React.CSSProperties}>
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`press rounded-full px-3 py-1 text-sm ${
              filter === f.value
                ? "bg-brand-950 text-brand-50 dark:bg-brand-300 dark:text-brand-950"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1">
          <span className="block text-xs font-medium text-zinc-500">Mes</span>
          <input
            type="month"
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
            }}
            aria-label="Filtrar por mes"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium text-zinc-500">Categoría</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filtrar por categoría"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium text-zinc-500">Buscar</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Categoría o descripción"
            aria-label="Buscar movimientos"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{visible.length} de {transactions.length} movimientos</span>
          <button
            type="button"
            onClick={() => { setPeriod(""); setCategory(""); setSearch(""); }}
            className="press rounded px-2 py-1 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportCsv}
          disabled={visible.length === 0}
          className="press rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Exportar {visible.length} a CSV
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          {transactions.length === 0
            ? "Todavía no hay movimientos. Cargá el primero o contale al asistente qué gastaste."
            : "Nada por acá con esos filtros."}
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map(({ month, items }) => {
            const { income, expense } = totals(items);
            return (
              <div key={month} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3 px-1">
                  <h3 className="font-display text-base font-semibold capitalize">{monthLabel(month)}</h3>
                  <p className="text-xs tabular-nums text-zinc-500">
                    <span className="text-emerald-700 dark:text-emerald-400">+{formatMoney(income)}</span>
                    {" · "}
                    <span className="text-rose-700 dark:text-rose-400">−{formatMoney(expense)}</span>
                  </p>
                </div>
                <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                  {items.map((t) => (
                    <li
                      key={t.id}
                      className={`flex items-center gap-4 px-4 py-3 transition-opacity ${
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
                          className="press rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => onDelete(t)}
                          disabled={deleting === t.id}
                          className="press rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
                        >
                          Borrar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
