import { formatDate, formatMoney } from "./format";
import { CATEGORIES, type InsightQuery, type Transaction } from "./schemas";

const TOP_LIMIT = 5;

function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
}

function matchCategories(term: string, names: string[]) {
  const needle = fold(term);
  if (!needle) return [];
  const exact = names.filter((name) => fold(name) === needle);
  if (exact.length) return exact;
  const starts = names.filter((name) => fold(name).startsWith(needle));
  if (starts.length) return starts;
  return names.filter((name) => fold(name).includes(needle));
}

function mentions(description: string | null, term: string) {
  return Boolean(description && fold(description).includes(fold(term)));
}

function totalOf(items: Transaction[]) {
  return Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
}

function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function periodPhrase(from: string, to: string) {
  if (from === to) return `el ${formatDate(from)}`;

  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  const lastDay = new Date(toYear, toMonth, 0).getDate();
  const sameMonth = fromYear === toYear && fromMonth === toMonth;

  if (sameMonth && fromDay === 1) {
    const label = new Intl.DateTimeFormat("es-AR", {
      month: "long",
      year: "numeric",
    }).format(new Date(fromYear, fromMonth - 1, 1, 12));
    if (toDay === lastDay) return `en ${label}`;
    return `en ${label}, hasta el ${formatDate(to)}`;
  }

  return `entre el ${formatDate(from)} y el ${formatDate(to)}`;
}

function sentence(period: string, rest: string) {
  return `${period.charAt(0).toUpperCase()}${period.slice(1)} ${rest}`;
}

function scopePhrase(matched: string[] | null, descriptionTerm: string | null) {
  if (matched?.length) return ` en ${formatList(matched)}`;
  if (descriptionTerm) return ` en movimientos que mencionan «${descriptionTerm}»`;
  return "";
}

function emptyReply(
  query: InsightQuery,
  matched: string[] | null,
  descriptionTerm: string | null,
) {
  const noun = query.type === "expense" ? "gastos" : "ingresos";
  const scope = scopePhrase(matched, descriptionTerm);
  return sentence(
    periodPhrase(query.from, query.to),
    `no registraste ${noun}${scope} (total ${formatMoney(0)}).`,
  );
}

function selectItems(transactions: Transaction[], query: InsightQuery) {
  const ofType = transactions.filter(
    (item) =>
      item.type === query.type &&
      item.date >= query.from &&
      item.date <= query.to,
  );
  const term = query.category;
  if (!term) return { items: ofType, matched: null, descriptionTerm: null };

  const names = [
    ...new Set([
      ...CATEGORIES[query.type],
      ...ofType.map((item) => item.category),
    ]),
  ];
  const matched = matchCategories(term, names);
  if (matched.length) {
    const selected = new Set(matched.map(fold));
    return {
      items: ofType.filter((item) => selected.has(fold(item.category))),
      matched,
      descriptionTerm: null,
    };
  }

  return {
    items: ofType.filter((item) => mentions(item.description, term)),
    matched: null,
    descriptionTerm: term,
  };
}

function sumReply(
  items: Transaction[],
  query: InsightQuery,
  matched: string[] | null,
  descriptionTerm: string | null,
) {
  if (items.length === 0) return emptyReply(query, matched, descriptionTerm);
  const verb = query.type === "expense" ? "gastaste" : "cobraste";
  const scope = scopePhrase(matched, descriptionTerm);
  const count = items.length === 1 ? "1 movimiento" : `${items.length} movimientos`;
  return sentence(
    periodPhrase(query.from, query.to),
    `${verb} ${formatMoney(totalOf(items))}${scope} (${count}).`,
  );
}

function topReply(
  items: Transaction[],
  query: InsightQuery,
  matched: string[] | null,
  descriptionTerm: string | null,
) {
  if (items.length === 0) return emptyReply(query, matched, descriptionTerm);

  const byCategory = new Map<string, number>();
  for (const item of items) {
    byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + item.amount);
  }
  const ranked = [...byCategory.entries()]
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
    }))
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category, "es"))
    .slice(0, TOP_LIMIT);

  const [first, ...rest] = ranked;
  const verb = query.type === "expense" ? "gastaste" : "cobraste";
  const lead = sentence(
    periodPhrase(query.from, query.to),
    `lo que más ${verb} fue ${first.category}: ${formatMoney(first.amount)}.`,
  );
  if (rest.length === 0) return lead;
  const others = rest.map((item) => `${item.category} ${formatMoney(item.amount)}`).join(", ");
  return `${lead} Después: ${others}.`;
}

export function answerInsight(transactions: Transaction[], query: InsightQuery) {
  const { items, matched, descriptionTerm } = selectItems(transactions, query);
  return query.kind === "top"
    ? topReply(items, query, matched, descriptionTerm)
    : sumReply(items, query, matched, descriptionTerm);
}
