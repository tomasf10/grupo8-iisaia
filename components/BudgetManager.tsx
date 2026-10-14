"use client";

import { useRef, useState } from "react";
import { formatMoney } from "@/lib/format";
import { budgetUsage, monthLabel, shiftMonth } from "@/lib/months";
import { CATEGORIES, type Budget, type Transaction } from "@/lib/schemas";

export default function BudgetManager({
  transactions,
  initialBudgets,
  initialMonth,
}: {
  transactions: Transaction[];
  initialBudgets: Budget[];
  initialMonth: string;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestedMonth = useRef(initialMonth);
  const categories = [...new Set([...CATEGORIES.expense, ...transactions.filter((t) => t.type === "expense").map((t) => t.category)])].sort((a, b) => a.localeCompare(b, "es"));
  const usages = budgets.map((budget) => ({ budget, ...budgetUsage(budget, transactions) }));
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = usages.reduce((sum, usage) => sum + usage.spent, 0);
  const exceededCount = usages.filter((usage) => usage.exceeded).length;

  async function chooseMonth(next: string) {
    setMonth(next);
    setError("");
    setLoading(true);
    requestedMonth.current = next;
    const response = await fetch(`/api/budgets?month=${next}`);
    // Si el usuario ya pasó a otro mes, esta respuesta llegó tarde.
    if (requestedMonth.current !== next) return;
    setLoading(false);
    if (response.ok) setBudgets(await response.json());
    else setError("No se pudieron cargar los presupuestos. Aplicá la actualización de base de datos indicada en README.");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, month, amount: Number(amount.replace(",", ".")) }),
    });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(body.error ?? "No se pudo guardar el presupuesto.");
      return;
    }
    setBudgets((previous) => [...previous.filter((budget) => budget.category !== body.category), body].sort((a, b) => a.category.localeCompare(b.category, "es")));
    setCategory("");
    setAmount("");
  }

  async function remove(id: string) {
    const response = await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
    if (response.ok) setBudgets((previous) => previous.filter((budget) => budget.id !== id));
    else setError("No se pudo eliminar el presupuesto.");
  }

  return (
    <div className="space-y-6">
      <div className="rise flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900" style={{ "--i": 1 } as React.CSSProperties}>
        <button type="button" onClick={() => void chooseMonth(shiftMonth(month, -1))} aria-label="Mes anterior" className="press rounded-lg px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">←</button>
        <p className="text-sm font-medium capitalize" aria-live="polite">{monthLabel(month)}</p>
        <button type="button" onClick={() => void chooseMonth(shiftMonth(month, 1))} aria-label="Mes siguiente" className="press rounded-lg px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">→</button>
      </div>

      {budgets.length > 0 && (
        <div className="rise grid gap-3 sm:grid-cols-3" style={{ "--i": 2 } as React.CSSProperties}>
          <Figure label="Presupuestado" value={formatMoney(totalBudget)} />
          <Figure label="Gastado" value={formatMoney(totalSpent)} tone={totalSpent > totalBudget ? "text-rose-700 dark:text-rose-400" : ""} />
          <Figure label="Categorías excedidas" value={exceededCount === 0 ? "Ninguna 🎉" : String(exceededCount)} tone={exceededCount ? "text-rose-700 dark:text-rose-400" : "text-brand-700 dark:text-brand-300"} />
        </div>
      )}

      <section className="rise rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900" style={{ "--i": 3 } as React.CSSProperties}>
        <h2 className="mb-1 text-sm font-semibold">Ponele un techo a una categoría</h2>
        <p className="mb-4 text-xs text-zinc-500">Si ya tiene presupuesto este mes, lo actualizamos.</p>
        <form onSubmit={save} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <label className="sr-only" htmlFor="budget-category">Categoría</label>
          <select id="budget-category" required value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
            <option value="">Elegí una categoría</option>
            {categories.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <label className="sr-only" htmlFor="budget-amount">Límite mensual</label>
          <input id="budget-amount" required min="0.01" step="0.01" inputMode="decimal" placeholder="Límite mensual" value={amount} onChange={(event) => setAmount(event.target.value)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
          <button disabled={saving} className="press rounded-lg bg-brand-950 px-4 py-2 text-sm font-medium text-brand-50 hover:bg-brand-900 disabled:opacity-50 dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-brand-200">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </form>
        {error && <p role="alert" className="appear mt-3 text-sm text-rose-700 dark:text-rose-400">{error}</p>}
      </section>

      <section className={`rise transition-opacity ${loading ? "opacity-50" : ""}`} style={{ "--i": 4 } as React.CSSProperties} aria-busy={loading}>
        {budgets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Sin presupuestos en {monthLabel(month)}. Arrancá con la categoría donde más se te va la plata.
          </p>
        ) : (
          <ul key={month} className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {usages.map(({ budget, spent, percent, exceeded }, index) => (
              <li key={budget.id} className="appear px-4 py-3">
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium">{budget.category}</span>
                  <span className="text-xs tabular-nums text-zinc-500">{formatMoney(spent)} de {formatMoney(budget.amount)} · {exceeded ? `Excedido por ${formatMoney(spent - budget.amount)}` : `Quedan ${formatMoney(budget.amount - spent)}`}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="img" aria-label={`${budget.category}: ${Math.round(percent)}% del presupuesto utilizado`}>
                    <div className={`grow-x h-full rounded-full ${exceeded ? "bg-rose-500" : percent >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(percent, 100)}%`, "--i": index } as React.CSSProperties} />
                  </div>
                  <span className={`w-12 text-right text-xs tabular-nums ${exceeded ? "font-medium text-rose-700 dark:text-rose-400" : "text-zinc-500"}`}>{Math.round(percent)}%</span>
                  <button type="button" onClick={() => void remove(budget.id)} aria-label={`Eliminar presupuesto de ${budget.category}`} className="press rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950">Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Figure({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
