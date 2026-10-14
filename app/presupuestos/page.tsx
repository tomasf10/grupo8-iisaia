import type { Metadata } from "next";
import { connection } from "next/server";
import BudgetManager from "@/components/BudgetManager";
import PageHeader from "@/components/PageHeader";
import SetupError from "@/components/SetupError";
import { todayISO } from "@/lib/format";
import type { Budget, Transaction } from "@/lib/schemas";
import { listBudgets, listTransactions } from "@/lib/transactions";

export const metadata: Metadata = { title: "Presupuestos" };

export default async function BudgetsPage() {
  await connection();

  const month = todayISO().slice(0, 7);
  let transactions: Transaction[];
  let budgets: Budget[];
  try {
    [transactions, budgets] = await Promise.all([listTransactions("expense"), listBudgets(month)]);
  } catch (e) {
    return <SetupError message={(e as Error).message} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Presupuestos" subtitle="Un techo por categoría, para que el mes no te sorprenda." />
      <BudgetManager transactions={transactions} initialBudgets={budgets} initialMonth={month} />
    </div>
  );
}
