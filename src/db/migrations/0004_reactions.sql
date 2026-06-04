-- Feed reactions (Phase 3): a single 👍 per user per post.
create table if not exists public.feed_reactions (
  feed_post_id  uuid not null references public.feed_posts (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (feed_post_id, user_id)
);

create index if not exists feed_reactions_post_idx on public.feed_reactions (feed_post_id);

-- Reads/writes flow through service-role server routes (which derive the user
-- from the session); lock the table down otherwise.
alter table public.feed_reactions enable row level security;
