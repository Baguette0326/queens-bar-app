drop function if exists public.create_plan_with_join(text, uuid, text, text, timestamptz, timestamptz, integer, text, text);

create or replace function public.create_plan_with_join(
  target_catalog_bar_id text,
  starter_user_id uuid,
  target_location_name text,
  target_location_detail text,
  target_starts_at timestamptz,
  target_ends_at timestamptz,
  target_cap integer,
  target_note text,
  target_visibility text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_plan_id uuid;
begin
  if auth.uid() is null or auth.uid() <> starter_user_id then
    raise exception 'You must be signed in as the plan creator.';
  end if;

  if target_visibility not in ('public', 'friends') then
    raise exception 'Invalid plan visibility.';
  end if;

  insert into public.plans (
    catalog_bar_id,
    started_by,
    location_name,
    location_detail,
    starts_at,
    ends_at,
    cap,
    note,
    visibility,
    status
  )
  values (
    target_catalog_bar_id,
    starter_user_id,
    target_location_name,
    nullif(target_location_detail, ''),
    target_starts_at,
    target_ends_at,
    target_cap,
    nullif(target_note, ''),
    target_visibility,
    case
      when target_starts_at <= now() then 'ongoing'::public.plan_status
      else 'upcoming'::public.plan_status
    end
  )
  returning id into new_plan_id;

  insert into public.plan_attendees (plan_id, user_id, left_at)
  values (new_plan_id, starter_user_id, null)
  on conflict (plan_id, user_id)
  do update set left_at = null;

  return new_plan_id;
end;
$$;

grant execute on function public.create_plan_with_join(text, uuid, text, text, timestamptz, timestamptz, integer, text, text) to authenticated;

select pg_notify('pgrst', 'reload schema');
