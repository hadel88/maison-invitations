-- Guest contributions retain invitation-owner RLS and use a selected guest capability.
alter table public.maison_wall add column if not exists contributor_guest_id uuid references public.maison_guests(id) on delete set null;
create index if not exists maison_wall_contributor on public.maison_wall(contributor_guest_id,created_at);

create or replace function maison_private.guest_photo_add(p_slug uuid,p_token uuid,p_image text,p_thumb text,p_caption text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.maison_invitations; g public.maison_guests; w public.maison_wall;
begin
 select * into i from public.maison_invitations where slug=p_slug and published for update;
 if i.id is null then return null; end if;
 select * into g from public.maison_guests where invitation_id=i.id and token=p_token and dashboard_access;
 if g.id is null then return null; end if;
 if length(coalesce(p_caption,''))>500 then raise exception 'Please keep your caption under 500 characters'; end if;
 if p_image is null and p_thumb is null then
   if length(trim(coalesce(p_caption,'')))<1 then raise exception 'Please write a wish'; end if;
 else
   if p_image is null or p_thumb is null or p_image !~ '^data:image/jpeg;base64,/9j/[A-Za-z0-9+/=]+$' or p_thumb !~ '^data:image/jpeg;base64,/9j/[A-Za-z0-9+/=]+$' or octet_length(p_image)>=900000 or octet_length(p_thumb)>=60000 then raise exception 'Please choose a valid JPEG photo'; end if;
 end if;
 if (select count(*) from public.maison_wall where invitation_id=i.id and kind='photo')>=300 then raise exception 'This celebration has reached its 300 photo limit'; end if;
 if (select count(*) from public.maison_wall where contributor_guest_id=g.id and created_at>now()-interval '1 minute')>=10 then raise exception 'Please wait a minute before adding more photos'; end if;
 if (select count(*) from public.maison_wall where contributor_guest_id=g.id)>=50 then raise exception 'You have contributed 50 photos. Ask your host to add more'; end if;
 if (select count(*) from public.maison_wall where invitation_id=i.id)>=500 then raise exception 'This celebration has reached its memory limit'; end if;
 insert into public.maison_wall(owner_id,invitation_id,kind,body,thumb,image,contributor_guest_id) values(i.owner_id,i.id,case when p_image is null then 'post' else 'photo' end,coalesce(p_caption,''),p_thumb,p_image,g.id) returning * into w;
 return jsonb_build_object('id',w.id,'kind',w.kind,'body',w.body,'thumb',w.thumb,'created_at',w.created_at);
end $$;
revoke all on function maison_private.guest_photo_add(uuid,uuid,text,text,text) from public,anon,authenticated;
create or replace function public.maison_guest_photo_add(p_slug uuid,p_token uuid,p_image text,p_thumb text,p_caption text default '') returns jsonb language sql security definer set search_path='' as $$ select maison_private.guest_photo_add(p_slug,p_token,p_image,p_thumb,p_caption) $$;
revoke all on function public.maison_guest_photo_add(uuid,uuid,text,text,text) from public;
grant execute on function public.maison_guest_photo_add(uuid,uuid,text,text,text) to anon,authenticated;

create or replace function maison_private.guest_photo_read(p_slug uuid,p_token uuid,p_photo uuid)
returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('id',w.id,'image',w.image) from public.maison_wall w
 join public.maison_invitations i on i.id=w.invitation_id and i.published
 join public.maison_guests g on g.invitation_id=i.id and g.dashboard_access
 where i.slug=p_slug and g.token=p_token and w.id=p_photo and w.kind='photo'
$$;
revoke all on function maison_private.guest_photo_read(uuid,uuid,uuid) from public,anon,authenticated;
create or replace function public.maison_guest_photo_read(p_slug uuid,p_token uuid,p_photo uuid) returns jsonb language sql security definer set search_path='' as $$ select maison_private.guest_photo_read(p_slug,p_token,p_photo) $$;
revoke all on function public.maison_guest_photo_read(uuid,uuid,uuid) from public;
grant execute on function public.maison_guest_photo_read(uuid,uuid,uuid) to anon,authenticated;

create or replace function maison_private.shared_dashboard(p_slug uuid,p_token uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.maison_invitations; g public.maison_guests; p jsonb; seats jsonb; my_table text;
begin
 if p_token is null then return null; end if;
 select * into i from public.maison_invitations where slug=p_slug and published;
 if i.id is null then return null; end if;
 select * into g from public.maison_guests where invitation_id=i.id and token=p_token and dashboard_access;
 if g.id is null then return null; end if;
 select data into p from public.maison_planning where owner_id=i.owner_id and occasion='inv:'||i.id::text;
 select data into seats from public.maison_planning where owner_id=i.owner_id and occasion='seating:'||i.id::text;
 if g.response='yes' then select t->>'name' into my_table from jsonb_array_elements(coalesce(seats->'tables','[]'::jsonb)) t where t->>'id'=seats->'assignments'->>g.id::text limit 1; end if;
 return jsonb_build_object(
  'guest',jsonb_build_object('name',g.name,'table',my_table),
  'event',jsonb_build_object('names',i.content->>'names','date',i.content->>'date','time',i.content->>'time','timezone',i.content->>'timezone','venue',i.content->>'venue','address',i.content->>'address','language',i.content->>'language','timeline',coalesce(i.content->'timeline','[]'::jsonb),'albumStyle',i.content->>'albumStyle'),
  'counts',(select jsonb_build_object('invited',count(*),'attending',coalesce(sum(party_size) filter(where response='yes'),0),'waiting',count(*) filter(where response='pending')) from public.maison_guests where invitation_id=i.id),
  'progress',jsonb_build_object('completed',case when jsonb_typeof(p->'done')='object' then (select count(*) from jsonb_each(p->'done') where value='true'::jsonb) else 0 end),
  'memories',coalesce((select jsonb_agg(x) from (select id,kind,body,case when row_number() over(order by created_at desc)<=24 then thumb else null end as thumb,created_at from public.maison_wall where invitation_id=i.id order by created_at desc limit 300) x),'[]'::jsonb)
 );
end $$;
notify pgrst,'reload schema';
