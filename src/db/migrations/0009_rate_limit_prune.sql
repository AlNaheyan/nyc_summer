-- M2: bound the rate_limits keyspace. The table accrues one row per distinct
-- key (limiter:user-or-ip). Keying the public limiter on a trusted IP (see
-- lib/rate-limit.ts) already stops attacker-controlled key explosion; this adds
-- the housekeeping as a real function and schedules it hourly via pg_cron when
-- the extension is available (no-op otherwise — call prune_rate_limits()
-- manually or from an external scheduler if pg_cron isn't installed).

create or replace function public.prune_rate_limits()
returns void
language sql
as $$
  delete from public.rate_limits
   where window_start < now() - interval '1 day';
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'prune-rate-limits',
      '0 * * * *',
      'select public.prune_rate_limits()'
    );
  end if;
end
$$;
