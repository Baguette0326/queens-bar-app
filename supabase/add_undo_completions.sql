grant delete on public.bar_completions to authenticated;

drop policy if exists "users can delete own completions" on public.bar_completions;

create policy "users can delete own completions"
on public.bar_completions for delete
using (auth.uid() = user_id);

select
  has_table_privilege('authenticated', 'public.bar_completions', 'DELETE') as authenticated_can_delete_completions,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bar_completions'
      and policyname = 'users can delete own completions'
  ) as delete_policy_ready;
