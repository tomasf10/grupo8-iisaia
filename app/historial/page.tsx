import type { Metadata } from "next";
import { connection } from "next/server";
import PageHeader, { NewRecordLink } from "@/components/PageHeader";
import SetupError from "@/components/SetupError";
import TransactionList from "@/components/TransactionList";
import type { Transaction } from "@/lib/schemas";
import { listTransactions } from "@/lib/transactions";

export const metadata: Metadata = { title: "Historial" };

export default async function HistoryPage() {
  await connection();

  let transactions: Transaction[];
  try {
    transactions = await listTransactions();
  } catch (e) {
    return <SetupError message={(e as Error).message} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Historial" subtitle="Todo lo que entró y salió, mes por mes.">
        <NewRecordLink />
      </PageHeader>
      <TransactionList transactions={transactions} />
    </div>
  );
}
