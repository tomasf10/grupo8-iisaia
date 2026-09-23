import { jsonError, uuidSchema, validationError } from "@/lib/api";
import { transactionUpdateSchema } from "@/lib/schemas";
import {
  deleteTransaction,
  getTransaction,
  updateTransaction,
} from "@/lib/transactions";

type Ctx = RouteContext<"/api/transactions/[id]">;

async function getId(ctx: Ctx) {
  const { id } = await ctx.params;
  return uuidSchema.safeParse(id).success ? id : null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const id = await getId(ctx);
  if (!id) return jsonError("No encontrado", 404);
  try {
    const tx = await getTransaction(id);
    return tx ? Response.json(tx) : jsonError("No encontrado", 404);
  } catch (e) {
    return jsonError((e as Error).message);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const id = await getId(ctx);
  if (!id) return jsonError("No encontrado", 404);

  const body = await request.json().catch(() => null);
  const parsed = transactionUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const tx = await updateTransaction(id, parsed.data);
    return tx ? Response.json(tx) : jsonError("No encontrado", 404);
  } catch (e) {
    return jsonError((e as Error).message);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const id = await getId(ctx);
  if (!id) return jsonError("No encontrado", 404);
  try {
    const deleted = await deleteTransaction(id);
    return deleted
      ? new Response(null, { status: 204 })
      : jsonError("No encontrado", 404);
  } catch (e) {
    return jsonError((e as Error).message);
  }
}
