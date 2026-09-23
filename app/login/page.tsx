import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto mt-16 max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Ingresar</h1>
        <p className="text-sm text-zinc-500">
          Te mandamos un link por email para entrar, sin contraseña. Si es tu
          primera vez, se crea tu cuenta.
        </p>
      </div>
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          El link es inválido o expiró. Pedí uno nuevo.
        </p>
      )}
      <LoginForm />
    </div>
  );
}
