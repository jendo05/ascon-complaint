-- Run only after enabling the pg_cron extension in your Supabase project.
-- This schedules the three-day escalation function once per day at midnight (database timezone).
select cron.schedule(
  'serviceflow-auto-escalate',
  '0 0 * * *',
  'select public.escalate_stale_complaints();'
);
