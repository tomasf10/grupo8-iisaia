"use client";

import { useEffect } from "react";

export default function AuthComplete() {
  useEffect(() => {
    // Storage events notify the original tab without sharing auth tokens.
    localStorage.setItem("iisaia-auth-complete", String(Date.now()));
    const closeTimer = window.setTimeout(() => window.close(), 400);
    return () => window.clearTimeout(closeTimer);
  }, []);

  return (
    <div className="mx-auto mt-16 max-w-sm space-y-3 rounded-xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-lg font-semibold">Sesión iniciada</h1>
      <p className="text-sm text-zinc-500">Volvé a la pestaña donde pediste el link; ya debería estar en tu cuenta. Si esta pestaña sigue abierta, podés cerrarla.</p>
    </div>
  );
}
