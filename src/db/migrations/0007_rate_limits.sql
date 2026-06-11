-- Postgres-backed rate limiting (lib/rate-limit.ts).
-- A fixed-window counter keyed by "<limiter>:<user-or-ip>". The whole
-- check-and-increment is one atomic upsert, so concurrent requests can't race
-- past the limit. Accessed only via the service-role client.

create table if not exists public.rate_limits (
  key           text primary key,
  count         int not null default 0,
  window_start  timestamptz not null default now()
);

-- Lets a cleanup job sweep expired windows cheaply (see note at bottom).
create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

-- Locked down: no policies → only the service role (which bypasses RLS) reaches it.
alter table public.rate_limits enable row level security;

-- Atomically bump the counter for a key, resetting the window when it has
-- expired. Returns whether the request is allowed plus the remaining budget
-- and when the window resets.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns table (allowed boolean, remaining int, reset_at timestamptz)
language plpgsql
as $$
declare
  v_now          timestamptz := now();
  v_count        int;
  v_window_start timestamptz;
begin
  insert into public.rate_limits (key, count, window_start)
  values (p_key, 1, v_now)
  on conflict (key) do update set
    count = case
      when public.rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
        then 1
      else public.rate_limits.count + 1
    end,
    window_start = case
      when public.rate_limits.window_start < v_now - make_interval(secs => p_window_seconds)
        then v_now
      else public.rate_limits.window_start
    end
  returning count, window_start into v_count, v_window_start;

  return query select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    v_window_start + make_interval(secs => p_window_seconds);
end;
$$;

-- Housekeeping: the table accumulates one row per distinct key (per user / IP).
-- Rows are tiny and primary-key addressed, so this is harmless at this scale.
-- To prune, run periodically (e.g. a Supabase scheduled job):
--   delete from public.rate_limits where window_start < now() - interval '1 day';
