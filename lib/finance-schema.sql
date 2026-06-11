-- Finance storage for Life OS.
-- Run this in the Supabase SQL editor after Supabase Auth is enabled.
-- These tables are accessed by server-side app routes using SUPABASE_SERVICE_ROLE_KEY.

create extension if not exists pgcrypto;

create table if not exists public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'Checking',
  balance numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.finance_accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null,
  category text not null,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.finance_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_amount numeric(12, 2) not null default 0,
  current_amount numeric(12, 2) not null default 0,
  target_date date,
  created_at timestamptz not null default now()
);

create index if not exists finance_accounts_user_id_created_at_idx
on public.finance_accounts (user_id, created_at desc);

create index if not exists finance_transactions_user_id_date_idx
on public.finance_transactions (user_id, transaction_date desc);

create index if not exists finance_transactions_account_id_date_idx
on public.finance_transactions (account_id, transaction_date desc);

create index if not exists finance_goals_user_id_created_at_idx
on public.finance_goals (user_id, created_at desc);

alter table public.finance_accounts enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.finance_goals enable row level security;

-- Direct client access policies are intentionally not added yet.
-- The app uses authenticated server routes to enforce per-user access.
-- TODO: Add RLS policies if the app later queries these tables directly from the browser.
