-- Habit storage for Life OS.
-- Run this in the Supabase SQL editor after Supabase Auth is enabled.
-- These tables are accessed by server-side app routes using SUPABASE_SERVICE_ROLE_KEY.

create extension if not exists pgcrypto;

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  target_frequency text not null default 'daily',
  created_at timestamptz not null default now()
);

create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now()
);

create index if not exists habits_user_id_created_at_idx
on public.habits (user_id, created_at desc);

create index if not exists habit_completions_user_id_completed_at_idx
on public.habit_completions (user_id, completed_at desc);

create index if not exists habit_completions_habit_id_completed_at_idx
on public.habit_completions (habit_id, completed_at desc);

alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;

-- Direct client access policies are intentionally not added yet.
-- The app uses authenticated server routes to enforce per-user access.
-- TODO: Add RLS policies if the app later queries these tables directly from the browser.
