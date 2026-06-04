-- Admin/moderation support (Phase 2).

-- Ban flag: a removed-post author can be banned from posting to the feed.
alter table public.profiles
  add column if not exists is_banned boolean not null default false;
