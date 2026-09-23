export default function SetupError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <p className="font-semibold">No se pudo conectar con la base de datos</p>
      <p className="mt-1">{message}</p>
      <p className="mt-2">
        Revisá <code>.env.local</code> y que hayas corrido{" "}
        <code>supabase/schema.sql</code>.
      </p>
    </div>
  );
}
