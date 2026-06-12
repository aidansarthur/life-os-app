-- Long-term goal storage for Life OS.
-- Run this in the Supabase SQL editor after Supabase Auth is enabled.
-- These tables are accessed by server-side app routes using SUPABASE_SERVICE_ROLE_KEY.

create extension if not exists pgcrypto;

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'Personal',
  target_value numeric(12, 2) not null default 0,
  current_value numeric(12, 2) not null default 0,
  unit text not null default '',
  target_date date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  target_value numeric(12, 2) not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_id_status_created_at_idx
on public.goals (user_id, status, created_at desc);

create index if not exists goal_milestones_goal_id_created_at_idx
on public.goal_milestones (goal_id, created_at asc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

alter table public.goals enable row level security;
alter table public.goal_milestones enable row level security;

-- Direct client access policies are intentionally not added yet.
-- The app uses authenticated server routes to enforce per-user access.
-- TODO: Add RLS policies if the app later queries these tables directly from the browser.
