-- Index the per-user posting-rate query (lib/feed/service.ts postsToday):
-- feed_posts filtered by user_id + created_at on every photo publish. The
-- existing created_at-only index doesn't cover the user_id predicate.
create index if not exists feed_posts_user_created_idx
  on public.feed_posts (user_id, created_at desc);
