-- Supabase schema for Life OS Version 1.
-- Run this in the Supabase SQL editor after creating a project.

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists public.whoop_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  metric_date date not null,
  sleep_duration_minutes integer not null,
  recovery_score integer not null check (recovery_score between 0 and 100),
  hrv numeric(6,2),
  resting_heart_rate integer,
  strain numeric(5,2),
  created_at timestamptz default now(),
  unique (user_id, metric_date)
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  target text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  completed_on date not null,
  created_at timestamptz default now(),
  unique (habit_id, completed_on)
);

create table if not exists public.school_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  class_name text not null,
  target text,
  progress integer default 0 check (progress between 0 and 100),
  priority text default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  created_at timestamptz default now()
);

create table if not exists public.school_tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.school_goals(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  due_date date,
  is_done boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  transaction_date date not null,
  type text not null check (type in ('Income', 'Expense', 'Savings')),
  category text not null,
  amount numeric(10,2) not null check (amount >= 0),
  note text,
  created_at timestamptz default now()
);

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  report_date date not null,
  health_summary text,
  habits_summary text,
  school_summary text,
  finance_summary text,
  recommendation text,
  created_at timestamptz default now(),
  unique (user_id, report_date)
);

alter table public.users enable row level security;
alter table public.whoop_daily_metrics enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.school_goals enable row level security;
alter table public.school_tasks enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.daily_reports enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "Users can read own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Users can read own WHOOP metrics" on public.whoop_daily_metrics;
drop policy if exists "Users can insert own WHOOP metrics" on public.whoop_daily_metrics;
drop policy if exists "Users can update own WHOOP metrics" on public.whoop_daily_metrics;
drop policy if exists "Users can delete own WHOOP metrics" on public.whoop_daily_metrics;
drop policy if exists "Users can manage own habits" on public.habits;
drop policy if exists "Users can manage own habit logs" on public.habit_logs;
drop policy if exists "Users can manage own school goals" on public.school_goals;
drop policy if exists "Users can manage own school tasks" on public.school_tasks;
drop policy if exists "Users can manage own financial transactions" on public.financial_transactions;
drop policy if exists "Users can manage own daily reports" on public.daily_reports;

create policy "Users can read own profile"
on public.users for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.users for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can read own WHOOP metrics"
on public.whoop_daily_metrics for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own WHOOP metrics"
on public.whoop_daily_metrics for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own WHOOP metrics"
on public.whoop_daily_metrics for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own WHOOP metrics"
on public.whoop_daily_metrics for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can manage own habits"
on public.habits for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own habit logs"
on public.habit_logs for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own school goals"
on public.school_goals for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own school tasks"
on public.school_tasks for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own financial transactions"
on public.financial_transactions for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own daily reports"
on public.daily_reports for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
