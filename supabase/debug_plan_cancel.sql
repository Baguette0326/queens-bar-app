select
  id,
  catalog_bar_id,
  started_by,
  auth.uid() as current_auth_user,
  started_by = auth.uid() as current_user_started_plan,
  status,
  starts_at,
  location_name,
  location_detail
from public.plans
order by created_at desc
limit 10;
