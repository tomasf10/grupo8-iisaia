-- Esquema para la app de gastos e ingresos (multiusuario con Supabase Auth).
-- Correr en Supabase: Dashboard > SQL Editor > New query > pegar y Run.
-- Es idempotente: se puede ejecutar más de una vez (también sobre la versión
-- anterior sin usuarios).

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type transaction_type as enum ('income', 'expense');
  end if;
end $$;

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type        transaction_type not null,
  amount      numeric(12, 2) not null check (amount > 0),
  category    text not null,
  description text,
  date        date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Migración desde la versión sin usuarios: agrega user_id si no existe.
alter table public.transactions
  add column if not exists user_id uuid default auth.uid()
  references auth.users (id) on delete cascade;

-- Los registros viejos no tienen dueño y quedan invisibles para todos.
-- Para asignárselos a un usuario (después de que haya ingresado una vez):
-- update public.transactions set user_id = (select id from auth.users where email = 'vos@ejemplo.com')
--   where user_id is null;
-- O para borrarlos:
-- delete from public.transactions where user_id is null;

-- user_id obligatorio (solo si ya no quedan registros sin dueño).
do $$
begin
  if not exists (select 1 from public.transactions where user_id is null) then
    alter table public.transactions alter column user_id set not null;
  end if;
end $$;

drop index if exists public.transactions_date_idx;
drop index if exists public.transactions_type_idx;
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc, created_at desc);

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

-- RLS: cada usuario autenticado solo ve y modifica sus propios registros.
alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Permisos: Supabase ya no otorga automáticamente privilegios sobre tablas
-- nuevas a los roles de la Data API. Usuarios logueados sí (filtrados por RLS),
-- anónimos no.
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.transactions to authenticated, service_role;
revoke all on public.transactions from anon;
