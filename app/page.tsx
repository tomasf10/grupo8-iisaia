import Link from "next/link";
import { connection } from "next/server";
import { BalanceLine, GreetingTitle } from "@/components/Greeting";
import { MonthCharts, MonthSummary } from "@/components/MonthlyOverview";
import PageHeader, { NewRecordLink } from "@/components/PageHeader";
import SetupError from "@/components/SetupError";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import { budgetUsage, totals } from "@/lib/months";
import type { Budget, Transaction } from "@/lib/schemas";
import { listBudgets, listTransactions } from "@/lib/transactions";

const RECENT_COUNT = 5;

export default async function Home() {
  await connection();

  const month = todayISO().slice(0, 7);
  let transactions: Transaction[];
  let budgets: Budget[];
  try {
    [transactions, budgets] = await Promise.all([listTransactions(), listBudgets(month)]);
  } catch (e) {
    return <SetupError message={(e as Error).message} />;
  }

  const { balance } = totals(transactions.filter((t) => t.date.startsWith(month)));
  const recent = transactions.slice(0, RECENT_COUNT);
  const watched = budgets
    .map((budget) => ({ budget, ...budgetUsage(budget, transactions) }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader title={<GreetingTitle />} subtitle={<BalanceLine balance={balance} />}>
        <NewRecordLink />
      </PageHeader>

      <MonthSummary transactions={transactions} month={month} />

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Card index={4} title="Últimos movimientos" href="/historial" linkLabel="Ver historial">
          {recent.length === 0 ? (
            <Empty>Todavía no hay movimientos. Cargá el primero o contale al asistente qué gastaste.</Empty>
          ) : (
            <ul className="-mx-2">
              {recent.map((t) => (
                <li key={t.id}>
                  <Link href={`/${t.id}/edit`} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm ${t.type === "income" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400"}`} aria-hidden="true">
                      {t.type === "income" ? "↙" : "↗"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{t.description || t.category}</span>
                      <span className="block truncate text-xs text-zinc-500">{t.description ? `${t.category} · ` : ""}{formatDate(t.date)}</span>
                    </span>
                    <span className={`shrink-0 text-sm font-semibold tabular-nums ${t.type === "income" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                      {t.type === "income" ? "+" : "−"}{formatMoney(t.amount)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card index={5} title="Presupuestos" href="/presupuestos" linkLabel={watched.length ? "Ver todos" : "Armar uno"}>
          {watched.length === 0 ? (
            <Empty>Sin presupuestos este mes. Ponele un techo a alguna categoría y te avisamos cómo venís.</Empty>
          ) : (
            <ul className="space-y-4">
              {watched.map(({ budget, spent, percent, exceeded }, index) => (
                <li key={budget.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{budget.category}</span>
                    <span className={`shrink-0 text-xs tabular-nums ${exceeded ? "font-medium text-rose-700 dark:text-rose-400" : "text-zinc-500"}`}>
                      {exceeded ? "¡Te pasaste!" : `${Math.round(percent)}%`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="img" aria-label={`${budget.category}: ${Math.round(percent)}% del presupuesto utilizado`}>
                    <div className={`grow-x h-full rounded-full ${exceeded ? "bg-rose-500" : percent >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(percent, 100)}%`, "--i": index } as React.CSSProperties} />
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-zinc-500">{formatMoney(spent)} de {formatMoney(budget.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <MonthCharts transactions={transactions} month={month} index={6} />
    </div>
  );
}

function Card({ index, title, href, linkLabel, children }: { index: number; title: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <section className="rise rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900" style={{ "--i": index } as React.CSSProperties}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link href={href} className="press text-xs font-medium text-brand-700 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200">
          {linkLabel} →
        </Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-zinc-200 p-5 text-center text-sm text-zinc-500 dark:border-zinc-700">{children}</p>;
}
