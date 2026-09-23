import { jsonError, validationError } from "@/lib/api";
import { transactionInputSchema, transactionTypeSchema } from "@/lib/schemas";
import { createTransaction, listTransactions } from "@/lib/transactions";

export async function GET(request: Request) {
  const typeParam = new URL(request.url).searchParams.get("type");
  const type = typeParam ? transactionTypeSchema.safeParse(typeParam) : null;
  if (type && !type.success) return jsonError("type inválido", 400);

  try {
    return Response.json(await listTransactions(type?.data));
  } catch (e) {
    return jsonError((e as Error).message);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = transactionInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    return Response.json(await createTransaction(parsed.data), { status: 201 });
  } catch (e) {
    return jsonError((e as Error).message);
  }
}
