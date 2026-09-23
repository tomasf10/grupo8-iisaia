"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(
        error.status === 429
          ? "Se enviaron demasiados emails. Esperá un rato y probá de nuevo."
          : error.message,
      );
      setStatus("idle");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-medium">Revisá tu email 📬</p>
        <p className="mt-1 text-zinc-500">
          Mandamos un link a <strong>{email}</strong>. Abrilo en este mismo
          navegador.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-3 text-xs text-zinc-500 underline"
        >
          Usar otro email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="email"
        required
        autoFocus
        placeholder="vos@ejemplo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
      />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button
        disabled={status === "sending"}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {status === "sending" ? "Enviando…" : "Enviarme el link"}
      </button>
    </form>
  );
}
