import type { Metadata } from "next";
import LandingPreview from "@/components/LandingPreview";
import Logo, { Wordmark } from "@/components/Logo";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Ingresar" };

const features = [
  {
    text: "Anotá ingresos y gastos en segundos.",
    icon: <path d="M12 5v14M5 12h14" />,
  },
  {
    text: "Gráficos del mes y presupuestos por categoría.",
    icon: <path d="M5 19V11M12 19V5M19 19v-6" />,
  },
  {
    text: "Preguntale al chat en qué se te fue la plata.",
    icon: <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 4v-4h0A2 2 0 0 1 5 13Z" />,
  },
  {
    text: "Exportá a CSV cuando lo necesites.",
    icon: <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />,
  },
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <div className="grid gap-10 sm:mt-4 sm:grid-cols-2 sm:items-center sm:gap-12">
      <section className="space-y-6">
        <div className="rise flex items-center gap-2 text-2xl">
          <Logo size={34} />
          <Wordmark />
        </div>

        <div className="rise space-y-3" style={{ "--i": 1 } as React.CSSProperties}>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
            Sabé cuánto te queda a fin de mes.
          </h1>
          <p className="text-zinc-500">Lo que entra, lo que sale y lo que te queda.</p>
        </div>

        <ul className="space-y-2.5 text-sm">
          {features.map((f, i) => (
            <li
              key={f.text}
              className="rise flex items-center gap-3"
              style={{ "--i": i + 2 } as React.CSSProperties}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {f.icon}
                </svg>
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">{f.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <div className="rise hidden sm:block" style={{ "--i": 3 } as React.CSSProperties}>
          <LandingPreview />
        </div>

        <div
          className="rise rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          style={{ "--i": 4 } as React.CSSProperties}
        >
          <LoginForm linkExpired={Boolean(error)} />
        </div>
      </section>
    </div>
  );
}
