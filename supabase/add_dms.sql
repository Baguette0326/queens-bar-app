create table if not exists public.dm_threads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dm_members (
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.dm_threads enable row level security;
alter table public.dm_members enable row level security;
alter table public.dm_messages enable row level security;

grant select on public.dm_threads to authenticated;
grant select on public.dm_members to authenticated;
grant select, insert on public.dm_messages to authenticated;

create index if not exists dm_members_user_idx on public.dm_members(user_id);
create index if not exists dm_messages_thread_created_idx on public.dm_messages(thread_id, created_at);

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

drop policy if exists "members can read own dm threads" on public.dm_threads;
create policy "members can read own dm threads"
on public.dm_threads for select
using (public.is_dm_member(id));

drop policy if exists "members can read own dm members" on public.dm_members;
create policy "members can read own dm members"
on public.dm_members for select
using (public.is_dm_member(thread_id));

drop policy if exists "members can read own dm messages" on public.dm_messages;
create policy "members can read own dm messages"
on public.dm_messages for select
using (public.is_dm_member(thread_id));

drop policy if exists "members can send own dm messages" on public.dm_messages;
create policy "members can send own dm messages"
on public.dm_messages for insert
with check (
  auth.uid() = sender_id
  and public.is_dm_member(thread_id)
);

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
