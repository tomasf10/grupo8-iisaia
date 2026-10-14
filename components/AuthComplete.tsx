"use client";

import { useEffect } from "react";
import Logo from "@/components/Logo";

export default function AuthComplete() {
  useEffect(() => {
    // Storage events notify the original tab without sharing auth tokens.
    localStorage.setItem("iisaia-auth-complete", String(Date.now()));
    const closeTimer = window.setTimeout(() => window.close(), 400);
    return () => window.clearTimeout(closeTimer);
  }, []);

  return (
    <div className="rise mx-auto mt-16 flex max-w-sm flex-col items-center space-y-3 rounded-xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <Logo size={40} />
      <h1 className="font-display text-xl font-semibold">¡Listo, entraste!</h1>
      <p className="text-sm text-zinc-500">Volvé a la pestaña donde pediste el link; ya debería estar adentro. Si esta pestaña sigue abierta, podés cerrarla.</p>
    </div>
  );
}
