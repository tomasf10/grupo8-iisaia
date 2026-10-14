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

  const backTo = id ? "/historial" : "/";

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

    router.push(backTo);
    router.refresh();
  }

  const input =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-brand-300 dark:focus:ring-brand-300/20";

  return (
    <form onSubmit={onSubmit} className="rise space-y-5" style={{ "--i": 1 } as React.CSSProperties}>
      <div className="relative grid grid-cols-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm transition-transform duration-200 ease-in-out dark:bg-zinc-950"
          style={{ transform: type === "income" ? "translateX(100%)" : "translateX(0)" }}
        />
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setCategory("");
            }}
            aria-pressed={type === t}
            className={`press relative rounded-lg py-2 text-sm font-medium ${
              type === t
                ? t === "income"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-rose-700 dark:text-rose-400"
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
        <p className="appear rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="press flex-1 rounded-lg bg-brand-950 px-4 py-2 text-sm font-medium text-brand-50 hover:bg-brand-900 disabled:opacity-50 dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-brand-200"
        >
          {saving ? "Guardando…" : id ? "Guardar cambios" : "Crear registro"}
        </button>
        <Link
          href={backTo}
          className="press rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
