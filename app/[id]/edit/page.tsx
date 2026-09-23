import { notFound } from "next/navigation";
import SetupError from "@/components/SetupError";
import TransactionForm from "@/components/TransactionForm";
import { uuidSchema } from "@/lib/api";
import { getTransaction } from "@/lib/transactions";

export default async function EditTransactionPage({
  params,
}: PageProps<"/[id]/edit">) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  let tx;
  try {
    tx = await getTransaction(id);
  } catch (e) {
    return <SetupError message={(e as Error).message} />;
  }
  if (!tx) notFound();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Editar registro</h1>
      <TransactionForm
        id={tx.id}
        initial={{
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          description: tx.description,
          date: tx.date,
        }}
      />
    </div>
  );
}
