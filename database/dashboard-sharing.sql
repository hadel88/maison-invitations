-- Owner-only RLS on maison_guests remains in force. Guests cannot grant access.
alter table public.maison_guests add column if not exists dashboard_access boolean not null default false;
-- A capability-scoped guest endpoint: no account is required, but BOTH a published
-- invitation slug and its selected guest's random token are required on every read.
create or replace function maison_private.shared_dashboard(p_slug uuid, p_token uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.maison_invitations; g public.maison_guests; p jsonb;
begin
 if p_token is null then return null; end if;
 select * into i from public.maison_invitations where slug=p_slug and published;
 if i.id is null then return null; end if;
 select * into g from public.maison_guests where invitation_id=i.id and token=p_token and dashboard_access;
 if g.id is null then return null; end if;
 select data into p from public.maison_planning where owner_id=i.owner_id and occasion='inv:'||i.id::text;
 return jsonb_build_object(
  'guest',jsonb_build_object('name',g.name),
  'event',jsonb_build_object('names',i.content->>'names','date',i.content->>'date','time',i.content->>'time','timezone',i.content->>'timezone','venue',i.content->>'venue','address',i.content->>'address','language',i.content->>'language','timeline',coalesce(i.content->'timeline','[]'::jsonb)),
  'counts',(select jsonb_build_object('invited',count(*),'attending',coalesce(sum(party_size) filter(where response='yes'),0),'waiting',count(*) filter(where response='pending')) from public.maison_guests where invitation_id=i.id),
  'progress',jsonb_build_object('completed',case when jsonb_typeof(p->'done')='object' then (select count(*) from jsonb_each(p->'done') where value='true'::jsonb) else 0 end),
  'memories',coalesce((select jsonb_agg(x) from (select kind,body,thumb,created_at from public.maison_wall where invitation_id=i.id order by created_at desc limit 60) x),'[]'::jsonb)
 );
end $$;
revoke all on function maison_private.shared_dashboard(uuid,uuid) from public,anon,authenticated;
-- Only this narrow wrapper is exposed; the underlying tables remain owner-only.
create or replace function public.maison_shared_dashboard(p_slug uuid,p_token uuid)
returns jsonb language sql security definer set search_path='' as $$ select maison_private.shared_dashboard(p_slug,p_token) $$;
revoke all on function public.maison_shared_dashboard(uuid,uuid) from public;
grant execute on function public.maison_shared_dashboard(uuid,uuid) to anon,authenticated;
notify pgrst, 'reload schema';
