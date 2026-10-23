-- Maison hall plan: the venue's floor plan (an uploaded, straightened image) with tables placed on it.
-- Host and joined planner can edit it. Its tables ARE the seating-plan tables: saving the hall plan
-- updates the seating plan (seating:<invitation id> in maison_planning), so guest assignment,
-- "Suggest seating" and the guest's "Your table" keep working.
-- Requires database/event-team.sql first. Run once in the Supabase SQL editor (safe to re-run).

create table if not exists public.maison_event_hall (
  invitation_id uuid primary key references public.maison_invitations(id) on delete cascade,
  image text check (image is null or (image like 'data:image/jpeg;base64,%' and length(image) <= 1500000)),
  layout jsonb not null default '{}'::jsonb check (octet_length(layout::text) < 60000),
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now()
);
alter table public.maison_event_hall enable row level security;
revoke all on public.maison_event_hall from anon, authenticated;

-- Read: the plan image, its layout, the seating tables and who is seated at each table.
create or replace function public.maison_hall(p_invitation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.maison_invitations; seat jsonb; h public.maison_event_hall;
begin
  if maison_private.event_role(p_invitation) is null then raise exception 'You do not have access to this event.'; end if;
  select * into i from public.maison_invitations where id=p_invitation;
  select data into seat from public.maison_planning where owner_id=i.owner_id and occasion='seating:'||i.id::text;
  select * into h from public.maison_event_hall where invitation_id=p_invitation;
  return jsonb_build_object(
    'image', h.image,
    'layout', coalesce(h.layout,'{}'::jsonb),
    'tables', coalesce(seat->'tables','[]'::jsonb),
    'seated', coalesce((select jsonb_object_agg(x.tid, x.people) from (
        select a.value as tid, jsonb_agg(jsonb_build_object('name',g.name,'party',g.party_size) order by g.name) as people
        from jsonb_each_text(coalesce(seat->'assignments','{}'::jsonb)) a
        join public.maison_guests g on g.id::text=a.key and g.invitation_id=i.id and g.response='yes'
        group by a.value) x),'{}'::jsonb)
  );
end $$;

-- Save: p_image null keeps the current image, '' removes it. p_tables = [{id,name,capacity}] replaces the
-- seating tables; assignments to removed tables are released, the rest are kept.
create or replace function public.maison_hall_save(p_invitation uuid, p_image text, p_layout jsonb, p_tables jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.maison_invitations; seat jsonb; ids text[]; kept jsonb; t jsonb; used int;
begin
  if maison_private.event_role(p_invitation) is null then raise exception 'You do not have access to this event.'; end if;
  if jsonb_typeof(p_tables) <> 'array' or jsonb_array_length(p_tables) > 60 then raise exception 'A hall plan can have up to 60 tables.'; end if;
  for t in select value from jsonb_array_elements(p_tables) loop
    if coalesce(t->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or length(trim(coalesce(t->>'name',''))) not between 1 and 60
      or coalesce(t->>'capacity','') !~ '^[0-9]{1,2}$' or (t->>'capacity')::int not between 1 and 50
    then raise exception 'Every table needs a name and 1–50 seats.'; end if;
  end loop;
  select * into i from public.maison_invitations where id=p_invitation;
  select coalesce(array_agg(value->>'id'),'{}') into ids from jsonb_array_elements(p_tables);
  if (select count(distinct x) from unnest(ids) x) <> coalesce(array_length(ids,1),0) then raise exception 'Two tables have the same ID. Please reload.'; end if;
  select data into seat from public.maison_planning where owner_id=i.owner_id and occasion='seating:'||i.id::text for update;
  select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) into kept from jsonb_each(coalesce(seat->'assignments','{}'::jsonb)) where value #>> '{}' = any(ids);
  for t in select value from jsonb_array_elements(p_tables) loop
    select coalesce(sum(g.party_size),0) into used from jsonb_each_text(kept) a join public.maison_guests g on g.id::text=a.key and g.invitation_id=i.id and g.response='yes' where a.value=t->>'id';
    if used > (t->>'capacity')::int then raise exception '% has % guests seated but only % seats. Increase its seats or move a party first.', t->>'name', used, t->>'capacity'; end if;
  end loop;
  insert into public.maison_planning(owner_id, occasion, data, updated_at)
    values (i.owner_id, 'seating:'||i.id::text, jsonb_build_object('tables', (select coalesce(jsonb_agg(jsonb_build_object('id',v->>'id','name',trim(v->>'name'),'capacity',(v->>'capacity')::int)),'[]'::jsonb) from jsonb_array_elements(p_tables) v), 'assignments', kept), now())
    on conflict (owner_id, occasion) do update set data = excluded.data, updated_at = now();
  insert into public.maison_event_hall(invitation_id, image, layout, updated_by, updated_at)
    values (p_invitation, nullif(p_image,''), coalesce(p_layout,'{}'::jsonb), (select auth.uid()), now())
    on conflict (invitation_id) do update set
      image = case when p_image is null then public.maison_event_hall.image else nullif(p_image,'') end,
      layout = excluded.layout, updated_by = excluded.updated_by, updated_at = now();
  return public.maison_hall(p_invitation);
end $$;

revoke all on function public.maison_hall(uuid), public.maison_hall_save(uuid,text,jsonb,jsonb) from public;
grant execute on function public.maison_hall(uuid), public.maison_hall_save(uuid,text,jsonb,jsonb) to authenticated;
notify pgrst, 'reload schema';
