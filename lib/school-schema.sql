-- School goal storage for Life OS.
-- Run this in the Supabase SQL editor after Supabase Auth is enabled.
-- These tables are accessed by server-side app routes using SUPABASE_SERVICE_ROLE_KEY.

create extension if not exists pgcrypto;

create table if not exists public.school_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'General',
  priority text not null default 'Medium',
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.school_goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  priority text not null default 'Medium',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_goals_user_id_created_at_idx
on public.school_goals (user_id, created_at desc);

create index if not exists school_tasks_user_id_due_date_idx
on public.school_tasks (user_id, due_date asc);

create index if not exists school_tasks_goal_id_created_at_idx
on public.school_tasks (goal_id, created_at asc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists school_goals_set_updated_at on public.school_goals;
create trigger school_goals_set_updated_at
before update on public.school_goals
for each row execute function public.set_updated_at();

drop trigger if exists school_tasks_set_updated_at on public.school_tasks;
create trigger school_tasks_set_updated_at
before update on public.school_tasks
for each row execute function public.set_updated_at();

alter table public.school_goals enable row level security;
alter table public.school_tasks enable row level security;

-- Direct client access policies are intentionally not added yet.
-- The app uses authenticated server routes to enforce per-user access.
-- TODO: Add RLS policies if the app later queries these tables directly from the browser.
