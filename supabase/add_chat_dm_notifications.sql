alter table public.plan_notifications
  alter column plan_id drop not null,
  alter column catalog_bar_id drop not null;

alter table public.plan_notifications
  add column if not exists dm_thread_id uuid references public.dm_threads(id) on delete cascade;

alter table public.plan_notifications
  drop constraint if exists plan_notifications_user_id_plan_id_kind_key;

create index if not exists plan_notifications_dm_thread_created_idx
on public.plan_notifications(dm_thread_id, created_at desc);

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
