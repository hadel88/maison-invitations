-- Maison · Experts can list their own business (venue or service), with up to 4 photos,
-- and receive quote requests and messages. Run once in Supabase → SQL Editor.
-- Touches only new maison_expert_* tables. Safe to run more than once.

-- Who may approve listings (you). After running this file, add yourself once:
--   insert into public.maison_admins(user_id)
--   select id from auth.users where email = 'YOUR-MAISON-LOGIN-EMAIL' on conflict do nothing;
create table if not exists public.maison_admins (user_id uuid primary key);
alter table public.maison_admins enable row level security;
revoke all on public.maison_admins from public, anon, authenticated;
drop policy if exists maison_admins_self on public.maison_admins;
create policy maison_admins_self on public.maison_admins for select to authenticated
  using (user_id = (select auth.uid()));
grant select on public.maison_admins to authenticated;

create or replace function public.maison_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.maison_admins where user_id = auth.uid())
$$;
revoke all on function public.maison_is_admin() from public;
grant execute on function public.maison_is_admin() to anon, authenticated;

-- One listing per expert account
create table if not exists public.maison_expert_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique default auth.uid(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  name text not null check (length(name) between 2 and 120),
  category text not null check (category in ('venues','planners','dining','flowers','photography','bridal','music','cakes','beauty','decoration','family')),
  city text not null check (length(city) between 2 and 80),
  address text not null default '' check (length(address) <= 200),
  description text not null default '' check (length(description) <= 2000),
  services text not null default '' check (length(services) <= 1000),
  price_from text not null default '' check (length(price_from) <= 60),
  phone text not null default '' check (length(phone) <= 40),
  email text not null default '' check (length(email) <= 120),
  website text not null default '' check (length(website) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists maison_expert_listings_find on public.maison_expert_listings(status, category, city);
alter table public.maison_expert_listings enable row level security;

drop policy if exists maison_expert_listings_read on public.maison_expert_listings;
create policy maison_expert_listings_read on public.maison_expert_listings for select to anon, authenticated
  using (status = 'approved' or owner_id = (select auth.uid()) or (select public.maison_is_admin()));
drop policy if exists maison_expert_listings_insert on public.maison_expert_listings;
create policy maison_expert_listings_insert on public.maison_expert_listings for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'pending');
drop policy if exists maison_expert_listings_update on public.maison_expert_listings;
create policy maison_expert_listings_update on public.maison_expert_listings for update to authenticated
  using (owner_id = (select auth.uid()) or (select public.maison_is_admin()))
  with check (owner_id = (select auth.uid()) or (select public.maison_is_admin()));
drop policy if exists maison_expert_listings_delete on public.maison_expert_listings;
create policy maison_expert_listings_delete on public.maison_expert_listings for delete to authenticated
  using (owner_id = (select auth.uid()));
grant select on public.maison_expert_listings to anon, authenticated;
grant insert, update, delete on public.maison_expert_listings to authenticated;

-- An expert who edits an approved listing goes back to review; only an admin can approve or hide.
create or replace function public.maison_expert_listing_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if not public.maison_is_admin() then
    new.owner_id := old.owner_id;
    -- experts can only send their listing back to review, never approve or hide it
    if new.status is distinct from old.status and new.status <> 'pending' then new.status := old.status; end if;
    if old.status = 'approved' and (new.name, new.category, new.city, new.description, new.services)
       is distinct from (old.name, old.category, old.city, old.description, old.services) then
      new.status := 'pending';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists maison_expert_listing_guard on public.maison_expert_listings;
create trigger maison_expert_listing_guard before update on public.maison_expert_listings
  for each row execute function public.maison_expert_listing_guard();

-- Photos: 4 per listing, resized in the browser (thumb for cards, image for the gallery)
create table if not exists public.maison_expert_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.maison_expert_listings(id) on delete cascade,
  owner_id uuid not null default auth.uid(),
  thumb text not null check (thumb like 'data:image/jpeg;base64,%' and octet_length(thumb) < 80000),
  image text not null check (image like 'data:image/jpeg;base64,%' and octet_length(image) < 360000),
  created_at timestamptz not null default now()
);
create index if not exists maison_expert_photos_listing on public.maison_expert_photos(listing_id);
alter table public.maison_expert_photos enable row level security;
drop policy if exists maison_expert_photos_read on public.maison_expert_photos;
create policy maison_expert_photos_read on public.maison_expert_photos for select to anon, authenticated
  using (exists (select 1 from public.maison_expert_listings l where l.id = listing_id
    and (l.status = 'approved' or l.owner_id = (select auth.uid()) or (select public.maison_is_admin()))));
drop policy if exists maison_expert_photos_write on public.maison_expert_photos;
create policy maison_expert_photos_write on public.maison_expert_photos for insert to authenticated
  with check (owner_id = (select auth.uid())
    and exists (select 1 from public.maison_expert_listings l where l.id = listing_id and l.owner_id = (select auth.uid())));
drop policy if exists maison_expert_photos_delete on public.maison_expert_photos;
create policy maison_expert_photos_delete on public.maison_expert_photos for delete to authenticated
  using (owner_id = (select auth.uid()));
grant select on public.maison_expert_photos to anon, authenticated;

-- A new photo on an approved listing sends it back to review
create or replace function public.maison_expert_photo_review() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.maison_expert_listings set status = 'pending' where id = new.listing_id and status = 'approved';
  return new;
end $$;
-- At most 4 photos per listing
create or replace function public.maison_expert_photo_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.listing_id::text));
  if (select count(*) from public.maison_expert_photos where listing_id = new.listing_id) >= 4 then
    raise exception 'A listing can have at most 4 photos.';
  end if;
  return new;
end $$;
drop trigger if exists maison_expert_photo_limit on public.maison_expert_photos;
create trigger maison_expert_photo_limit before insert on public.maison_expert_photos
  for each row execute function public.maison_expert_photo_limit();
drop trigger if exists maison_expert_photo_review on public.maison_expert_photos;
create trigger maison_expert_photo_review after insert on public.maison_expert_photos
  for each row execute function public.maison_expert_photo_review();
grant insert, delete on public.maison_expert_photos to authenticated;

-- Quote requests and conversations
create table if not exists public.maison_expert_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.maison_expert_listings(id) on delete cascade,
  expert_id uuid not null,
  sender_id uuid,
  sender_name text not null check (length(sender_name) between 2 and 80),
  sender_email text not null default '' check (length(sender_email) <= 120),
  sender_phone text not null default '' check (length(sender_phone) <= 40),
  event_date date,
  guests int check (guests is null or guests between 1 and 5000),
  budget text not null default '' check (length(budget) <= 60),
  message text not null check (length(message) between 5 and 3000),
  status text not null default 'new' check (status in ('new', 'answered', 'closed')),
  created_at timestamptz not null default now(),
  check (sender_id is not null or sender_email <> '' or sender_phone <> '')
);
create index if not exists maison_expert_requests_expert on public.maison_expert_requests(expert_id, created_at desc);
create index if not exists maison_expert_requests_sender on public.maison_expert_requests(sender_id, created_at desc);
alter table public.maison_expert_requests enable row level security;
drop policy if exists maison_expert_requests_read on public.maison_expert_requests;
create policy maison_expert_requests_read on public.maison_expert_requests for select to authenticated
  using (expert_id = (select auth.uid()) or sender_id = (select auth.uid()));
drop policy if exists maison_expert_requests_status on public.maison_expert_requests;
create policy maison_expert_requests_status on public.maison_expert_requests for update to authenticated
  using (expert_id = (select auth.uid())) with check (expert_id = (select auth.uid()));
grant select, update(status) on public.maison_expert_requests to authenticated;

-- Sending a request goes through this function: works signed in or not, at most
-- 40 requests per listing per day and 10 per sender per day.
create or replace function public.maison_expert_request(
  p_listing uuid, p_name text, p_email text, p_phone text, p_date date, p_guests int, p_budget text, p_message text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare l record; rid uuid; uid uuid := auth.uid();
begin
  select id, owner_id into l from public.maison_expert_listings where id = p_listing and status = 'approved';
  if not found then raise exception 'This expert is not available.'; end if;
  if uid = l.owner_id then raise exception 'This is your own listing.'; end if;
  if (select count(*) from public.maison_expert_requests where listing_id = p_listing and created_at > now() - interval '1 day') >= 40
     or (uid is not null and (select count(*) from public.maison_expert_requests where sender_id = uid and created_at > now() - interval '1 day') >= 10)
     or (uid is null and coalesce(p_email,'') <> '' and (select count(*) from public.maison_expert_requests where lower(sender_email) = lower(p_email) and created_at > now() - interval '1 day') >= 10)
  then raise exception 'Too many requests today. Please try again tomorrow.'; end if;
  insert into public.maison_expert_requests(listing_id, expert_id, sender_id, sender_name, sender_email, sender_phone, event_date, guests, budget, message)
  values (p_listing, l.owner_id, uid, trim(p_name), trim(coalesce(p_email,'')), trim(coalesce(p_phone,'')), p_date, p_guests, trim(coalesce(p_budget,'')), trim(p_message))
  returning id into rid;
  insert into public.maison_expert_messages(request_id, author_id, from_expert, body) values (rid, uid, false, trim(p_message));
  return rid;
end $$;

create table if not exists public.maison_expert_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maison_expert_requests(id) on delete cascade,
  author_id uuid,
  from_expert boolean not null,
  body text not null check (length(body) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index if not exists maison_expert_messages_req on public.maison_expert_messages(request_id, created_at);
alter table public.maison_expert_messages enable row level security;
drop policy if exists maison_expert_messages_read on public.maison_expert_messages;
create policy maison_expert_messages_read on public.maison_expert_messages for select to authenticated
  using (exists (select 1 from public.maison_expert_requests r where r.id = request_id
    and (r.expert_id = (select auth.uid()) or r.sender_id = (select auth.uid()))));
drop policy if exists maison_expert_messages_write on public.maison_expert_messages;
create policy maison_expert_messages_write on public.maison_expert_messages for insert to authenticated
  with check (author_id = (select auth.uid()) and exists (select 1 from public.maison_expert_requests r where r.id = request_id
    and r.status <> 'closed'
    and ((r.expert_id = (select auth.uid()) and from_expert) or (r.sender_id = (select auth.uid()) and not from_expert))));
grant select, insert on public.maison_expert_messages to authenticated;

revoke all on function public.maison_expert_request(uuid, text, text, text, date, int, text, text) from public;
grant execute on function public.maison_expert_request(uuid, text, text, text, date, int, text, text) to anon, authenticated;

-- Check afterwards: should return 0 rows and no error
-- select id from public.maison_expert_listings limit 1;
