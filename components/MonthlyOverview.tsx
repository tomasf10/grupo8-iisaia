"use client";

import { useState } from "react";
import TransactionList from "@/components/TransactionList";
import { formatMoney } from "@/lib/format";
import { CATEGORIES, type Budget, type Transaction } from "@/lib/schemas";

export default function MonthlyOverview({ transactions, initialBudgets }: { transactions: Transaction[]; initialBudgets: Budget[] }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [budgetSaving, setBudgetSaving] = useState(false);
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
  const budgetCategories = [...new Set([...CATEGORIES.expense, ...transactions.filter((t) => t.type === "expense").map((t) => t.category)])].sort((a, b) => a.localeCompare(b, "es"));

  async function loadBudgets(month: string) {
    const response = await fetch(`/api/budgets?month=${month}`);
    if (response.ok) setBudgets(await response.json());
    else setBudgetError("No se pudieron cargar los presupuestos. Aplicá la actualización de base de datos indicada en README.");
  }

  async function chooseMonth(month: string) {
    const nextMonth = month || currentMonth;
    setSelectedMonth(nextMonth);
    await loadBudgets(nextMonth);
  }

  async function saveBudget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBudgetSaving(true);
    setBudgetError("");
    const response = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: budgetCategory, month: selectedMonth, amount: Number(budgetAmount.replace(",", ".")) }),
    });
    const body = await response.json().catch(() => ({}));
    setBudgetSaving(false);
    if (!response.ok) {
      setBudgetError(body.error ?? "No se pudo guardar el presupuesto.");
      return;
    }
    setBudgets((previousBudgets) => [...previousBudgets.filter((budget) => budget.category !== body.category), body].sort((a, b) => a.category.localeCompare(b.category, "es")));
    setBudgetCategory("");
    setBudgetAmount("");
  }

  async function removeBudget(id: string) {
    const response = await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
    if (response.ok) setBudgets((previousBudgets) => previousBudgets.filter((budget) => budget.id !== id));
    else setBudgetError("No se pudo eliminar el presupuesto.");
  }

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

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Presupuestos por categoría</h2>
          <p className="text-xs capitalize text-zinc-500">{monthLabel}</p>
        </div>
        <form onSubmit={saveBudget} className="mb-5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <label className="sr-only" htmlFor="budget-category">Categoría</label>
          <select id="budget-category" required value={budgetCategory} onChange={(event) => setBudgetCategory(event.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
            <option value="">Elegí una categoría</option>
            {budgetCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <label className="sr-only" htmlFor="budget-amount">Límite mensual</label>
          <input id="budget-amount" required min="0.01" step="0.01" inputMode="decimal" placeholder="Límite mensual" value={budgetAmount} onChange={(event) => setBudgetAmount(event.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
          <button disabled={budgetSaving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
            {budgetSaving ? "Guardando…" : "Guardar presupuesto"}
          </button>
        </form>
        {budgetError && <p role="alert" className="mb-3 text-sm text-rose-700 dark:text-rose-400">{budgetError}</p>}
        {budgets.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 p-5 text-center text-sm text-zinc-500 dark:border-zinc-700">Todavía no definiste presupuestos para este mes.</p>
        ) : (
          <ul className="space-y-4">
            {budgets.map((budget) => {
              const spent = currentTransactions.filter((t) => t.type === "expense" && t.category === budget.category).reduce((sum, t) => sum + t.amount, 0);
              const percent = spent / budget.amount * 100;
              const exceeded = spent > budget.amount;
              return (
                <li key={budget.id}>
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                    <span className="font-medium">{budget.category}</span>
                    <span className="text-xs tabular-nums text-zinc-500">{formatMoney(spent)} de {formatMoney(budget.amount)} · {exceeded ? `Excedido por ${formatMoney(spent - budget.amount)}` : `Quedan ${formatMoney(budget.amount - spent)}`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="img" aria-label={`${budget.category}: ${Math.round(percent)}% del presupuesto utilizado`}>
                      <div className={`h-full rounded-full ${exceeded ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(percent, 100)}%` }} />
                    </div>
                    <span className={`w-12 text-right text-xs tabular-nums ${exceeded ? "font-medium text-rose-700 dark:text-rose-400" : "text-zinc-500"}`}>{Math.round(percent)}%</span>
                    <button type="button" onClick={() => void removeBudget(budget.id)} aria-label={`Eliminar presupuesto de ${budget.category}`} className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950">Eliminar</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <TransactionList
        transactions={transactions}
        onPeriodChange={(period) => void chooseMonth(period)}
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
