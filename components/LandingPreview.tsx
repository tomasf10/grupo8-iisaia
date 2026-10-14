// Una miniatura decorativa del resumen mensual para la landing. Datos de ejemplo.
const categories = [
  { name: "Supermercado", pct: 72 },
  { name: "Transporte", pct: 41 },
  { name: "Salidas", pct: 23 },
];

export default function LandingPreview() {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-zinc-500">Te queda este mes</span>
        <span className="text-xs text-zinc-400">
          {new Date().toLocaleDateString("es-AR", { month: "long" })}
        </span>
      </div>
      <p className="mt-0.5 font-display text-3xl font-semibold tracking-tight text-brand-700 dark:text-brand-300">
        $184.250
      </p>

      <ul className="mt-4 space-y-2.5">
        {categories.map((c, i) => (
          <li key={c.name} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">{c.name}</span>
              <span className="tabular-nums text-zinc-400">{c.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="grow-x h-full rounded-full bg-brand-400"
                style={{ width: `${c.pct}%`, "--i": i } as React.CSSProperties}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1.5 text-xs">
        <p className="ml-auto w-fit rounded-xl rounded-br-sm bg-brand-950 px-3 py-1.5 text-brand-50 dark:bg-brand-300 dark:text-brand-950">
          ¿Cuánto gasté en salidas?
        </p>
        <p className="w-fit rounded-xl rounded-bl-sm bg-zinc-100 px-3 py-1.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          $38.400, un 12% menos que el mes pasado.
        </p>
      </div>
    </div>
  );
}
