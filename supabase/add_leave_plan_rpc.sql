create or replace function public.leave_plan_and_maybe_end(
  target_plan_id uuid,
  leaving_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  active_attendee_count integer;
begin
  if auth.uid() is null or auth.uid() <> leaving_user_id then
    raise exception 'You must be signed in as the leaving attendee.';
  end if;

  update public.plan_attendees
  set left_at = now()
  where plan_id = target_plan_id
    and user_id = leaving_user_id
    and left_at is null;

  select count(*) into active_attendee_count
  from public.plan_attendees
  where plan_id = target_plan_id
    and left_at is null;

  if active_attendee_count = 0 then
    update public.plans
    set status = 'ended'::public.plan_status,
        updated_at = now()
    where id = target_plan_id;

    return true;
  end if;

  return false;
end;
$$;

grant execute on function public.leave_plan_and_maybe_end(uuid, uuid) to authenticated;

select pg_notify('pgrst', 'reload schema');
