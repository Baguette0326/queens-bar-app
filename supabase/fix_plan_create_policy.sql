grant select, insert, update on public.plans to authenticated;
grant select, insert, update on public.plan_attendees to authenticated;

drop policy if exists "authenticated users can create plans" on public.plans;
create policy "authenticated users can create plans"
on public.plans
for insert
to authenticated
with check (auth.uid() = started_by);

drop policy if exists "users can join as themselves" on public.plan_attendees;
create policy "users can join as themselves"
on public.plan_attendees
for insert
to authenticated
with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
