-- Keel phase 2 — lease-expiry sweep
-- Belt-and-suspenders to the lazy reclaim in pull(): a held lock whose heartbeat
-- has gone stale becomes 'reclaimable' (NOT reassigned — the next puller wins it).
--
-- pg_cron must be enabled for this project (Supabase: Database → Extensions →
-- enable "pg_cron"). If the extension isn't enabled yet, run that first.

create extension if not exists pg_cron;

create or replace function expire_stale_locks()
returns void language sql as $$
  update locks
     set status = 'reclaimable'
   where status = 'held'
     and heartbeat_at < now() - interval '15 minutes';
$$;

-- Run every minute.
select cron.schedule('keel-lease-sweep', '* * * * *', $$select expire_stale_locks();$$);
