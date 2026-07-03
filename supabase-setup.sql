-- ═══════════════════════════════════════════════
-- FX Journal — Supabase Database Setup
-- Run this ONCE in: Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════

-- 1. ACCOUNTS TABLE
create table if not exists public.accounts (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  firm        text,
  type        text default 'challenge',
  platform    text default 'MT5',
  size        numeric default 10000,
  "riskPct"   numeric default 1,
  "dailyLimit" numeric default 5,
  "maxDD"     numeric default 10,
  target      numeric default 10,
  created_at  timestamptz default now()
);

-- 2. SYSTEMS TABLE
create table if not exists public.systems (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  color      text default '#58A6FF',
  pairs      text[],
  created_at timestamptz default now()
);

-- 3. TRADES TABLE
create table if not exists public.trades (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users(id) on delete cascade not null,
  date             date not null,
  "accountId"      uuid,
  "systemId"       uuid,
  pair             text,
  direction        text default 'long',
  open             numeric,
  sl               numeric,
  tp               numeric,
  lots             numeric,
  rr               text,
  result           numeric default 0,
  country          text,
  session          text,
  "screenshotUrl"  text,
  "sharedAccounts" text[],
  notes            text,
  created_at       timestamptz default now()
);

-- 4. ROW LEVEL SECURITY — each user only sees their own data
alter table public.accounts enable row level security;
alter table public.systems  enable row level security;
alter table public.trades   enable row level security;

-- Accounts policies
create policy "users see own accounts"
  on public.accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Systems policies
create policy "users see own systems"
  on public.systems for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trades policies
create policy "users see own trades"
  on public.trades for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. SCREENSHOT STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', false)
on conflict do nothing;

create policy "users manage own screenshots"
  on storage.objects for all
  using (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1]);

-- ═══════════════════════════════════════════════
-- DONE. You should see 3 tables in Table Editor.
-- ═══════════════════════════════════════════════
