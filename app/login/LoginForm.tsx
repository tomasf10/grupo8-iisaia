"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== "iisaia-auth-complete" || !event.newValue) return;
      router.replace("/");
      router.refresh();
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

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
      <div className="appear rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm dark:border-brand-900 dark:bg-brand-950/60">
        <p className="font-medium">Te mandamos el link 📬</p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Lo enviamos a <strong>{email}</strong> (mirá el spam, por las dudas).
          Abrilo en este mismo navegador y esta pestaña entra sola.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="press mt-3 text-xs text-zinc-500 underline"
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
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-brand-300 dark:focus:ring-brand-300/20"
      />
      {error && <p className="appear text-sm text-rose-600">{error}</p>}
      <button
        disabled={status === "sending"}
        className="press w-full rounded-lg bg-brand-950 px-4 py-2 text-sm font-medium text-brand-50 hover:bg-brand-900 disabled:opacity-50 dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-brand-200"
      >
        {status === "sending" ? "Enviando…" : "Enviarme el link"}
      </button>
    </form>
  );
}
