-- Keel phase 2 — storage buckets + KPI views

-- ---------------------------------------------------------------------------
-- Storage buckets (private; access via signed URLs minted by the service)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public) values
  ('snapshots',     'snapshots',     false),
  ('packs',         'packs',         false),
  ('uploads',       'uploads',       false),
  ('constitutions', 'constitutions', false)
on conflict (id) do nothing;

-- Authenticated staff may read objects in Keel buckets; writes go through the
-- service (service_role bypasses these policies).
create policy "read_keel_objects" on storage.objects
  for select to authenticated
  using (bucket_id in ('snapshots', 'packs', 'uploads', 'constitutions'));

-- ---------------------------------------------------------------------------
-- KPI views (security_invoker so they respect the caller's RLS)
-- ---------------------------------------------------------------------------

-- Per-project answer quality: answered vs. dispositioned-to-unblock.
create view v_project_quality with (security_invoker = true) as
select
  p.id   as project_id,
  p.name,
  count(q.*) filter (where q.disposition = 'answered')                                as answered,
  count(q.*) filter (where q.disposition in ('assumption', 'deferred', 'excluded'))   as dispositioned,
  count(q.*) filter (where q.disposition in ('unanswered', 'partial'))                as open_count,
  count(q.*)                                                                          as total
from projects p
left join questions q on q.project_id = p.id
group by p.id, p.name;

-- How items get closed, across all projects (the disposition mix).
create view v_close_mix with (security_invoker = true) as
select disposition, count(*) as count
from questions
where disposition <> 'unanswered'
group by disposition;

-- Per-person activity: answers vs. dispositions (the anti-gaming signal).
create view v_team_activity with (security_invoker = true) as
select
  pr.id   as actor_id,
  pr.full_name,
  pr.initials,
  count(d.*) filter (where d.kind = 'answer')                                  as answered,
  count(d.*) filter (where d.kind in ('assumption', 'exclusion', 'defer'))     as dispositioned
from profiles pr
left join decision_log d on d.actor_id = pr.id
group by pr.id, pr.full_name, pr.initials;
