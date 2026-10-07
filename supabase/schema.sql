-- BetTrack Pro: datos en la nube
-- Se ejecuta una vez en Supabase → SQL Editor → New query → pegar → Run.
-- Es seguro volver a ejecutarlo.

-- Una fila por apuesta, bankroll o casa de apuestas de cada usuario.
-- "data" guarda el objeto tal cual lo usa la app, así añadir campos nuevos no requiere tocar la base de datos.
create table if not exists public.items (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text        not null check (kind in ('bet', 'bankroll', 'bookmaker')),
  id         text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, id)
);

-- Seguridad: cada usuario solo puede ver y tocar sus propias filas
alter table public.items enable row level security;

drop policy if exists "items_select_own" on public.items;
drop policy if exists "items_insert_own" on public.items;
drop policy if exists "items_update_own" on public.items;
drop policy if exists "items_delete_own" on public.items;

create policy "items_select_own" on public.items for select to authenticated using ((select auth.uid()) = user_id);
create policy "items_insert_own" on public.items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "items_update_own" on public.items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "items_delete_own" on public.items for delete to authenticated using ((select auth.uid()) = user_id);

-- Cambios en tiempo real (lo que metes en el móvil aparece en el ordenador)
alter table public.items replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'items'
  ) then
    alter publication supabase_realtime add table public.items;
  end if;
end $$;
