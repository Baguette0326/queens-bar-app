alter type public.difficulty_level add value if not exists 'legendary';

alter table public.bar_completions
alter column confirmed_at set default now();

update public.bar_completions
set confirmed_at = coalesce(confirmed_at, created_at, now())
where confirmed_at is null;

alter table public.bar_completions
alter column confirmed_at set not null;

drop table if exists public.completion_confirmations;

grant select, insert on public.bar_completions to authenticated;
grant update on public.profiles to authenticated;

drop policy if exists "users can read visible completions" on public.bar_completions;
drop policy if exists "users can create own completions" on public.bar_completions;

create policy "users can read visible completions"
on public.bar_completions for select
using (true);

create policy "users can create own completions"
on public.bar_completions for insert
with check (auth.uid() = user_id);

select
  exists (
    select 1
    from pg_enum
    where enumlabel = 'legendary'
      and enumtypid = 'public.difficulty_level'::regtype
  ) as legendary_ready,
  has_table_privilege('authenticated', 'public.bar_completions', 'INSERT') as authenticated_can_complete_bars;
