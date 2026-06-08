create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

create unique index if not exists friend_requests_pair_unique_idx
on public.friend_requests (
  least(requester_id, addressee_id),
  greatest(requester_id, addressee_id)
)
where status in ('pending', 'accepted');

create index if not exists friend_requests_addressee_status_idx
on public.friend_requests(addressee_id, status, created_at desc);

alter table public.friend_requests enable row level security;

grant select, insert, update, delete on public.friend_requests to authenticated;

drop policy if exists "users can read own friend requests" on public.friend_requests;
create policy "users can read own friend requests"
on public.friend_requests for select
using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "users can send friend requests" on public.friend_requests;
create policy "users can send friend requests"
on public.friend_requests for insert
with check (
  auth.uid() = requester_id
  and requester_id <> addressee_id
  and status = 'pending'
);

drop policy if exists "users can respond to incoming friend requests" on public.friend_requests;
create policy "users can respond to incoming friend requests"
on public.friend_requests for update
using (auth.uid() = addressee_id)
with check (auth.uid() = addressee_id);

drop policy if exists "users can remove own friendships" on public.friend_requests;
create policy "users can remove own friendships"
on public.friend_requests for delete
using (
  (status = 'accepted' and (auth.uid() = requester_id or auth.uid() = addressee_id))
  or (status = 'pending' and auth.uid() = requester_id)
);

notify pgrst, 'reload schema';
