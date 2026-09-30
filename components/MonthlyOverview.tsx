"use client";

import { useState } from "react";
import TransactionList from "@/components/TransactionList";
import { formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/schemas";

export default function MonthlyOverview({ transactions }: { transactions: Transaction[] }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const previousMonth = getPreviousMonth(selectedMonth);
  const currentTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const previousTransactions = transactions.filter((t) => t.date.startsWith(previousMonth));
  const monthLabel = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" })
    .format(new Date(`${selectedMonth}-01T12:00:00`));
  const previousLabel = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" })
    .format(new Date(`${previousMonth}-01T12:00:00`));

  const totals = (items: Transaction[]) => {
    const income = items.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = items.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  };
  const current = totals(currentTransactions);
  const previous = totals(previousTransactions);

  return (
    <>
      <section aria-label={`Resumen de ${monthLabel}`} className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium capitalize text-zinc-600 dark:text-zinc-400">
            Resumen de {monthLabel}
          </h2>
          <p className="text-xs text-zinc-500">Comparado con {previousLabel}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Ingresos" value={current.income} previous={previous.income} tone="text-emerald-700 dark:text-emerald-400" />
          <Stat label="Gastos" value={current.expense} previous={previous.expense} tone="text-rose-700 dark:text-rose-400" />
          <Stat label="Balance" value={current.balance} previous={previous.balance} tone={current.balance < 0 ? "text-rose-700 dark:text-rose-400" : ""} />
        </div>
      </section>

      <TransactionList
        transactions={transactions}
        onPeriodChange={(period) => setSelectedMonth(period || currentMonth)}
      />
    </>
  );
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function Stat({ label, value, previous, tone }: { label: string; value: number; previous: number; tone: string }) {
  const delta = value - previous;
  const change = previous === 0
    ? value === 0 ? "Sin cambios" : "Nuevo este mes"
    : `${delta > 0 ? "+" : ""}${((delta / Math.abs(previous)) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}% vs. mes anterior`;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone}`}>
        {formatMoney(value)}
      </p>
      <p className={`mt-1 text-xs ${delta > 0 ? "text-emerald-700 dark:text-emerald-400" : delta < 0 ? "text-rose-700 dark:text-rose-400" : "text-zinc-500"}`}>
        {change}
      </p>
    </div>
  );
}
