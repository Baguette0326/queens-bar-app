-- Queens Bars MVP schema
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
  tier text not null default 'Iron',
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

create table public.plan_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  catalog_bar_id text not null references public.catalog_bars(id) on delete cascade,
  kind text not null default 'pinned_bar_plan',
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, plan_id, kind)
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
  ('Iron', 0),
  ('Bronze', 500),
  ('Silver', 1500),
  ('Gold', 3000)
on conflict (tier) do nothing;

alter table public.profiles enable row level security;
alter table public.catalog_bars enable row level security;
alter table public.plans enable row level security;
alter table public.plan_attendees enable row level security;
alter table public.bar_interests enable row level security;
alter table public.chat_messages enable row level security;
alter table public.plan_notifications enable row level security;
alter table public.bar_completions enable row level security;
alter table public.tier_thresholds enable row level security;

grant select, insert, update, delete on public.bar_interests to authenticated;
grant select, update on public.plan_notifications to authenticated;
grant select, insert on public.chat_messages to authenticated;
grant select, insert, delete on public.bar_completions to authenticated;

create index if not exists chat_messages_plan_created_idx
on public.chat_messages (plan_id, created_at);

create index if not exists plan_notifications_user_created_idx
on public.plan_notifications (user_id, created_at desc);

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

create policy "plans are readable"
on public.plans for select
using (true);

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
using (true);

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

  insert into public.plan_notifications (user_id, plan_id, catalog_bar_id, title, body)
  select
    interest.user_id,
    target_plan.id,
    target_plan.catalog_bar_id,
    coalesce(bar_name, 'Pinned bar') || ' has a new plan',
    'Someone is hosting a plan for a bar you pinned.'
  from public.bar_interests interest
  where interest.catalog_bar_id = target_plan.catalog_bar_id
    and interest.notify_on_plan = true
    and interest.user_id <> target_plan.started_by
  on conflict (user_id, plan_id, kind) do nothing;
end;
$$;

grant execute on function public.notify_interested_users_for_plan(uuid) to authenticated;
