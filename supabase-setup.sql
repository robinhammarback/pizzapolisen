-- Kör i Supabase SQL Editor. Kan köras igen vid behov.
create extension if not exists pgcrypto;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  case_no text not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  pizzeria text not null,
  location text,
  pizza text,
  visit_date date,
  score integer not null default 30,
  taste_score integer not null default 6,
  price_score integer not null default 6,
  interior_score integer not null default 6,
  clientele_score integer not null default 6,
  svennefaktor_score integer not null default 6,
  photo_url text,
  review_text text not null,
  created_at timestamptz not null default now()
);

-- Uppdatera även en redan skapad reviews-tabell.
alter table public.reviews add column if not exists taste_score integer not null default 6;
alter table public.reviews add column if not exists price_score integer not null default 6;
alter table public.reviews add column if not exists interior_score integer not null default 6;
alter table public.reviews add column if not exists clientele_score integer not null default 6;
alter table public.reviews add column if not exists svennefaktor_score integer not null default 6;

-- Totalbetyget är summan av fem delbetyg (5–55). Befintliga tomma tabeller påverkas inte.
alter table public.reviews alter column score type integer using round(score)::integer;
alter table public.reviews alter column score set default 30;
alter table public.reviews drop constraint if exists reviews_score_check;
alter table public.reviews add constraint reviews_score_check check (score between 5 and 55);
alter table public.reviews drop constraint if exists reviews_taste_score_check;
alter table public.reviews add constraint reviews_taste_score_check check (taste_score between 1 and 11);
alter table public.reviews drop constraint if exists reviews_price_score_check;
alter table public.reviews add constraint reviews_price_score_check check (price_score between 1 and 11);
alter table public.reviews drop constraint if exists reviews_interior_score_check;
alter table public.reviews add constraint reviews_interior_score_check check (interior_score between 1 and 11);
alter table public.reviews drop constraint if exists reviews_clientele_score_check;
alter table public.reviews add constraint reviews_clientele_score_check check (clientele_score between 1 and 11);
alter table public.reviews drop constraint if exists reviews_svennefaktor_score_check;
alter table public.reviews add constraint reviews_svennefaktor_score_check check (svennefaktor_score between 1 and 11);

alter table public.reviews enable row level security;
drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews" on public.reviews for select to anon, authenticated using (true);
drop policy if exists "Authenticated members can insert reviews" on public.reviews;
create policy "Authenticated members can insert reviews" on public.reviews for insert to authenticated with check (true);
drop policy if exists "Authenticated members can update reviews" on public.reviews;
create policy "Authenticated members can update reviews" on public.reviews for update to authenticated using (true) with check (true);
drop policy if exists "Authenticated members can delete reviews" on public.reviews;
create policy "Authenticated members can delete reviews" on public.reviews for delete to authenticated using (true);

-- Skapa/inbjud användare via Supabase Dashboard och stäng av publik registrering.
