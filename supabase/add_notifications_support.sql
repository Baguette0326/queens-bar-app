grant select, update on public.plan_notifications to authenticated;

create index if not exists plan_notifications_user_created_idx
on public.plan_notifications (user_id, created_at desc);

select
  has_table_privilege('authenticated', 'public.plan_notifications', 'SELECT') as authenticated_can_read_notifications,
  has_table_privilege('authenticated', 'public.plan_notifications', 'UPDATE') as authenticated_can_update_notifications,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_notifications'
      and policyname = 'users can read own notifications'
  ) as read_policy_ready,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_notifications'
      and policyname = 'users can mark own notifications read'
  ) as update_policy_ready;
