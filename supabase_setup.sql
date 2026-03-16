-- ═══════════════════════════════════════════════════════════════════════════
-- Apex Revenue — Supabase Database Setup
-- Run this entire script in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Profiles (extends Supabase auth.users) ────────────────────────────────
create table if not exists profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  is_admin    boolean default false not null,
  created_at  timestamptz default now() not null
);

-- If table already exists from a previous run, add the column safely
alter table profiles add column if not exists is_admin boolean default false not null;

-- Auto-create profile when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ── 2. Platform accounts (Chaturbate / Stripchat / etc.) ────────────────────
create table if not exists platform_accounts (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  platform    text not null,           -- 'chaturbate', 'stripchat', 'myfreecams', 'xtease'
  username    text not null,           -- lowercase streaming username
  linked_at   timestamptz default now() not null,
  unique(user_id, platform, username)
);


-- ── 3. Fan history (30-day rolling cloud storage) ────────────────────────────
create table if not exists fan_history (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete cascade not null,
  platform     text not null,
  fan_username text not null,
  total_tokens integer default 0 not null,
  last_seen    timestamptz,
  updated_at   timestamptz default now() not null,
  unique(user_id, platform, fan_username)
);

-- Index for fast queries
create index if not exists idx_fan_history_user_platform on fan_history(user_id, platform);
create index if not exists idx_fan_history_updated on fan_history(updated_at);

-- Auto-prune rows older than 30 days (runs via pg_cron if enabled, or manually)
-- To enable pg_cron: Supabase Dashboard → Database → Extensions → pg_cron
-- select cron.schedule('prune-fan-history', '0 3 * * *', $$
--   delete from fan_history where last_seen < now() - interval '30 days';
-- $$);


-- ── 4. Support tickets (submitted via Help page form) ───────────────────────
create table if not exists support_tickets (
  id                 uuid default gen_random_uuid() primary key,
  user_id            uuid references auth.users(id) on delete set null,  -- null = anonymous
  username           text,                -- registered streaming username
  type               text not null check (type in ('bug', 'feature', 'question')),
  email              text,                -- submitter email for reply notifications
  message            text not null,
  admin_comment      text,                -- admin reply — triggers email to submitter on UPDATE
  comment_updated_at timestamptz,         -- set automatically when admin_comment changes
  created_at         timestamptz default now() not null
);

create index if not exists idx_support_tickets_user    on support_tickets(user_id);
create index if not exists idx_support_tickets_created on support_tickets(created_at desc);

alter table support_tickets enable row level security;

drop policy if exists "Users can insert support tickets"    on support_tickets;
drop policy if exists "Admins can read all support tickets" on support_tickets;

-- Anyone (including anonymous) can insert a ticket
create policy "Users can insert support tickets"
  on support_tickets for insert
  with check (true);

-- Only admins can read tickets (via service role key or admin dashboard)
create policy "Admins can read all support tickets"
  on support_tickets for select
  using (
    exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );


-- ── 5. Verification codes (bio challenge for account ownership) ─────────────
create table if not exists verification_codes (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  platform    text not null,
  username    text not null,
  code        text not null,
  expires_at  timestamptz not null default (now() + interval '10 minutes'),
  created_at  timestamptz default now() not null
);

create index if not exists idx_verification_codes_user on verification_codes(user_id);


-- ── 6. Row Level Security ────────────────────────────────────────────────────
alter table profiles             enable row level security;
alter table platform_accounts    enable row level security;
alter table fan_history          enable row level security;
alter table verification_codes   enable row level security;

-- Drop policies first so this script is safe to re-run
drop policy if exists "Users own their profile"              on profiles;
drop policy if exists "Users own their platform accounts"    on platform_accounts;
drop policy if exists "Users own their fan history"          on fan_history;
drop policy if exists "Users own their verification codes"   on verification_codes;

-- Profiles: users can only read/write their own row
create policy "Users own their profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Platform accounts: users can only access their own linked accounts
create policy "Users own their platform accounts"
  on platform_accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Fan history: users can only access their own fan data
create policy "Users own their fan history"
  on fan_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Verification codes: users can only read/write their own codes
create policy "Users own their verification codes"
  on verification_codes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── 7. Admin account setup ───────────────────────────────────────────────────
-- Run this separately AFTER the main setup to grant admin to your account.
-- Replace the email below with your Apex Revenue account email.
--
-- update profiles
-- set is_admin = true
-- where id = (
--   select id from auth.users where email = 'ridge.johnston@gmail.com' limit 1
-- );
--
-- To verify it worked:
-- select id, is_admin from profiles where id = (
--   select id from auth.users where email = 'ridge.johnston@gmail.com' limit 1
-- );


-- ═══════════════════════════════════════════════════════════════════════════
-- SETUP COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════
-- Next step: get your project URL and anon key from:
--   Supabase Dashboard → Settings → API
--
-- Then open Apex-Revenue/auth.js and replace:
--   var APEX_SUPABASE_URL      = 'https://YOUR_PROJECT_ID.supabase.co';
--   var APEX_SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
-- ═══════════════════════════════════════════════════════════════════════════
