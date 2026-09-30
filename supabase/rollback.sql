-- Rollback de supabase/schema.sql.
-- Correr en Supabase: Dashboard > SQL Editor > New query > pegar y Run.
--
-- Es defensivo: antes de borrar verifica que los objetos sean los que creó
-- schema.sql. Si algo parece preexistente, NO lo borra y avisa (o aborta todo).
-- Corre dentro de una transacción: si algo falla, no se aplica ningún cambio.
--
-- No toca: la extensión pgcrypto ni los grants sobre el schema public
-- (Supabase los trae por defecto).

begin;

-- 1) Tabla budgets agregada por la versión actual de schema.sql.
do $$
declare
  -- Cambiar a true para borrar los presupuestos existentes.
  force_delete_rows constant boolean := false;
  cols text[];
  row_count bigint;
begin
  if to_regclass('public.budgets') is null then
    raise notice 'public.budgets no existe: nada que borrar.';
    return;
  end if;

  select array_agg(column_name::text order by column_name) into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'budgets';

  if cols is distinct from array['amount','category','created_at','id','month','updated_at','user_id'] then
    raise exception
      'public.budgets tiene columnas inesperadas (%). Parece una tabla preexistente: no se borra nada. Revisala a mano.',
      cols;
  end if;

  execute 'select count(*) from public.budgets' into row_count;
  if row_count > 0 and not force_delete_rows then
    raise exception
      'public.budgets tiene % filas. Revisalas y, si se pueden perder, poné force_delete_rows := true y volvé a correr.',
      row_count;
  end if;

  drop table public.budgets;
  raise notice 'Tabla public.budgets borrada (% filas).', row_count;
end $$;

-- 2) Tabla transactions (con ella se van el trigger, las policies RLS,
--    los índices y los grants de la tabla).
do $$
declare
  -- Cambiar a true para borrar la tabla aunque tenga filas.
  force_delete_rows constant boolean := false;
  cols text[];
  row_count bigint;
begin
  if to_regclass('public.transactions') is null then
    raise notice 'public.transactions no existe: nada que borrar.';
    return;
  end if;

  select array_agg(column_name::text order by column_name) into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'transactions';

  -- Columnas de schema.sql (versión con usuarios y versión anterior).
  if cols is distinct from array['amount','category','created_at','date','description','id','type','updated_at','user_id']
     and cols is distinct from array['amount','category','created_at','date','description','id','type','updated_at'] then
    raise exception
      'public.transactions tiene columnas que schema.sql no crea (%). Parece una tabla preexistente: no se borra nada. Revisala a mano.',
      cols;
  end if;

  execute 'select count(*) from public.transactions' into row_count;
  if row_count > 0 and not force_delete_rows then
    raise exception
      'public.transactions tiene % filas. Revisalas y, si se pueden perder, poné force_delete_rows := true y volvé a correr.',
      row_count;
  end if;

  -- Sin cascade: si otra tabla la referencia, falla y no se borra nada.
  drop table public.transactions;
  raise notice 'Tabla public.transactions borrada (% filas).', row_count;
end $$;

-- 3) Función set_updated_at: solo si ningún otro trigger la usa.
do $$
begin
  if to_regprocedure('public.set_updated_at()') is null then
    raise notice 'public.set_updated_at() no existe.';
  elsif exists (
    select 1 from pg_trigger
    where tgfoid = 'public.set_updated_at()'::regprocedure and not tgisinternal
  ) then
    raise notice 'public.set_updated_at() la usan otros triggers: no se borra. schema.sql pudo haber reemplazado su cuerpo; revisala.';
  else
    drop function public.set_updated_at();
    raise notice 'Función public.set_updated_at() borrada.';
  end if;
end $$;

-- 4) Tipo transaction_type: solo si nada más lo usa.
do $$
begin
  if to_regtype('public.transaction_type') is null then
    raise notice 'public.transaction_type no existe.';
    return;
  end if;
  drop type public.transaction_type;
  raise notice 'Tipo public.transaction_type borrado.';
exception
  when dependent_objects_still_exist then
    raise notice 'public.transaction_type lo usan otros objetos: no se borra.';
end $$;

commit;
