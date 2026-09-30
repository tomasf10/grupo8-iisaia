import { jsonError, validationError } from "@/lib/api";
import { budgetInputSchema, budgetQuerySchema } from "@/lib/schemas";
import { deleteBudget, listBudgets, saveBudget } from "@/lib/transactions";

export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("month");
  const parsedMonth = budgetQuerySchema.safeParse(month);
  if (!parsedMonth.success) return jsonError("Mes inválido (YYYY-MM)", 400);

  try {
    return Response.json(await listBudgets(parsedMonth.data));
  } catch (e) {
    return jsonError((e as Error).message);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = budgetInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    return Response.json(await saveBudget(parsed.data), { status: 201 });
  } catch (e) {
    return jsonError((e as Error).message);
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("Falta el id del presupuesto", 400);

  try {
    const deleted = await deleteBudget(id);
    return deleted ? new Response(null, { status: 204 }) : jsonError("Presupuesto no encontrado", 404);
  } catch (e) {
    return jsonError((e as Error).message);
  }
}
