-- Maison · Wall & Photos for each invitation (package Invitation & Journey)
-- Run once in Supabase → SQL Editor. Touches only this new Maison table.
-- Safe to run more than once.

create table if not exists public.maison_wall (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  invitation_id uuid not null references public.maison_invitations(id) on delete cascade,
  kind text not null check (kind in ('post', 'photo')),
  body text not null default '' check (length(body) <= 2000),
  -- photos are resized in the browser: a small thumbnail for lists, a larger image on demand
  thumb text check (thumb is null or (thumb like 'data:image/jpeg;base64,%' and octet_length(thumb) < 120000)),
  image text check (image is null or (image like 'data:image/jpeg;base64,%' and octet_length(image) < 900000)),
  created_at timestamptz not null default now()
);
create index if not exists maison_wall_inv on public.maison_wall(invitation_id, created_at desc);
alter table public.maison_wall enable row level security;

drop policy if exists maison_wall_owner on public.maison_wall;
create policy maison_wall_owner on public.maison_wall for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and exists (select 1 from public.maison_invitations i
                where i.id = invitation_id and i.owner_id = (select auth.uid()))
  );
grant select, insert, delete on public.maison_wall to authenticated;
revoke all on public.maison_wall from anon;

-- Check afterwards: should return 0 rows and no error
-- select id from public.maison_wall limit 1;
