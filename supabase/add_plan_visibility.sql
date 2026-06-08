alter table public.plans
  add column if not exists visibility text not null default 'public'
  check (visibility in ('public', 'friends'));

create or replace function public.can_view_plan(target_plan_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.plans visible_plan
    where visible_plan.id = target_plan_id
      and (
        visible_plan.visibility = 'public'
        or auth.uid() = visible_plan.started_by
        or exists (
          select 1
          from public.plan_attendees attendee
          where attendee.plan_id = visible_plan.id
            and attendee.user_id = auth.uid()
            and attendee.left_at is null
        )
        or exists (
          select 1
          from public.friend_requests friendship
          where friendship.status = 'accepted'
            and (
              (friendship.requester_id = auth.uid() and friendship.addressee_id = visible_plan.started_by)
              or (friendship.addressee_id = auth.uid() and friendship.requester_id = visible_plan.started_by)
            )
        )
      )
  );
$$;

grant execute on function public.can_view_plan(uuid) to authenticated;

drop policy if exists "plans are readable" on public.plans;
create policy "plans are readable"
on public.plans for select
using (public.can_view_plan(id));

drop policy if exists "attendees are readable" on public.plan_attendees;
create policy "attendees are readable"
on public.plan_attendees for select
using (public.can_view_plan(plan_id));

notify pgrst, 'reload schema';
