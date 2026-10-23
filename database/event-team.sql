-- Maison event team: the host invites vendors (starting with the planner) into an event.
-- A vendor joins with a private invite link and works in their own workspace on the live event.
-- All access goes through the functions below; the tables are not exposed directly.
-- Run once in the Supabase SQL editor (safe to re-run).

create table if not exists public.maison_event_team (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.maison_invitations(id) on delete cascade,
  category text not null check (category in ('planner','catering','photography','music','flowers','cakes','venue','beauty','decoration')),
  vendor_name text not null default '' check (length(vendor_name) <= 120),
  invite_token uuid not null unique default gen_random_uuid(),
  member_id uuid references auth.users(id) on delete set null,
  status text not null default 'invited' check (status in ('invited','joined')),
  created_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (invitation_id, category)
);
create table if not exists public.maison_event_tasks (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.maison_invitations(id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  due date,
  assignee text not null default 'Planner' check (length(assignee) <= 40),
  done boolean not null default false,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.maison_event_updates (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.maison_invitations(id) on delete cascade,
  body text not null check (length(body) between 1 and 600),
  author_role text not null default 'host',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists maison_team_inv on public.maison_event_team(invitation_id);
create index if not exists maison_team_member on public.maison_event_team(member_id);
create index if not exists maison_tasks_inv on public.maison_event_tasks(invitation_id);
create index if not exists maison_updates_inv on public.maison_event_updates(invitation_id, created_at desc);
alter table public.maison_event_team enable row level security;
alter table public.maison_event_tasks enable row level security;
alter table public.maison_event_updates enable row level security;
revoke all on public.maison_event_team, public.maison_event_tasks, public.maison_event_updates from anon, authenticated;

-- Who may work on an event: its host, or the planner who joined it.
create or replace function maison_private.event_role(p_invitation uuid)
returns text language sql stable security definer set search_path='' as $$
  select case
    when exists(select 1 from public.maison_invitations i where i.id=p_invitation and i.owner_id=(select auth.uid())) then 'host'
    when exists(select 1 from public.maison_event_team t where t.invitation_id=p_invitation and t.member_id=(select auth.uid()) and t.status='joined' and t.category='planner') then 'planner'
    else null end $$;
revoke all on function maison_private.event_role(uuid) from public, anon, authenticated;

-- Host: list the team of an event.
create or replace function public.maison_team(p_invitation uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if maison_private.event_role(p_invitation) is null then raise exception 'Not allowed'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'category',t.category,'vendor_name',t.vendor_name,'status',t.status,
    'invite_token',case when maison_private.event_role(p_invitation)='host' then t.invite_token end) order by t.created_at)
    from public.maison_event_team t where t.invitation_id=p_invitation),'[]'::jsonb);
end $$;

-- Host: invite (or re-invite) a vendor for a category; returns the private invite token.
create or replace function public.maison_team_invite(p_invitation uuid, p_category text, p_vendor_name text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.maison_event_team;
begin
  if maison_private.event_role(p_invitation) is distinct from 'host' then raise exception 'Only the host can invite vendors'; end if;
  insert into public.maison_event_team(invitation_id, category, vendor_name) values (p_invitation, p_category, left(coalesce(p_vendor_name,''),120))
  on conflict (invitation_id, category) do update set vendor_name = case when excluded.vendor_name<>'' then excluded.vendor_name else public.maison_event_team.vendor_name end
  returning * into t;
  return jsonb_build_object('id',t.id,'category',t.category,'status',t.status,'invite_token',t.invite_token);
end $$;

-- Host: remove a vendor from the event (their access ends immediately).
create or replace function public.maison_team_remove(p_team uuid)
returns void language plpgsql security definer set search_path='' as $$
declare inv uuid;
begin
  select invitation_id into inv from public.maison_event_team where id=p_team;
  if inv is null or maison_private.event_role(inv) is distinct from 'host' then raise exception 'Not allowed'; end if;
  delete from public.maison_event_team where id=p_team;
end $$;

-- Vendor: accept an invite link while signed in.
create or replace function public.maison_team_join(p_token uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.maison_event_team;
begin
  if (select auth.uid()) is null then raise exception 'Please sign in first'; end if;
  select * into t from public.maison_event_team where invite_token=p_token for update;
  if t.id is null then raise exception 'This invitation link is no longer valid.'; end if;
  if t.member_id is not null and t.member_id<>(select auth.uid()) then raise exception 'This invitation has already been accepted by another account.'; end if;
  update public.maison_event_team set member_id=(select auth.uid()), status='joined', joined_at=coalesce(joined_at, now()) where id=t.id;
  return jsonb_build_object('invitation_id',t.invitation_id,'category',t.category);
end $$;

-- Vendor: the events I work on.
create or replace function public.maison_my_workspaces()
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('invitation_id',t.invitation_id,'category',t.category,'names',i.content->>'names','date',i.content->>'date','venue',i.content->>'venue') order by i.content->>'date'),'[]'::jsonb)
  from public.maison_event_team t join public.maison_invitations i on i.id=t.invitation_id
  where t.member_id=(select auth.uid()) and t.status='joined' $$;

-- The workspace: everything the planner needs, already filled from the invitation.
-- Guests' private notes, personal links and contact data are NOT included; only meal and allergies.
create or replace function public.maison_workspace(p_invitation uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare r text; i public.maison_invitations; seat jsonb;
begin
  r := maison_private.event_role(p_invitation);
  if r is null then raise exception 'You do not have access to this event.'; end if;
  select * into i from public.maison_invitations where id=p_invitation;
  select data into seat from public.maison_planning where owner_id=i.owner_id and occasion='seating:'||i.id::text;
  return jsonb_build_object(
    'role', r,
    'event', jsonb_build_object('id',i.id,'scene',i.content->>'scene','occasion',i.content->>'occasion','names',i.content->>'names','date',i.content->>'date','time',i.content->>'time',
      'timezone',i.content->>'timezone','venue',i.content->>'venue','address',i.content->>'address','subtitle',i.content->>'subtitle','timeline',coalesce(i.content->'timeline','[]'::jsonb)),
    'guests', coalesce((select jsonb_agg(jsonb_build_object('name',g.name,'reply',g.response,'party',g.party_size,
        'meal',coalesce(substring(g.note from 'Meal preference: ([^\n]+)'),''),
        'allergy',coalesce(substring(g.note from 'Allergies / dietary needs: ([^\n]+)'),''),
        'table',coalesce((select tb->>'name' from jsonb_array_elements(coalesce(seat->'tables','[]'::jsonb)) tb where tb->>'id'=seat->'assignments'->>(g.id::text) limit 1),''))
      order by g.name) from public.maison_guests g where g.invitation_id=i.id),'[]'::jsonb),
    'team', coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'category',t.category,'name',t.vendor_name,'status',t.status) order by t.created_at) from public.maison_event_team t where t.invitation_id=i.id),'[]'::jsonb),
    'tasks', coalesce((select jsonb_agg(jsonb_build_object('id',k.id,'title',k.title,'due',k.due,'who',k.assignee,'done',k.done) order by k.done, k.due nulls last, k.created_at) from public.maison_event_tasks k where k.invitation_id=i.id),'[]'::jsonb),
    'updates', coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'text',u.body,'when',u.created_at,'by',u.author_role) order by u.created_at desc) from public.maison_event_updates u where u.invitation_id=i.id),'[]'::jsonb)
  );
end $$;

-- Tasks shared by host and planner.
create or replace function public.maison_task_save(p_invitation uuid, p_id uuid, p_title text, p_due date, p_assignee text, p_done boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare k public.maison_event_tasks;
begin
  if maison_private.event_role(p_invitation) is null then raise exception 'Not allowed'; end if;
  if p_id is null then
    insert into public.maison_event_tasks(invitation_id,title,due,assignee,done) values (p_invitation, left(p_title,200), p_due, left(coalesce(p_assignee,'Planner'),40), coalesce(p_done,false)) returning * into k;
  else
    update public.maison_event_tasks set title=left(p_title,200), due=p_due, assignee=left(coalesce(p_assignee,'Planner'),40), done=coalesce(p_done,false), updated_at=now()
      where id=p_id and invitation_id=p_invitation returning * into k;
    if k.id is null then raise exception 'Task not found'; end if;
  end if;
  return jsonb_build_object('id',k.id,'title',k.title,'due',k.due,'who',k.assignee,'done',k.done);
end $$;
create or replace function public.maison_task_delete(p_invitation uuid, p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if maison_private.event_role(p_invitation) is null then raise exception 'Not allowed'; end if;
  delete from public.maison_event_tasks where id=p_id and invitation_id=p_invitation;
end $$;

-- Updates: posted once, shown to every guest on the invitation and to the team.
create or replace function public.maison_update_post(p_invitation uuid, p_body text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r text; u public.maison_event_updates;
begin
  r := maison_private.event_role(p_invitation);
  if r is null then raise exception 'Not allowed'; end if;
  if length(trim(coalesce(p_body,''))) not between 1 and 600 then raise exception 'Please write an update of up to 600 characters.'; end if;
  insert into public.maison_event_updates(invitation_id,body,author_role) values (p_invitation, trim(p_body), r) returning * into u;
  return jsonb_build_object('id',u.id,'text',u.body,'when',u.created_at,'by',u.author_role);
end $$;
create or replace function public.maison_update_delete(p_invitation uuid, p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if maison_private.event_role(p_invitation) is null then raise exception 'Not allowed'; end if;
  delete from public.maison_event_updates where id=p_id and invitation_id=p_invitation;
end $$;
-- Guests (no account) read the latest updates of a published invitation.
create or replace function public.maison_public_updates(p_slug uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce((select jsonb_agg(jsonb_build_object('text',u.body,'when',u.created_at) order by u.created_at desc)
    from (select u.* from public.maison_event_updates u join public.maison_invitations i on i.id=u.invitation_id where i.slug=p_slug and i.published order by u.created_at desc limit 10) u),'[]'::jsonb) $$;

revoke all on function public.maison_team(uuid), public.maison_team_invite(uuid,text,text), public.maison_team_remove(uuid), public.maison_team_join(uuid),
  public.maison_my_workspaces(), public.maison_workspace(uuid), public.maison_task_save(uuid,uuid,text,date,text,boolean), public.maison_task_delete(uuid,uuid),
  public.maison_update_post(uuid,text), public.maison_update_delete(uuid,uuid), public.maison_public_updates(uuid) from public;
grant execute on function public.maison_team(uuid), public.maison_team_invite(uuid,text,text), public.maison_team_remove(uuid), public.maison_team_join(uuid),
  public.maison_my_workspaces(), public.maison_workspace(uuid), public.maison_task_save(uuid,uuid,text,date,text,boolean), public.maison_task_delete(uuid,uuid),
  public.maison_update_post(uuid,text), public.maison_update_delete(uuid,uuid) to authenticated;
grant execute on function public.maison_public_updates(uuid) to anon, authenticated;
notify pgrst, 'reload schema';
