import { z } from "zod";

export const CATEGORIES = {
  income: ["Sueldo", "Freelance", "Inversiones", "Regalo", "Otros"],
  expense: [
    "Supermercado",
    "Comida",
    "Transporte",
    "Servicios",
    "Alquiler",
    "Salud",
    "Educación",
    "Ocio",
    "Ropa",
    "Otros",
  ],
} as const;

export const transactionTypeSchema = z.enum(["income", "expense"]);

export const budgetInputSchema = z.object({
  category: z.string().trim().min(1).max(60),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mes inválido (YYYY-MM)"),
  amount: z.coerce.number().positive("El presupuesto debe ser mayor a 0"),
});

export const budgetQuerySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const transactionInputSchema = z.object({
  type: transactionTypeSchema,
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  category: z.string().trim().min(1, "La categoría es obligatoria").max(60),
  description: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((v) => v || null),
  date: z.iso.date("Fecha inválida (YYYY-MM-DD)"),
});

export const transactionUpdateSchema = transactionInputSchema.partial();

export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type BudgetInput = z.infer<typeof budgetInputSchema>;
export type Budget = BudgetInput & { id: string };
export type TransactionInput = z.infer<typeof transactionInputSchema>;

export type Transaction = TransactionInput & {
  id: string;
  created_at: string;
  updated_at: string;
};
