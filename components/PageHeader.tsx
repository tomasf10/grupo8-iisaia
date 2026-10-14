import Link from "next/link";

export function NewRecordLink() {
  return (
    <Link
      href="/new"
      className="press rounded-lg bg-brand-950 px-4 py-2 text-sm font-medium text-brand-50 hover:bg-brand-900 dark:bg-brand-300 dark:text-brand-950 dark:hover:bg-brand-200"
    >
      + Nuevo registro
    </Link>
  );
}

export default function PageHeader({ title, subtitle, children }: { title: React.ReactNode; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="rise flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}
