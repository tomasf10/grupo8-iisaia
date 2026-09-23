import "server-only";
import { createClient } from "./supabase/server";
import type {
  Transaction,
  TransactionInput,
  TransactionType,
} from "./schemas";

const TABLE = "transactions";

// Todas las queries usan la sesión del usuario: RLS filtra por user_id.

// numeric de Postgres llega como string; lo normalizamos a number.
function normalize(row: Transaction): Transaction {
  return { ...row, amount: Number(row.amount) };
}

export async function listTransactions(type?: TransactionType) {
  const supabase = await createClient();
  let query = supabase
    .from(TABLE)
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Transaction[]).map(normalize);
}

export async function getTransaction(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalize(data as Transaction) : null;
}

export async function createTransaction(input: TransactionInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return normalize(data as Transaction);
}

export async function updateTransaction(
  id: string,
  input: Partial<TransactionInput>,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalize(data as Transaction) : null;
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  return data.length > 0;
}
