import { z } from "zod";
import { jsonError } from "@/lib/api";
import { answerInsight } from "@/lib/insights";
import { CATEGORIES, insightQuerySchema, transactionInputSchema } from "@/lib/schemas";
import { getUser } from "@/lib/supabase/server";
import { listTransactionsBetween } from "@/lib/transactions";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// openrouter/free elige automáticamente un modelo gratuito disponible.
const DEFAULT_MODEL = "openrouter/free";

// OPENROUTER_MODEL admite una lista separada por comas: OpenRouter prueba
// el siguiente si el primero falla (rate limit, caído, etc.).
function modelParams() {
  const models = (process.env.OPENROUTER_MODEL || DEFAULT_MODEL)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return models.length > 1 ? { models } : { model: models[0] };
}

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      }),
    )
    .min(1)
    .max(30),
  today: z.iso.date().optional(),
});

const modelOutputSchema = z.object({
  reply: z.string(),
  proposal: z.unknown().nullish(),
  query: z.unknown().nullish(),
});

function systemPrompt(today: string) {
  return `Sos un asistente de una app de finanzas personales. Ayudás a registrar ingresos y gastos, y también a consultar los movimientos ya cargados, a partir de lo que escribe el usuario en lenguaje natural (en español rioplatense).

Hoy es ${today}. Resolvé fechas relativas ("ayer", "el lunes", "el 5", "este mes", "el mes pasado") a formato YYYY-MM-DD. Si no se menciona fecha al registrar, usá hoy.

Categorías sugeridas:
- Ingresos (income): ${CATEGORIES.income.join(", ")}
- Gastos (expense): ${CATEGORIES.expense.join(", ")}
Elegí la más adecuada; si ninguna encaja usá "Otros".

Respondé SIEMPRE y SOLO con un objeto JSON válido, sin texto adicional ni bloques de código, con esta forma:
{"reply": string, "proposal": null | {"type": "income" | "expense", "amount": number, "category": string, "description": string | null, "date": "YYYY-MM-DD"}, "query": null | {"kind": "sum" | "top", "type": "income" | "expense", "category": string | null, "from": "YYYY-MM-DD", "to": "YYYY-MM-DD"}}

Reglas para registrar:
- Si el mensaje describe un ingreso o gasto con monto, completá "proposal", dejá "query" en null y en "reply" resumí brevemente lo que vas a registrar pidiendo que confirme.
- "amount" es un número positivo sin símbolos ni separadores de miles (ej: "3.500" o "3,5k" => 3500).
- Si falta el monto o no está claro si es ingreso o gasto, "proposal" y "query" son null y en "reply" preguntá lo que falta.
- Registrá un solo movimiento por vez; si menciona varios, proponé el primero y avisá que después sigue con el resto.

Reglas para consultar:
- Si pregunta cuánto gastó o cobró, en qué gastó más, o pide un total o ranking de un período, completá "query", dejá "proposal" en null y NO calcules montos: el servidor los calcula y reemplaza "reply".
- "kind": "sum" para un total; "top" para el ranking de categorías (en qué gastó o cobró más).
- "type": "expense" para gastos y "income" para ingresos o cobros.
- "category": el rubro o el texto a filtrar (por ejemplo "Supermercado" o "Carrefour"). null si pide el total o el ranking general.
- "from" y "to" inclusive. "Este mes": desde el día 1 del mes de hoy hasta hoy. "El mes pasado": el mes calendario anterior completo. Un mes nombrado sin año: ese mes del año de hoy si ya empezó, si no el año anterior.
- "proposal" y "query" no van juntos.

Si no es un registro ni una consulta sobre sus movimientos, respondé breve en "reply" con "proposal" y "query" en null y recordale para qué servís.`;
}

// Algunos modelos free envuelven el JSON en ```json ... ``` o agregan texto.
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!(await getUser())) return jsonError("No autenticado", 401);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return jsonError("Falta OPENROUTER_API_KEY en .env.local");

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return jsonError("Mensaje inválido", 400);

  const today = parsed.data.today ?? new Date().toISOString().slice(0, 10);
  const messages = parsed.data.messages.slice(-12);

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Gastos e Ingresos",
    },
    body: JSON.stringify({
      ...modelParams(),
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemPrompt(today) }, ...messages],
    }),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    console.error("OpenRouter error", res.status, JSON.stringify(detail));
    const msg =
      res.status === 429
        ? "El modelo gratuito está saturado. Probá de nuevo en unos segundos."
        : `Error del modelo de IA (${res.status}): ${detail?.error?.message ?? "sin detalle"}`;
    return jsonError(msg, 502);
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  const output = modelOutputSchema.safeParse(extractJson(content));

  if (!output.success) {
    // El modelo no devolvió JSON: mostramos su texto tal cual, sin propuesta.
    return Response.json({
      reply: content.trim() || "No entendí, ¿me lo repetís?",
      proposal: null,
    });
  }

  const query = output.data.query
    ? insightQuerySchema.safeParse(output.data.query)
    : null;

  if (query?.success) {
    const from = query.data.from <= query.data.to ? query.data.from : query.data.to;
    const to = query.data.from <= query.data.to ? query.data.to : query.data.from;
    try {
      const transactions = await listTransactionsBetween(from, to, query.data.type);
      return Response.json({
        reply: answerInsight(transactions, { ...query.data, from, to }),
        proposal: null,
      });
    } catch (error) {
      console.error("Insight query failed", error);
      return jsonError("No pude consultar tus movimientos.", 500);
    }
  }

  const proposal = output.data.proposal
    ? transactionInputSchema.safeParse(output.data.proposal)
    : null;

  return Response.json({
    reply: output.data.reply,
    proposal: proposal?.success ? proposal.data : null,
  });
}
