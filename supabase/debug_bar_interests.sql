select
  to_regclass('public.bar_interests') is not null as bar_interests_ready,
  to_regclass('public.plan_notifications') is not null as plan_notifications_ready,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bar_interests'
      and policyname = 'users can pin bars for themselves'
  ) as pin_policy_ready,
  has_table_privilege('authenticated', 'public.bar_interests', 'INSERT') as authenticated_can_insert_interests,
  has_table_privilege('authenticated', 'public.bar_interests', 'SELECT') as authenticated_can_select_interests,
  has_table_privilege('authenticated', 'public.bar_interests', 'DELETE') as authenticated_can_delete_interests;
