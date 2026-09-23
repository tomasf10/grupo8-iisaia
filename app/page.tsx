import Link from "next/link";
import { connection } from "next/server";
import SetupError from "@/components/SetupError";
import TransactionList from "@/components/TransactionList";
import { formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/schemas";
import { listTransactions } from "@/lib/transactions";

export default async function Home() {
  await connection();

  let transactions: Transaction[];
  try {
    transactions = await listTransactions();
  } catch (e) {
    return <SetupError message={(e as Error).message} />;
  }

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Gastos e ingresos
        </h1>
        <Link
          href="/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          + Nuevo registro
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Ingresos" value={income} tone="text-emerald-700 dark:text-emerald-400" />
        <Stat label="Gastos" value={expense} tone="text-rose-700 dark:text-rose-400" />
        <Stat
          label="Balance"
          value={balance}
          tone={balance < 0 ? "text-rose-700 dark:text-rose-400" : ""}
        />
      </section>

      <TransactionList transactions={transactions} />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone}`}>
        {formatMoney(value)}
      </p>
    </div>
  );
}
