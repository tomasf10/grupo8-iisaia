-- Esquema para la app de gastos e ingresos.
-- Correr en Supabase: Dashboard > SQL Editor > New query > pegar y Run.
-- Es idempotente: se puede ejecutar más de una vez.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type transaction_type as enum ('income', 'expense');
  end if;
end $$;

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  type        transaction_type not null,
  amount      numeric(12, 2) not null check (amount > 0),
  category    text not null,
  description text,
  date        date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists transactions_date_idx on public.transactions (date desc, created_at desc);
create index if not exists transactions_type_idx on public.transactions (type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- RLS activado sin policies: nadie accede con la anon key.
-- El backend de Next.js usa la service role key, que saltea RLS.
alter table public.transactions enable row level security;

-- Permisos: Supabase ya no otorga automáticamente privilegios sobre tablas
-- nuevas a los roles de la Data API. Solo el backend (service_role) accede.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.transactions to service_role;
revoke all on public.transactions from anon, authenticated;

-- Datos de ejemplo (opcional, descomentar para cargar)
-- insert into public.transactions (type, amount, category, description, date) values
--   ('income',  850000, 'Sueldo',       'Sueldo de septiembre', current_date - 20),
--   ('expense',  45000, 'Supermercado', 'Compra semanal',       current_date - 3),
--   ('expense',  12000, 'Transporte',   'Carga SUBE',           current_date - 1);
