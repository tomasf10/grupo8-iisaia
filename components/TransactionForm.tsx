"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CATEGORIES,
  type TransactionInput,
  type TransactionType,
} from "@/lib/schemas";
import { todayISO } from "@/lib/format";

type Props = {
  id?: string;
  initial?: TransactionInput;
};

export default function TransactionForm({ id, initial }: Props) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(id ? `/api/transactions/${id}` : "/api/transactions", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        amount: Number(amount.replace(",", ".")),
        category,
        description,
        date,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const details = body.details
        ? Object.values(body.details as Record<string, string[]>).flat().join(". ")
        : "";
      setError(details || body.error || "No se pudo guardar");
      setSaving(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  const input =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100 dark:focus:ring-zinc-100";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setCategory("");
            }}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              type === t
                ? t === "income"
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-950 dark:text-emerald-400"
                  : "bg-white text-rose-700 shadow-sm dark:bg-zinc-950 dark:text-rose-400"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            {t === "income" ? "Ingreso" : "Gasto"}
          </button>
        ))}
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Monto</span>
        <input
          className={input}
          inputMode="decimal"
          required
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Categoría</span>
        <input
          className={input}
          list={`categories-${type}`}
          required
          placeholder="Elegí o escribí una"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <datalist id={`categories-${type}`}>
          {CATEGORIES[type].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Descripción</span>
        <input
          className={input}
          placeholder="Opcional"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Fecha</span>
        <input
          type="date"
          className={input}
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {saving ? "Guardando…" : id ? "Guardar cambios" : "Crear registro"}
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
