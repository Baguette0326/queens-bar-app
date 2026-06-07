alter table public.profiles alter column tier set default 'Froshling';

delete from public.tier_thresholds
where tier in ('Iron', 'Bronze', 'Silver', 'Gold', 'Diamond');

insert into public.tier_thresholds (tier, min_xp)
values
  ('Froshling', 0),
  ('Patch Collector', 1000),
  ('Lore Bearer', 3000),
  ('Campus Legend', 6000)
on conflict (tier) do update
set min_xp = excluded.min_xp;

update public.profiles
set tier = case
  when xp >= 6000 then 'Campus Legend'
  when xp >= 3000 then 'Lore Bearer'
  when xp >= 1000 then 'Patch Collector'
  else 'Froshling'
end;
