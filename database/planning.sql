create table public.maison_planning(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid(),occasion text not null check(length(occasion) between 1 and 60),
 data jsonb not null default '{}'::jsonb check(octet_length(data::text)<20000),
 updated_at timestamptz not null default now(),unique(owner_id,occasion)
);
alter table public.maison_planning enable row level security;
create policy maison_planning_owner on public.maison_planning for all to authenticated using((select auth.uid())=owner_id) with check((select auth.uid())=owner_id);
grant select,insert,update,delete on public.maison_planning to authenticated;
revoke all on public.maison_planning from anon;
create table public.maison_shortlist(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null default auth.uid(),occasion text not null check(length(occasion) between 1 and 60),
 provider_id text not null check(length(provider_id) between 1 and 300),
 data jsonb not null check(octet_length(data::text)<20000),created_at timestamptz not null default now(),unique(owner_id,occasion,provider_id)
);
alter table public.maison_shortlist enable row level security;
create policy maison_shortlist_owner on public.maison_shortlist for all to authenticated using((select auth.uid())=owner_id) with check((select auth.uid())=owner_id);
grant select,insert,update,delete on public.maison_shortlist to authenticated;
revoke all on public.maison_shortlist from anon;
create table public.maison_discovery_cache(
 cache_key text primary key,data jsonb not null,expires_at timestamptz not null,created_at timestamptz not null default now()
);
alter table public.maison_discovery_cache enable row level security;
revoke all on public.maison_discovery_cache from public,anon,authenticated;
grant all on public.maison_discovery_cache to service_role;
create table public.maison_api_usage(
 user_id uuid not null,day date not null default current_date,count int not null default 1,primary key(user_id,day)
);
alter table public.maison_api_usage enable row level security;
revoke all on public.maison_api_usage from public,anon,authenticated;
grant all on public.maison_api_usage to service_role;
create function public.maison_search_quota(p_user uuid) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(7237420);
 if (select coalesce(sum(count),0) from public.maison_api_usage where day=current_date)>=100 then return false; end if;
 insert into public.maison_api_usage(user_id,day,count) values(p_user,current_date,1)
 on conflict(user_id,day) do update set count=maison_api_usage.count+1 where maison_api_usage.count<20;
 return found;
end $$;
revoke all on function public.maison_search_quota(uuid) from public,anon,authenticated;
grant execute on function public.maison_search_quota(uuid) to service_role;
