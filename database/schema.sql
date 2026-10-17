create schema if not exists maison_private;
revoke all on schema maison_private from public, anon, authenticated;
create table public.maison_invitations (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid(),
 slug uuid not null unique default gen_random_uuid(),
 content jsonb not null check (octet_length(content::text) < 1500000),
 published boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index maison_inv_owner on public.maison_invitations(owner_id);
alter table public.maison_invitations enable row level security;
create policy maison_inv_owner on public.maison_invitations for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
grant select,insert,update,delete on public.maison_invitations to authenticated;
revoke all on public.maison_invitations from anon;
create table public.maison_guests (
 id uuid primary key default gen_random_uuid(),
 invitation_id uuid not null references public.maison_invitations(id) on delete cascade,
 token uuid not null unique default gen_random_uuid(),
 name text not null check(length(name) between 1 and 120),
 response text not null default 'pending' check(response in ('pending','yes','no')),
 party_size int not null default 1 check(party_size between 1 and 10),
 note text not null default '' check(length(note)<=1000),
 responded_at timestamptz,
 created_at timestamptz not null default now()
);
create index maison_guest_inv on public.maison_guests(invitation_id);
alter table public.maison_guests enable row level security;
create policy maison_guest_owner on public.maison_guests for all to authenticated using (exists(select 1 from public.maison_invitations i where i.id=invitation_id and i.owner_id=(select auth.uid()))) with check (exists(select 1 from public.maison_invitations i where i.id=invitation_id and i.owner_id=(select auth.uid())));
grant select,insert,update,delete on public.maison_guests to authenticated;
revoke all on public.maison_guests from anon;
create table public.maison_orders (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null,
 invitation_id uuid not null references public.maison_invitations(id) on delete cascade,
 stripe_session_id text unique not null,
 amount int not null check(amount>0),currency text not null check(currency='eur'),
 paid_at timestamptz not null default now()
);
alter table public.maison_orders enable row level security;
create index maison_order_owner on public.maison_orders(owner_id);
create policy maison_order_read on public.maison_orders for select to authenticated using ((select auth.uid())=owner_id);
grant select on public.maison_orders to authenticated;
revoke all on public.maison_orders from anon;
grant all on public.maison_orders to service_role;
-- Capability-scoped public functions deliberately expose only one published invitation.
-- The random 128-bit slug is required; no public listing or guest-list endpoint exists.
create function maison_private.invitation(p_slug uuid,p_token uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.maison_invitations; g public.maison_guests;
begin
 select * into i from public.maison_invitations where slug=p_slug and published;
 if i.id is null then return null; end if;
 if p_token is not null then
  select * into g from public.maison_guests where invitation_id=i.id and token=p_token;
  if g.id is null then return null; end if;
 end if;
 return jsonb_build_object('id',i.id,'slug',i.slug,'content',i.content,'guest',case when g.id is null then null else jsonb_build_object('name',g.name,'response',g.response,'party_size',g.party_size) end);
end $$;
revoke all on function maison_private.invitation(uuid,uuid) from public;
create function public.maison_open(p_slug uuid,p_token uuid default null) returns jsonb language sql security definer set search_path='' as $$ select maison_private.invitation(p_slug,p_token) $$;
revoke all on function public.maison_open(uuid,uuid) from public;
grant execute on function public.maison_open(uuid,uuid) to anon,authenticated;
create function public.maison_respond(p_slug uuid,p_token uuid,p_name text,p_response text,p_party_size int,p_note text default '') returns jsonb
language plpgsql security definer set search_path='' as $$
declare i public.maison_invitations; g public.maison_guests;
begin
 if p_token is null or p_name is null or length(trim(p_name)) not between 1 and 120 or p_response not in ('yes','no') or p_response is null or p_party_size is null or p_party_size not between 1 and 10 or length(coalesce(p_note,''))>1000 then raise exception 'Invalid response'; end if;
 select * into i from public.maison_invitations where slug=p_slug and published for update;
 if i.id is null then raise exception 'Invitation unavailable'; end if;
 if (i.content->>'rsvpDeadline')::date < current_date then raise exception 'The RSVP deadline has passed. Please contact your host.'; end if;
 select * into g from public.maison_guests where invitation_id=i.id and token=p_token;
 if g.id is null and (select count(*) from public.maison_guests where invitation_id=i.id)>=500 then raise exception 'Guest limit reached'; end if;
 if exists(select 1 from public.maison_guests where token=p_token and invitation_id<>i.id) then raise exception 'Invalid guest token'; end if;
 insert into public.maison_guests(invitation_id,token,name,response,party_size,note,responded_at)
 values(i.id,p_token,trim(p_name),p_response,p_party_size,coalesce(p_note,''),now())
 on conflict(token) do update set name=excluded.name,response=excluded.response,party_size=excluded.party_size,note=excluded.note,responded_at=now() where maison_guests.invitation_id=i.id;
 return jsonb_build_object('saved',true);
end $$;
revoke all on function public.maison_respond(uuid,uuid,text,text,int,text) from public;
grant execute on function public.maison_respond(uuid,uuid,text,text,int,text) to anon,authenticated;
