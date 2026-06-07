create table if not exists public.bar_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  catalog_bar_id text not null references public.catalog_bars(id) on delete cascade,
  notify_on_plan boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, catalog_bar_id)
);

create table if not exists public.plan_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete cascade,
  catalog_bar_id text references public.catalog_bars(id) on delete cascade,
  kind text not null default 'pinned_bar_plan',
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.bar_interests enable row level security;
alter table public.plan_notifications enable row level security;

grant select, insert, update, delete on public.bar_interests to authenticated;
grant select, update on public.plan_notifications to authenticated;

drop policy if exists "users can read own bar interests" on public.bar_interests;
drop policy if exists "users can pin bars for themselves" on public.bar_interests;
drop policy if exists "users can update own bar interests" on public.bar_interests;
drop policy if exists "users can unpin own bars" on public.bar_interests;

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

drop policy if exists "users can read own notifications" on public.plan_notifications;
drop policy if exists "users can mark own notifications read" on public.plan_notifications;

create policy "users can read own notifications"
on public.plan_notifications for select
using (auth.uid() = user_id);

create policy "users can mark own notifications read"
on public.plan_notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

select
  to_regclass('public.bar_interests') is not null as bar_interests_ready,
  to_regclass('public.plan_notifications') is not null as plan_notifications_ready,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bar_interests'
      and policyname = 'users can pin bars for themselves'
  ) as pin_policy_ready;
