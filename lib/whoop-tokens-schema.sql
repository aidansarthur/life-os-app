-- WHOOP token storage for Life OS Version 1.
-- Run this in the Supabase SQL editor.
-- Tokens are sensitive: keep RLS enabled and access this table only from server code
-- using SUPABASE_SERVICE_ROLE_KEY. Do not expose tokens through client-side queries.

create extension if not exists pgcrypto;

create table if not exists public.whoop_tokens (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null unique,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  token_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_whoop_tokens_updated_at on public.whoop_tokens;
create trigger set_whoop_tokens_updated_at
before update on public.whoop_tokens
for each row execute function public.set_updated_at();

alter table public.whoop_tokens enable row level security;

-- No anon/authenticated policies are created on purpose.
-- Server-side code should use SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- TODO: Replace owner_id with auth.users.id after Supabase auth is fully wired.
