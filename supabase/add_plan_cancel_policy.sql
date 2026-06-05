drop policy if exists "starters can cancel own plans" on public.plans;

create policy "starters can cancel own plans"
on public.plans
for update
to authenticated
using (auth.uid() = started_by)
with check (
  auth.uid() = started_by
  and status = 'ended'::public.plan_status
);
