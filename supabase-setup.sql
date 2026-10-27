-- Kör i Supabase SQL Editor. Kräver inloggning för att skriva/ändra/radera.
create extension if not exists pgcrypto;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  case_no text not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  pizzeria text not null,
  location text,
  pizza text,
  visit_date date,
  score numeric(3,1) not null check (score >= 0 and score <= 10),
  photo_url text,
  review_text text not null,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews"
on public.reviews for select to anon, authenticated using (true);

drop policy if exists "Authenticated members can insert reviews" on public.reviews;
create policy "Authenticated members can insert reviews"
on public.reviews for insert to authenticated with check (true);

drop policy if exists "Authenticated members can update reviews" on public.reviews;
create policy "Authenticated members can update reviews"
on public.reviews for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated members can delete reviews" on public.reviews;
create policy "Authenticated members can delete reviews"
on public.reviews for delete to authenticated using (true);

-- IMPORTANT: Skapa användarkonton/inbjudningar via Supabase Dashboard.
-- Stäng av public sign-ups i Authentication settings.
-- För en större grupp bör ni senare lägga till en separat adminsroll och
-- begränsa radering/administration till utvalda användare.
