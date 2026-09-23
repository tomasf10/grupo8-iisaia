import "server-only";
import { z } from "zod";

export function jsonError(message: string, status = 500, details?: unknown) {
  return Response.json({ error: message, details }, { status });
}

export function validationError(error: z.ZodError) {
  return jsonError("Datos inválidos", 400, z.flattenError(error).fieldErrors);
}

export const uuidSchema = z.uuid();
