import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

// Cliente con la sesión del usuario (cookies): las queries pasan por RLS,
// así cada usuario solo ve sus propios registros. Crear uno por request.
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Llamado desde un Server Component: no puede escribir cookies.
          // El proxy se encarga de refrescar la sesión.
        }
      },
    },
  });
}

export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;
  return { id: data.claims.sub, email: data.claims.email as string | undefined };
}
