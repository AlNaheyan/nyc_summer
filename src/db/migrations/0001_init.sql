-- Summer Quest NYC — initial schema
-- Tech spec §6 (Data Models) + §6 RLS notes.
-- Apply against a fresh Supabase Postgres database.
--
-- Conventions:
--   * profiles extends auth.users (1:1, shared id)
--   * user-owned tables are RLS-locked to the owner
--   * activities / quest_templates / badges are public-read reference data
--   * feed_posts are public-read only when allowed and below report threshold

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type moderation_status as enum ('allowed', 'flagged', 'blocked', 'removed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles  (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  display_name          text not null,
  avatar_url            text,
  is_adult              boolean not null default true,
  is_admin              boolean not null default false,
  points                int not null default 0,
  current_streak        int not null default 0,
  longest_streak        int not null default 0,
  last_completion_date  date,
  created_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- activities  (seeded from CSV, read-only at runtime)
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id             bigint primary key,            -- = source ObjectID
  source         text not null,
  title          text not null,
  tags           text[] not null default '{}',  -- normalized flat tags
  start_date     timestamptz,
  end_date       timestamptz,
  location_name  text,
  address        text,
  lat            double precision,
  lng            double precision,
  borough        text,                          -- derived from lat/lng at ingest
  url            text not null,
  min_age        int,
  max_age        int,
  icon           text
);

create index if not exists activities_tags_gin   on public.activities using gin (tags);
create index if not exists activities_start_idx   on public.activities (start_date);
create index if not exists activities_borough_idx on public.activities (borough);

-- ---------------------------------------------------------------------------
-- quest_templates  (hand-authored reference data)
-- ---------------------------------------------------------------------------
create table if not exists public.quest_templates (
  id              text primary key,             -- slug
  title           text not null,
  description     text not null,
  icon            text,
  match_tags      text[] not null default '{}',
  adult_friendly  boolean not null default true,
  weight          int not null default 1
);

-- ---------------------------------------------------------------------------
-- daily_quests  (locked quest-of-the-day)
-- ---------------------------------------------------------------------------
create table if not exists public.daily_quests (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  quest_template_id  text not null references public.quest_templates (id),
  quest_date         date not null,             -- America/New_York
  spins_used         int not null default 1,
  created_at         timestamptz not null default now(),
  unique (user_id, quest_date)
);

create index if not exists daily_quests_user_idx on public.daily_quests (user_id, quest_date);

-- ---------------------------------------------------------------------------
-- completions
-- ---------------------------------------------------------------------------
create table if not exists public.completions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  quest_template_id  text not null references public.quest_templates (id),
  activity_id        bigint references public.activities (id),
  photo_url          text,
  caption            text,
  is_private         boolean not null default false,
  completed_at       timestamptz not null default now()
);

create index if not exists completions_user_idx on public.completions (user_id, completed_at desc);

-- ---------------------------------------------------------------------------
-- feed_posts
-- ---------------------------------------------------------------------------
create table if not exists public.feed_posts (
  id                 uuid primary key default gen_random_uuid(),
  completion_id      uuid not null unique references public.completions (id) on delete cascade,
  user_id            uuid not null references public.profiles (id) on delete cascade,
  photo_url          text not null,
  caption            text,
  quest_title        text not null,             -- denormalized for cheap reads
  location_name      text,
  moderation_status  moderation_status not null default 'flagged',
  report_count       int not null default 0,
  created_at         timestamptz not null default now()
);

create index if not exists feed_posts_created_idx on public.feed_posts (created_at desc);

-- ---------------------------------------------------------------------------
-- badges + user_badges
-- ---------------------------------------------------------------------------
create table if not exists public.badges (
  id           text primary key,                -- slug
  name         text not null,
  description  text not null,
  icon         text,
  rule_key     text not null
);

create table if not exists public.user_badges (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  badge_id   text not null references public.badges (id),
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  feed_post_id  uuid not null references public.feed_posts (id) on delete cascade,
  reporter_id   uuid not null references public.profiles (id) on delete cascade,
  reason        text,
  created_at    timestamptz not null default now(),
  unique (feed_post_id, reporter_id)            -- one report per user per post
);

-- ---------------------------------------------------------------------------
-- Config knobs read by app logic (single-row table; keep simple)
-- ---------------------------------------------------------------------------
create table if not exists public.app_config (
  key    text primary key,
  value  text not null
);

insert into public.app_config (key, value) values
  ('report_threshold', '3'),         -- auto-hide a post at >= this many reports
  ('reroll_cost', '50'),             -- §13: start at 50 pts flat
  ('max_posts_per_day', '10')        -- rate limit
on conflict (key) do nothing;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles       enable row level security;
alter table public.activities     enable row level security;
alter table public.quest_templates enable row level security;
alter table public.daily_quests   enable row level security;
alter table public.completions    enable row level security;
alter table public.feed_posts     enable row level security;
alter table public.badges         enable row level security;
alter table public.user_badges    enable row level security;
alter table public.reports        enable row level security;
alter table public.app_config     enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- profiles: owner read/write; admin read all
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- public reference data: read by anyone (incl. anon)
drop policy if exists activities_public_read on public.activities;
create policy activities_public_read on public.activities for select using (true);
drop policy if exists quest_templates_public_read on public.quest_templates;
create policy quest_templates_public_read on public.quest_templates for select using (true);
drop policy if exists badges_public_read on public.badges;
create policy badges_public_read on public.badges for select using (true);

-- daily_quests: owner only (admin read all)
drop policy if exists daily_quests_own on public.daily_quests;
create policy daily_quests_own on public.daily_quests
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid());

-- completions: owner only (admin read all)
drop policy if exists completions_own on public.completions;
create policy completions_own on public.completions
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid());

-- user_badges: owner read; writes happen server-side (service role bypasses RLS)
drop policy if exists user_badges_select_own on public.user_badges;
create policy user_badges_select_own on public.user_badges
  for select using (user_id = auth.uid() or public.is_admin());

-- feed_posts: public read only when allowed and below report threshold; admin read all
drop policy if exists feed_posts_public_read on public.feed_posts;
create policy feed_posts_public_read on public.feed_posts
  for select using (
    public.is_admin()
    or (
      moderation_status = 'allowed'
      and report_count < coalesce(
        (select value::int from public.app_config where key = 'report_threshold'),
        3
      )
    )
  );

-- reports: authed users may insert their own; admin reads all
drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert with check (reporter_id = auth.uid());
drop policy if exists reports_admin_read on public.reports;
create policy reports_admin_read on public.reports
  for select using (public.is_admin());

-- app_config: public read (non-secret knobs)
drop policy if exists app_config_public_read on public.app_config;
create policy app_config_public_read on public.app_config for select using (true);
