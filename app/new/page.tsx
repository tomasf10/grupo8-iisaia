import TransactionForm from "@/components/TransactionForm";

export default function NewTransactionPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Nuevo registro</h1>
      <TransactionForm />
    </div>
  );
}
