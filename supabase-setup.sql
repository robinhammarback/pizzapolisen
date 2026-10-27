-- Kör i Supabase SQL Editor. Kan köras igen vid behov.
create extension if not exists pgcrypto;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  case_no text not null default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  pizzeria text not null,
  location text,
  pizza text,
  visit_date date,
  score numeric(4,1) not null default 30,
  taste_score numeric(3,1) not null default 6,
  price_score numeric(3,1) not null default 6,
  interior_score numeric(3,1) not null default 6,
  clientele_score numeric(3,1) not null default 6,
  svennefaktor_score numeric(3,1) not null default 6,
  photo_url text,
  review_text text not null,
  created_at timestamptz not null default now()
);

-- Uppdatera även en redan skapad reviews-tabell.
alter table public.reviews add column if not exists taste_score numeric(3,1) not null default 6;
alter table public.reviews add column if not exists price_score numeric(3,1) not null default 6;
alter table public.reviews add column if not exists interior_score numeric(3,1) not null default 6;
alter table public.reviews add column if not exists clientele_score numeric(3,1) not null default 6;
alter table public.reviews add column if not exists svennefaktor_score numeric(3,1) not null default 6;

-- Delbetygen och totalen tillåter halva poäng (steg om 0,5), total 5–55.
-- Befintliga tabeller uppdateras; befintliga poäng konverteras till numeriska värden.
alter table public.reviews alter column score type numeric(4,1) using score::numeric(4,1);
alter table public.reviews alter column taste_score type numeric(3,1) using taste_score::numeric(3,1);
alter table public.reviews alter column price_score type numeric(3,1) using price_score::numeric(3,1);
alter table public.reviews alter column interior_score type numeric(3,1) using interior_score::numeric(3,1);
alter table public.reviews alter column clientele_score type numeric(3,1) using clientele_score::numeric(3,1);
alter table public.reviews alter column svennefaktor_score type numeric(3,1) using svennefaktor_score::numeric(3,1);
alter table public.reviews alter column score set default 30;
alter table public.reviews drop constraint if exists reviews_score_check;
alter table public.reviews add constraint reviews_score_check check (score between 5 and 55);
alter table public.reviews drop constraint if exists reviews_taste_score_check;
alter table public.reviews add constraint reviews_taste_score_check check (taste_score between 1 and 11);
alter table public.reviews drop constraint if exists reviews_taste_score_half_step_check;
alter table public.reviews add constraint reviews_taste_score_half_step_check check (mod(taste_score * 2, 1) = 0);
alter table public.reviews drop constraint if exists reviews_price_score_check;
alter table public.reviews add constraint reviews_price_score_check check (price_score between 1 and 11);
alter table public.reviews drop constraint if exists reviews_price_score_half_step_check;
alter table public.reviews add constraint reviews_price_score_half_step_check check (mod(price_score * 2, 1) = 0);
alter table public.reviews drop constraint if exists reviews_interior_score_check;
alter table public.reviews add constraint reviews_interior_score_check check (interior_score between 1 and 11);
alter table public.reviews drop constraint if exists reviews_interior_score_half_step_check;
alter table public.reviews add constraint reviews_interior_score_half_step_check check (mod(interior_score * 2, 1) = 0);
alter table public.reviews drop constraint if exists reviews_clientele_score_check;
alter table public.reviews add constraint reviews_clientele_score_check check (clientele_score between 1 and 11);
alter table public.reviews drop constraint if exists reviews_clientele_score_half_step_check;
alter table public.reviews add constraint reviews_clientele_score_half_step_check check (mod(clientele_score * 2, 1) = 0);
alter table public.reviews drop constraint if exists reviews_svennefaktor_score_check;
alter table public.reviews add constraint reviews_svennefaktor_score_check check (svennefaktor_score between 1 and 11);
alter table public.reviews drop constraint if exists reviews_svennefaktor_score_half_step_check;
alter table public.reviews add constraint reviews_svennefaktor_score_half_step_check check (mod(svennefaktor_score * 2, 1) = 0);

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
