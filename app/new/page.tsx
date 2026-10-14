import type { Metadata } from "next";
import TransactionForm from "@/components/TransactionForm";

export const metadata: Metadata = { title: "Nuevo registro" };

export default function NewTransactionPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="rise font-display text-3xl font-semibold tracking-tight">Nuevo registro</h1>
      <TransactionForm />
    </div>
  );
}
