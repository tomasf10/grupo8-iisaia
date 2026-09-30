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
  const categoryExpenses = currentTransactions
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((result, transaction) => {
      result[transaction.category] = (result[transaction.category] ?? 0) + transaction.amount;
      return result;
    }, {});
  const categoryData = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1]);
  const trendData = getRecentMonths(selectedMonth, 6).map((month) => {
    const monthTransactions = transactions.filter((t) => t.date.startsWith(month));
    return {
      month,
      label: new Intl.DateTimeFormat("es-AR", { month: "short" }).format(new Date(`${month}-01T12:00:00`)),
      income: monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
      expense: monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    };
  });
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

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Gráficos financieros">
        <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold">Gastos por categoría</h2>
          <p className="mb-4 mt-1 text-xs capitalize text-zinc-500">{monthLabel}</p>
          {categoryData.length === 0 ? (
            <ChartEmpty message="No hay gastos registrados en este mes." />
          ) : (
            <ul className="space-y-3">
              {categoryData.map(([category, amount]) => {
                const percent = amount / current.expense * 100;
                return (
                  <li key={category}>
                    <div className="mb-1 flex justify-between gap-3 text-xs">
                      <span className="truncate">{category}</span>
                      <span className="shrink-0 tabular-nums text-zinc-500">{formatMoney(amount)} · {percent.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="img" aria-label={`${category}: ${percent.toFixed(1)}% de los gastos`}>
                      <div className="h-full rounded-full bg-rose-500" style={{ width: `${percent}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold">Ingresos y gastos</h2>
          <p className="mb-4 mt-1 text-xs text-zinc-500">Últimos 6 meses hasta {monthLabel}</p>
          {trendData.every((item) => item.income === 0 && item.expense === 0) ? (
            <ChartEmpty message="Todavía no hay movimientos en este período." />
          ) : (
            <>
              <div className="mb-3 flex gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Ingresos</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-rose-500" />Gastos</span>
              </div>
              <div className="grid h-40 grid-cols-6 items-end gap-2" role="img" aria-label="Gráfico de barras de ingresos y gastos de los últimos seis meses">
                {trendData.map((item) => {
                  const max = Math.max(...trendData.flatMap((entry) => [entry.income, entry.expense]), 1);
                  const incomeHeight = item.income ? Math.max(item.income / max * 100, 3) : 0;
                  const expenseHeight = item.expense ? Math.max(item.expense / max * 100, 3) : 0;
                  return (
                    <div key={item.month} className="flex h-full min-w-0 flex-col items-center justify-end gap-1">
                      <div className="flex h-full w-full items-end justify-center gap-1">
                        <div title={`Ingresos: ${formatMoney(item.income)}`} className="w-3 rounded-t bg-emerald-500" style={{ height: `${incomeHeight}%` }} />
                        <div title={`Gastos: ${formatMoney(item.expense)}`} className="w-3 rounded-t bg-rose-500" style={{ height: `${expenseHeight}%` }} />
                      </div>
                      <span className="text-[10px] capitalize text-zinc-500">{item.label.replace(".", "")}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </article>
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

function getRecentMonths(endMonth: string, count: number) {
  const [year, monthNumber] = endMonth.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, monthNumber - count + index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function ChartEmpty({ message }: { message: string }) {
  return <p className="flex h-40 items-center justify-center rounded-lg border border-dashed border-zinc-200 px-4 text-center text-sm text-zinc-500 dark:border-zinc-700">{message}</p>;
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
