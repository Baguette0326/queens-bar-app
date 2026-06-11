drop policy if exists "starters can cancel own plans" on public.plans;

create policy "starters can cancel own plans"
on public.plans
for update
to authenticated
using (auth.uid() = started_by)
with check (
  auth.uid() = started_by
  and status = 'ended'::public.plan_status
  and not exists (
    select 1
    from public.plan_attendees attendee
    where attendee.plan_id = plans.id
      and attendee.left_at is null
      and attendee.user_id <> auth.uid()
  )
);

create or replace function public.cancel_plan_if_empty(
  target_plan_id uuid,
  organizer_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> organizer_user_id then
    raise exception 'You must be signed in as the organizer.';
  end if;

  if not exists (
    select 1
    from public.plans
    where id = target_plan_id
      and started_by = organizer_user_id
      and status <> 'ended'::public.plan_status
  ) then
    raise exception 'Plan not found or you are not the organizer.';
  end if;

  if exists (
    select 1
    from public.plan_attendees attendee
    where attendee.plan_id = target_plan_id
      and attendee.left_at is null
      and attendee.user_id <> organizer_user_id
  ) then
    raise exception 'You can only cancel before anyone else joins.';
  end if;

  update public.plans
  set status = 'ended'::public.plan_status,
      updated_at = now()
  where id = target_plan_id
    and started_by = organizer_user_id;
end;
$$;

grant execute on function public.cancel_plan_if_empty(uuid, uuid) to authenticated;

select pg_notify('pgrst', 'reload schema');
