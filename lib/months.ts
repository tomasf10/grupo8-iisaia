import type { Budget, Transaction } from "./schemas";

// Meses en formato YYYY-MM.

export function shiftMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function recentMonths(endMonth: string, count: number) {
  return Array.from({ length: count }, (_, index) => shiftMonth(endMonth, index - count + 1));
}

export function monthLabel(month: string, format: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat("es-AR", format).format(new Date(`${month}-01T12:00:00`));
}

export function totals(items: Transaction[]) {
  const income = items.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = items.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, balance: income - expense };
}

export function budgetUsage(budget: Budget, transactions: Transaction[]) {
  const spent = transactions
    .filter((t) => t.type === "expense" && t.category === budget.category && t.date.startsWith(budget.month))
    .reduce((sum, t) => sum + t.amount, 0);
  return { spent, percent: spent / budget.amount * 100, exceeded: spent > budget.amount };
}
