alter table public.profiles
add column if not exists bio text;

alter table public.profiles
drop constraint if exists profiles_bio_length;

alter table public.profiles
add constraint profiles_bio_length
check (bio is null or char_length(bio) <= 160);
