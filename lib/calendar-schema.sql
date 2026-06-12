-- Google Calendar storage for Life OS.
-- Run this in the Supabase SQL editor after Supabase Auth is enabled.
-- Tokens are sensitive: keep RLS enabled and access these tables only from server code using SUPABASE_SERVICE_ROLE_KEY.

create extension if not exists pgcrypto;

create table if not exists public.google_calendar_tokens (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null unique,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  token_type text not null default 'Bearer',
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  google_event_id text not null,
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz,
  status text,
  html_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, google_event_id)
);

create index if not exists calendar_events_owner_id_start_at_idx
on public.calendar_events (owner_id, start_at asc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists google_calendar_tokens_set_updated_at on public.google_calendar_tokens;
create trigger google_calendar_tokens_set_updated_at
before update on public.google_calendar_tokens
for each row execute function public.set_updated_at();

drop trigger if exists calendar_events_set_updated_at on public.calendar_events;
create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

alter table public.google_calendar_tokens enable row level security;
alter table public.calendar_events enable row level security;

-- Direct client access policies are intentionally not added yet.
-- The app uses authenticated server routes to enforce per-user access.
