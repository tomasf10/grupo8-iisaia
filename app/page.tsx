import Link from "next/link";
import { connection } from "next/server";
import SetupError from "@/components/SetupError";
import MonthlyOverview from "@/components/MonthlyOverview";
import type { Transaction } from "@/lib/schemas";
import { listBudgets, listTransactions } from "@/lib/transactions";

export default async function Home() {
  await connection();

  let transactions: Transaction[];
  let budgets;
  try {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    [transactions, budgets] = await Promise.all([listTransactions(), listBudgets(month)]);
  } catch (e) {
    return <SetupError message={(e as Error).message} />;
  }

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

      <MonthlyOverview transactions={transactions} initialBudgets={budgets} />
    </div>
  );
}
