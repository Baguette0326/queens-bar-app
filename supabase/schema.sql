-- Ritual MVP schema
-- Run this in Supabase SQL Editor after reviewing it.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('frosh', 'frec', 'upper_year', 'other');
create type public.difficulty_level as enum ('easy', 'medium', 'hard', 'legendary');
create type public.plan_status as enum ('upcoming', 'ongoing', 'ended');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar text not null default 'gear',
  role public.user_role not null default 'frosh',
  faculty text not null default 'Engineering',
  program text,
  year_label text,
  default_area text,
  bio text,
  completion_visibility text not null default 'public',
  xp integer not null default 0,
  tier text not null default 'Froshling',
  username_changed_at timestamptz,
  accepted_guidelines_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalog_bars (
  id text primary key,
  name text not null,
  category text not null default 'Shenanigans',
  description text not null,
  instructions text not null,
  wiki_url text not null,
  difficulty public.difficulty_level not null default 'medium',
  xp integer not null default 200,
  tags text[] not null default '{}',
  common_locations text[] not null default '{}',
  published boolean not null default true,
  reviewed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  catalog_bar_id text not null references public.catalog_bars(id),
  started_by uuid not null references public.profiles(id),
  location_name text not null,
  location_detail text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  cap integer,
  note text,
  visibility text not null default 'public' check (visibility in ('public', 'friends')),
  status public.plan_status not null default 'upcoming',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cap_positive check (cap is null or cap > 0),
  constraint end_after_start check (ends_at > starts_at)
);

create table public.plan_attendees (
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (plan_id, user_id)
);

create table public.bar_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  catalog_bar_id text not null references public.catalog_bars(id) on delete cascade,
  notify_on_plan boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, catalog_bar_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.dm_threads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dm_members (
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

create table public.plan_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete cascade,
  catalog_bar_id text references public.catalog_bars(id) on delete cascade,
  dm_thread_id uuid references public.dm_threads(id) on delete cascade,
  kind text not null default 'pinned_bar_plan',
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.bar_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  catalog_bar_id text not null references public.catalog_bars(id),
  plan_id uuid references public.plans(id) on delete set null,
  confirmed_at timestamptz not null default now(),
  xp_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, catalog_bar_id)
);

create table public.tier_thresholds (
  tier text primary key,
  min_xp integer not null unique
);

insert into public.tier_thresholds (tier, min_xp)
values
  ('Froshling', 0),
  ('Patch Collector', 1000),
  ('Lore Bearer', 3000),
  ('Campus Legend', 6000)
on conflict (tier) do nothing;

alter table public.profiles enable row level security;
alter table public.catalog_bars enable row level security;
alter table public.plans enable row level security;
alter table public.plan_attendees enable row level security;
alter table public.bar_interests enable row level security;
alter table public.chat_messages enable row level security;
alter table public.dm_threads enable row level security;
alter table public.dm_members enable row level security;
alter table public.dm_messages enable row level security;
alter table public.friend_requests enable row level security;
alter table public.plan_notifications enable row level security;
alter table public.bar_completions enable row level security;
alter table public.tier_thresholds enable row level security;

grant select, insert, update, delete on public.bar_interests to authenticated;
grant select, update on public.plan_notifications to authenticated;
grant select, insert on public.chat_messages to authenticated;
grant select, insert, update on public.plan_attendees to authenticated;
grant select on public.dm_threads to authenticated;
grant select on public.dm_members to authenticated;
grant select, insert on public.dm_messages to authenticated;
grant select, insert, update, delete on public.friend_requests to authenticated;
grant select, insert, delete on public.bar_completions to authenticated;

create index if not exists chat_messages_plan_created_idx
on public.chat_messages (plan_id, created_at);

create index if not exists dm_members_user_idx
on public.dm_members(user_id);

create index if not exists dm_messages_thread_created_idx
on public.dm_messages(thread_id, created_at);

create unique index if not exists friend_requests_pair_unique_idx
on public.friend_requests (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
)
where status in ('pending', 'accepted');

create index if not exists friend_requests_addressee_status_idx
on public.friend_requests(addressee_id, status, created_at desc);

create index if not exists plan_notifications_user_created_idx
on public.plan_notifications (user_id, created_at desc);

create index if not exists plan_notifications_dm_thread_created_idx
on public.plan_notifications(dm_thread_id, created_at desc);

create or replace function public.is_dm_member(target_thread_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.dm_members
    where thread_id = target_thread_id
      and user_id = auth.uid()
  );
$$;

create policy "profiles are public readable"
on public.profiles for select
using (suspended_at is null);

create policy "users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "published catalog bars are readable"
on public.catalog_bars for select
using (published = true);

create or replace function public.can_view_plan(target_plan_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.plans visible_plan
    where visible_plan.id = target_plan_id
      and (
        visible_plan.visibility = 'public'
        or auth.uid() = visible_plan.started_by
        or exists (
          select 1
          from public.plan_attendees attendee
          where attendee.plan_id = visible_plan.id
            and attendee.user_id = auth.uid()
            and attendee.left_at is null
        )
        or exists (
          select 1
          from public.friend_requests friendship
          where friendship.status = 'accepted'
            and (
              (friendship.requester_id = auth.uid() and friendship.addressee_id = visible_plan.started_by)
              or (friendship.addressee_id = auth.uid() and friendship.requester_id = visible_plan.started_by)
            )
        )
      )
  );
$$;

grant execute on function public.can_view_plan(uuid) to authenticated;

create policy "plans are readable"
on public.plans for select
using (public.can_view_plan(id));

create policy "authenticated users can create plans"
on public.plans for insert
with check (auth.uid() = started_by);

create policy "starters can cancel own plans"
on public.plans
for update
to authenticated
using (auth.uid() = started_by)
with check (
  auth.uid() = started_by
  and status = 'ended'::public.plan_status
);

create policy "attendees are readable"
on public.plan_attendees for select
using (public.can_view_plan(plan_id));

create policy "users can join as themselves"
on public.plan_attendees for insert
with check (auth.uid() = user_id);

create policy "users can leave as themselves"
on public.plan_attendees for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can read own bar interests"
on public.bar_interests for select
using (auth.uid() = user_id);

create policy "users can pin bars for themselves"
on public.bar_interests for insert
with check (auth.uid() = user_id);

create policy "users can update own bar interests"
on public.bar_interests for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can unpin own bars"
on public.bar_interests for delete
using (auth.uid() = user_id);

create policy "joined users can read plan chat"
on public.chat_messages for select
using (
  exists (
    select 1 from public.plan_attendees
    where plan_attendees.plan_id = chat_messages.plan_id
      and plan_attendees.user_id = auth.uid()
      and plan_attendees.left_at is null
  )
);

create policy "joined users can send plan chat"
on public.chat_messages for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.plan_attendees
    where plan_attendees.plan_id = chat_messages.plan_id
      and plan_attendees.user_id = auth.uid()
      and plan_attendees.left_at is null
  )
);

create policy "members can read own dm threads"
on public.dm_threads for select
using (public.is_dm_member(id));

create policy "members can read own dm members"
on public.dm_members for select
using (public.is_dm_member(thread_id));

create policy "members can read own dm messages"
on public.dm_messages for select
using (public.is_dm_member(thread_id));

create policy "members can send own dm messages"
on public.dm_messages for insert
with check (
  auth.uid() = sender_id
  and public.is_dm_member(thread_id)
);

create policy "users can read own friend requests"
on public.friend_requests for select
using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "users can send friend requests"
on public.friend_requests for insert
with check (
  auth.uid() = requester_id
  and requester_id <> addressee_id
  and status = 'pending'
);

create policy "users can respond to incoming friend requests"
on public.friend_requests for update
using (auth.uid() = addressee_id)
with check (auth.uid() = addressee_id);

create policy "users can remove own friendships"
on public.friend_requests for delete
using (
  (status = 'accepted' and (auth.uid() = requester_id or auth.uid() = addressee_id))
  or (status = 'pending' and auth.uid() = requester_id)
);

create policy "users can read own notifications"
on public.plan_notifications for select
using (auth.uid() = user_id);

create policy "users can mark own notifications read"
on public.plan_notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can read visible completions"
on public.bar_completions for select
using (true);

create policy "users can create own completions"
on public.bar_completions for insert
with check (auth.uid() = user_id);

create policy "users can delete own completions"
on public.bar_completions for delete
using (auth.uid() = user_id);

create policy "tier thresholds are readable"
on public.tier_thresholds for select
using (true);

create or replace function public.get_or_create_dm_thread(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_thread_id uuid;
  new_thread_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if current_user_id = other_user_id then
    raise exception 'Cannot DM yourself';
  end if;

  if not exists (
    select 1
    from public.friend_requests friendship
    where friendship.status = 'accepted'
      and (
        (friendship.requester_id = current_user_id and friendship.addressee_id = other_user_id)
        or (friendship.requester_id = other_user_id and friendship.addressee_id = current_user_id)
      )
  ) then
    raise exception 'You must be friends before starting a DM';
  end if;

  select mine.thread_id
  into existing_thread_id
  from public.dm_members mine
  join public.dm_members other_member on other_member.thread_id = mine.thread_id
  where mine.user_id = current_user_id
    and other_member.user_id = other_user_id
  limit 1;

  if existing_thread_id is not null then
    return existing_thread_id;
  end if;

  insert into public.dm_threads default values
  returning id into new_thread_id;

  insert into public.dm_members(thread_id, user_id)
  values
    (new_thread_id, current_user_id),
    (new_thread_id, other_user_id);

  return new_thread_id;
end;
$$;

grant execute on function public.get_or_create_dm_thread(uuid) to authenticated;
grant execute on function public.is_dm_member(uuid) to authenticated;

notify pgrst, 'reload schema';

create or replace function public.notify_plan_attendees(
  target_plan_id uuid,
  sender_user_id uuid,
  notification_kind text,
  notification_title text,
  notification_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_catalog_bar_id text;
begin
  select catalog_bar_id into target_catalog_bar_id
  from public.plans
  where id = target_plan_id
    and status <> 'ended'::public.plan_status;

  if target_catalog_bar_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.plan_attendees sender_attendee
    where sender_attendee.plan_id = target_plan_id
      and sender_attendee.user_id = sender_user_id
      and sender_attendee.left_at is null
  ) then
    return;
  end if;

  insert into public.plan_notifications (user_id, plan_id, catalog_bar_id, kind, title, body)
  select
    attendee.user_id,
    target_plan_id,
    target_catalog_bar_id,
    notification_kind,
    notification_title,
    notification_body
  from public.plan_attendees attendee
  where attendee.plan_id = target_plan_id
    and attendee.left_at is null
    and attendee.user_id <> sender_user_id;
end;
$$;

create or replace function public.notify_dm_recipient(
  target_thread_id uuid,
  sender_user_id uuid,
  notification_title text,
  notification_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.dm_members sender_member
    where sender_member.thread_id = target_thread_id
      and sender_member.user_id = sender_user_id
  ) then
    return;
  end if;

  insert into public.plan_notifications (user_id, dm_thread_id, kind, title, body)
  select
    member.user_id,
    target_thread_id,
    'dm_message',
    notification_title,
    notification_body
  from public.dm_members member
  where member.thread_id = target_thread_id
    and member.user_id <> sender_user_id;
end;
$$;

grant execute on function public.notify_plan_attendees(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.notify_dm_recipient(uuid, uuid, text, text) to authenticated;

create or replace function public.notify_friend_request(
  requester_user_id uuid,
  addressee_user_id uuid,
  notification_title text,
  notification_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() <> requester_user_id then
    return;
  end if;

  insert into public.plan_notifications (user_id, kind, title, body)
  values (addressee_user_id, 'friend_request', notification_title, notification_body);
end;
$$;

create or replace function public.notify_plan_invite(
  target_plan_id uuid,
  sender_user_id uuid,
  invitee_user_id uuid,
  notification_title text,
  notification_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_catalog_bar_id text;
begin
  if auth.uid() <> sender_user_id then
    return;
  end if;

  select catalog_bar_id into target_catalog_bar_id
  from public.plans
  where id = target_plan_id
    and status <> 'ended'::public.plan_status;

  if target_catalog_bar_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.friend_requests friendship
    where friendship.status = 'accepted'
      and (
        (friendship.requester_id = sender_user_id and friendship.addressee_id = invitee_user_id)
        or (friendship.requester_id = invitee_user_id and friendship.addressee_id = sender_user_id)
      )
  ) then
    return;
  end if;

  insert into public.plan_notifications (user_id, plan_id, catalog_bar_id, kind, title, body)
  values (invitee_user_id, target_plan_id, target_catalog_bar_id, 'plan_invite', notification_title, notification_body);
end;
$$;

create or replace function public.notify_plan_canceled(
  target_plan_id uuid,
  sender_user_id uuid,
  notification_title text,
  notification_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_catalog_bar_id text;
begin
  if auth.uid() <> sender_user_id then
    return;
  end if;

  select catalog_bar_id into target_catalog_bar_id
  from public.plans
  where id = target_plan_id
    and started_by = sender_user_id;

  if target_catalog_bar_id is null then
    return;
  end if;

  insert into public.plan_notifications (user_id, plan_id, catalog_bar_id, kind, title, body)
  select
    attendee.user_id,
    target_plan_id,
    target_catalog_bar_id,
    'plan_canceled',
    notification_title,
    notification_body
  from public.plan_attendees attendee
  where attendee.plan_id = target_plan_id
    and attendee.left_at is null
    and attendee.user_id <> sender_user_id;
end;
$$;

grant execute on function public.notify_friend_request(uuid, uuid, text, text) to authenticated;
grant execute on function public.notify_plan_invite(uuid, uuid, uuid, text, text) to authenticated;
grant execute on function public.notify_plan_canceled(uuid, uuid, text, text) to authenticated;

create or replace function public.notify_interested_users_for_plan(target_plan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_plan public.plans%rowtype;
  bar_name text;
begin
  select * into target_plan
  from public.plans
  where id = target_plan_id
    and status <> 'ended'::public.plan_status;

  if not found then
    return;
  end if;

  select name into bar_name
  from public.catalog_bars
  where id = target_plan.catalog_bar_id;

  insert into public.plan_notifications (user_id, plan_id, catalog_bar_id, kind, title, body)
  select
    interest.user_id,
    target_plan.id,
    target_plan.catalog_bar_id,
    'pinned_bar_plan',
    coalesce(bar_name, 'Pinned bar') || ' has a new plan',
    'Someone is hosting a plan for a bar you pinned.'
  from public.bar_interests interest
  where interest.catalog_bar_id = target_plan.catalog_bar_id
    and interest.notify_on_plan = true
    and interest.user_id <> target_plan.started_by
    and not exists (
      select 1
      from public.plan_notifications existing
      where existing.user_id = interest.user_id
        and existing.plan_id = target_plan.id
        and existing.kind = 'pinned_bar_plan'
    );
end;
$$;

grant execute on function public.notify_interested_users_for_plan(uuid) to authenticated;

notify pgrst, 'reload schema';
