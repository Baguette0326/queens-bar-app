grant select, insert on public.chat_messages to authenticated;

create index if not exists chat_messages_plan_created_idx
on public.chat_messages (plan_id, created_at);

select
  has_table_privilege('authenticated', 'public.chat_messages', 'SELECT') as authenticated_can_read_chat,
  has_table_privilege('authenticated', 'public.chat_messages', 'INSERT') as authenticated_can_send_chat,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_messages'
      and policyname = 'joined users can read plan chat'
  ) as read_policy_ready,
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_messages'
      and policyname = 'joined users can send plan chat'
  ) as send_policy_ready;
