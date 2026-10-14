import { formatMoney } from "@/lib/format";
import { monthLabel, recentMonths, shiftMonth, totals } from "@/lib/months";
import type { Transaction } from "@/lib/schemas";

type Props = { transactions: Transaction[]; month: string };

export function MonthSummary({ transactions, month }: Props) {
  const previousMonth = shiftMonth(month, -1);
  const current = totals(transactions.filter((t) => t.date.startsWith(month)));
  const previous = totals(transactions.filter((t) => t.date.startsWith(previousMonth)));

  return (
    <section aria-label={`Resumen de ${monthLabel(month)}`} className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium capitalize text-zinc-600 dark:text-zinc-400">
          Resumen de {monthLabel(month)}
        </h2>
        <p className="text-xs text-zinc-500">Comparado con {monthLabel(previousMonth)}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat index={1} label="Ingresos" value={current.income} previous={previous.income} tone="text-emerald-700 dark:text-emerald-400" />
        <Stat index={2} label="Gastos" value={current.expense} previous={previous.expense} tone="text-rose-700 dark:text-rose-400" />
        <Stat index={3} label="Balance" value={current.balance} previous={previous.balance} tone={current.balance < 0 ? "text-rose-700 dark:text-rose-400" : ""} />
      </div>
    </section>
  );
}

export function MonthCharts({ transactions, month, index = 0 }: Props & { index?: number }) {
  const current = transactions.filter((t) => t.date.startsWith(month));
  const expenseTotal = totals(current).expense;
  const categoryExpenses = current
    .filter((t) => t.type === "expense")
    .reduce<Record<string, number>>((result, transaction) => {
      result[transaction.category] = (result[transaction.category] ?? 0) + transaction.amount;
      return result;
    }, {});
  const categoryData = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1]);
  const trendData = recentMonths(month, 6).map((item) => ({
    month: item,
    label: monthLabel(item, { month: "short" }),
    ...totals(transactions.filter((t) => t.date.startsWith(item))),
  }));
  const max = Math.max(...trendData.flatMap((entry) => [entry.income, entry.expense]), 1);

  return (
    <section className="grid gap-4 lg:grid-cols-2" aria-label="Gráficos financieros">
      <article className="rise rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900" style={{ "--i": index } as React.CSSProperties}>
        <h2 className="text-sm font-semibold">Gastos por categoría</h2>
        <p className="mb-4 mt-1 text-xs capitalize text-zinc-500">{monthLabel(month)}</p>
        {categoryData.length === 0 ? (
          <ChartEmpty message="No hay gastos registrados en este mes." />
        ) : (
          <ul className="space-y-3">
            {categoryData.map(([category, amount], barIndex) => {
              const percent = amount / expenseTotal * 100;
              return (
                <li key={category}>
                  <div className="mb-1 flex justify-between gap-3 text-xs">
                    <span className="truncate">{category}</span>
                    <span className="shrink-0 tabular-nums text-zinc-500">{formatMoney(amount)} · {percent.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="img" aria-label={`${category}: ${percent.toFixed(1)}% de los gastos`}>
                    <div className="grow-x h-full rounded-full bg-rose-500" style={{ width: `${percent}%`, "--i": barIndex } as React.CSSProperties} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </article>

      <article className="rise rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900" style={{ "--i": index + 1 } as React.CSSProperties}>
        <h2 className="text-sm font-semibold">Ingresos y gastos</h2>
        <p className="mb-4 mt-1 text-xs text-zinc-500">Últimos 6 meses hasta {monthLabel(month)}</p>
        {trendData.every((item) => item.income === 0 && item.expense === 0) ? (
          <ChartEmpty message="Todavía no hay movimientos en este período." />
        ) : (
          <>
            <div className="mb-3 flex gap-4 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Ingresos</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-rose-500" />Gastos</span>
            </div>
            <div className="grid h-40 grid-cols-6 items-end gap-2" role="img" aria-label="Gráfico de barras de ingresos y gastos de los últimos seis meses">
              {trendData.map((item, barIndex) => {
                const incomeHeight = item.income ? Math.max(item.income / max * 100, 3) : 0;
                const expenseHeight = item.expense ? Math.max(item.expense / max * 100, 3) : 0;
                return (
                  <div key={item.month} className="flex h-full min-w-0 flex-col items-center justify-end gap-1">
                    <div className="flex h-full w-full items-end justify-center gap-1">
                      <div title={`Ingresos: ${formatMoney(item.income)}`} className="grow-y w-3 rounded-t bg-emerald-500" style={{ height: `${incomeHeight}%`, "--i": barIndex } as React.CSSProperties} />
                      <div title={`Gastos: ${formatMoney(item.expense)}`} className="grow-y w-3 rounded-t bg-rose-500" style={{ height: `${expenseHeight}%`, "--i": barIndex } as React.CSSProperties} />
                    </div>
                    <span className="text-[10px] capitalize text-zinc-500">{item.label.replace(".", "")}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </article>
    </section>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return <p className="flex h-40 items-center justify-center rounded-lg border border-dashed border-zinc-200 px-4 text-center text-sm text-zinc-500 dark:border-zinc-700">{message}</p>;
}

function Stat({ index, label, value, previous, tone }: { index: number; label: string; value: number; previous: number; tone: string }) {
  const delta = value - previous;
  const change = previous === 0
    ? value === 0 ? "Sin cambios" : "Nuevo este mes"
    : `${delta > 0 ? "+" : ""}${((delta / Math.abs(previous)) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}% vs. mes anterior`;

  return (
    <div className="rise rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900" style={{ "--i": index } as React.CSSProperties}>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone}`}>
        {formatMoney(value)}
      </p>
      <p className={`mt-1 text-xs ${delta > 0 ? "text-emerald-700 dark:text-emerald-400" : delta < 0 ? "text-rose-700 dark:text-rose-400" : "text-zinc-500"}`}>
        {change}
      </p>
    </div>
  );
}
