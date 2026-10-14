"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ linkExpired = false }: { linkExpired?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== "iisaia-auth-complete" || !event.newValue) return;
      router.replace("/");
      router.refresh();
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    const { error } = await createClient().auth.verifyOtp({ email, token: code, type: "email" });

    if (error) {
      setError("Ese código no sirve (es inválido o expiró). Revisalo o pedí uno nuevo.");
      setVerifying(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

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
      <div className="appear space-y-4">
        <div className="space-y-1">
          <h2 className="font-semibold tracking-tight">Revisá tu mail 📬</h2>
          <p className="text-sm text-zinc-500">
            Mandamos un link y un código a{" "}
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">{email}</strong>.
            Abrí el link en este navegador o pegá el código acá.
          </p>
        </div>
        <form onSubmit={onVerify} className="space-y-3">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            minLength={6}
            maxLength={10}
            placeholder="Código"
            aria-label="Código del email"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.4em] outline-none transition-colors placeholder:font-sans placeholder:text-sm placeholder:tracking-normal focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-brand-300 dark:focus:ring-brand-300/20"
          />
          {error && <p className="appear text-sm text-rose-600">{error}</p>}
          <button
            disabled={verifying || code.length < 6}
            className="press w-full rounded-lg bg-brand-950 px-4 py-2 text-sm font-medium text-brand-50 hover:bg-brand-900 disabled:opacity-50 dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-brand-200"
          >
            {verifying ? "Verificando…" : "Entrar con el código"}
          </button>
        </form>
        <p className="text-xs text-zinc-500">
          ¿No llegó? Mirá en spam o{" "}
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setCode("");
              setError(null);
            }}
            className="press text-brand-700 underline underline-offset-2 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200"
          >
            usá otro email
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-semibold tracking-tight">Entrá a Vuelto</h2>
        <p className="text-sm text-zinc-500">
          Te mandamos un link por email. Sin contraseñas, y si es tu primera vez la cuenta se
          crea sola.
        </p>
      </div>
      {linkExpired && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          Ese link ya no sirve (es inválido o expiró). Pedí uno nuevo.
        </p>
      )}
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
    </div>
  );
}
