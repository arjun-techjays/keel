-- Keel phase 2 — demo seed (idempotent-ish; safe to run on a fresh project).
-- Assignees are left null (no auth users seeded); they get set in-app once
-- people sign in. Project/method IDs are fixed so URLs are stable.

-- Constitution -------------------------------------------------------------
insert into constitutions (id, version, label, status) values
  ('c0000000-0000-0000-0000-000000000001', 'v4.2', 'Techjays standard', 'active')
on conflict (id) do nothing;

-- Projects -----------------------------------------------------------------
insert into projects
  (id, name, client, constitution_id, freeze_status, coverage_pct, covered_count, total_dims, block_count, open_questions)
values
  ('11111111-1111-1111-1111-111111111111', 'Northwind Field CRM', 'Northwind Traders', 'c0000000-0000-0000-0000-000000000001', 'draft',          87,  94, 108, 3, 11),
  ('22222222-2222-2222-2222-222222222222', 'Atlas Logistics Portal', 'Atlas Freight Co.', 'c0000000-0000-0000-0000-000000000001', 'frozen',        100, 96,  96, 0,  0),
  ('33333333-3333-3333-3333-333333333333', 'Vela Patient Intake', 'Vela Health',         'c0000000-0000-0000-0000-000000000001', 'draft',          61, 74, 121, 9, 28),
  ('44444444-4444-4444-4444-444444444444', 'Orion Billing Revamp', 'Orion Telecom',       'c0000000-0000-0000-0000-000000000001', 'draft',          92, 88,  96, 1,  4)
on conflict (id) do nothing;

-- Northwind dimensions -----------------------------------------------------
insert into dimensions (project_id, dim_id, discipline_id, name, score) values
  ('11111111-1111-1111-1111-111111111111', 'SCO-01', 'SCO', 'Primary user roles & journeys',            'covered'),
  ('11111111-1111-1111-1111-111111111111', 'SCO-05', 'SCO', 'In-scope feature inventory',               'covered'),
  ('11111111-1111-1111-1111-111111111111', 'SCO-08', 'SCO', 'Scenario coverage (happy/exception/edge)', 'partial'),
  ('11111111-1111-1111-1111-111111111111', 'SCO-12', 'SCO', 'Explicit out-of-scope list',               'covered'),
  ('11111111-1111-1111-1111-111111111111', 'DAT-03', 'DAT', 'Data model & entities',                    'covered'),
  ('11111111-1111-1111-1111-111111111111', 'DAT-07', 'DAT', 'PII storage & data residency',             'gap'),
  ('11111111-1111-1111-1111-111111111111', 'DAT-09', 'DAT', 'Lawful basis & retention',                 'gap'),
  ('11111111-1111-1111-1111-111111111111', 'DAT-11', 'DAT', 'Data migration & seeding',                 'partial'),
  ('11111111-1111-1111-1111-111111111111', 'ARC-02', 'ARC', 'Deployment topology',                      'covered'),
  ('11111111-1111-1111-1111-111111111111', 'ARC-04', 'ARC', 'Tenancy & isolation model',                'covered'),
  ('11111111-1111-1111-1111-111111111111', 'ARC-09', 'ARC', 'Failure & recovery design',                'partial'),
  ('11111111-1111-1111-1111-111111111111', 'SEC-03', 'SEC', 'Authentication & session model',           'partial'),
  ('11111111-1111-1111-1111-111111111111', 'SEC-06', 'SEC', 'Infosec policy & pen-test cadence',        'covered'),
  ('11111111-1111-1111-1111-111111111111', 'SEC-08', 'SEC', 'Incident response & breach SLA',           'gap'),
  ('11111111-1111-1111-1111-111111111111', 'INT-02', 'INT', 'ERP integration handshake',                'covered'),
  ('11111111-1111-1111-1111-111111111111', 'INT-05', 'INT', 'Sync & conflict resolution',               'partial'),
  ('11111111-1111-1111-1111-111111111111', 'RAID-01', 'RAID', 'Top delivery risks',                     'covered'),
  ('11111111-1111-1111-1111-111111111111', 'RAID-04', 'RAID', 'External dependencies',                  'covered')
on conflict (project_id, dim_id) do nothing;

-- Northwind research methods ----------------------------------------------
insert into research_methods (id, project_id, icon, name, focus, gathers) values
  ('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'interview', 'Stakeholder interview', 'Data & Compliance', 'PII handling, residency, retention, lawful basis'),
  ('a1000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'workshop',  'Technical workshop', 'Integration & Architecture', 'ERP handshake, sync policy, tenancy model'),
  ('a1000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'document',  'Document review', 'Security policies', 'Infosec policy, pen-test cadence, IR & breach SLA'),
  ('a1000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'session',   'Product & scope session', 'Scope', 'Edge scenarios, in/out-of-scope modules'),
  ('a1000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'estimate',  'Capacity & NFR estimate', 'Non-functional', 'Peak load, growth, performance budgets')
on conflict (id) do nothing;

-- Northwind questions ------------------------------------------------------
insert into questions (project_id, q_id, method_id, text, tag, disposition, disposition_label) values
  ('11111111-1111-1111-1111-111111111111', 'DAT-07', 'a1000000-0000-0000-0000-000000000001', 'Where is customer PII stored, and which data-residency regime applies?', 'BLOCK', 'unanswered', 'Unanswered'),
  ('11111111-1111-1111-1111-111111111111', 'DAT-09', 'a1000000-0000-0000-0000-000000000001', 'Lawful basis and retention period per data class?', 'BLOCK', 'unanswered', 'Unanswered'),
  ('11111111-1111-1111-1111-111111111111', 'SEC-03', 'a1000000-0000-0000-0000-000000000001', 'Auth method for field reps working offline?', 'PARTIAL', 'partial', 'Vague — needs detail'),
  ('11111111-1111-1111-1111-111111111111', 'ARC-04', 'a1000000-0000-0000-0000-000000000002', 'Tenancy model — single vs multi-tenant isolation?', null, 'answered', 'Answered'),
  ('11111111-1111-1111-1111-111111111111', 'INT-02', 'a1000000-0000-0000-0000-000000000002', 'ERP integration auth handshake — confirm token exchange flow.', null, 'deferred', 'Deferred · T&M'),
  ('11111111-1111-1111-1111-111111111111', 'INT-05', 'a1000000-0000-0000-0000-000000000002', 'Sync frequency and conflict-resolution policy for offline mode?', null, 'unanswered', 'Unanswered'),
  ('11111111-1111-1111-1111-111111111111', 'SEC-06', 'a1000000-0000-0000-0000-000000000003', 'Existing infosec policy and pen-test cadence?', null, 'answered', 'Answered'),
  ('11111111-1111-1111-1111-111111111111', 'SEC-08', 'a1000000-0000-0000-0000-000000000003', 'Incident response and breach-notification SLA?', null, 'unanswered', 'Unanswered'),
  ('11111111-1111-1111-1111-111111111111', 'SCO-08', 'a1000000-0000-0000-0000-000000000004', 'Exception & edge scenarios for offline sync conflicts not exampled.', 'PARTIAL', 'partial', 'Vague — needs example'),
  ('11111111-1111-1111-1111-111111111111', 'SCO-11', 'a1000000-0000-0000-0000-000000000004', 'In-scope vs out-of-scope reporting modules?', null, 'unanswered', 'Unanswered'),
  ('11111111-1111-1111-1111-111111111111', 'NFR-05', 'a1000000-0000-0000-0000-000000000005', 'Peak concurrent users expected at launch and at 12 months?', null, 'assumption', 'Assumption')
on conflict (project_id, q_id) do nothing;

-- Northwind review run + findings -----------------------------------------
insert into review_runs (id, project_id, verdict, high, med, low, probed, total_sections) values
  ('b1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'FREEZE-BLOCKED', 2, 3, 1, 19, 20)
on conflict (id) do nothing;

insert into review_findings (run_id, project_id, finding_id, severity, title, refs, detail, status) values
  ('b1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'R-01', 'high', 'PII residency unstated — lets scope expand silently post-sign-off', array['F2.3','DAT-07'], 'No residency regime or storage region is committed.', 'open'),
  ('b1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'R-02', 'high', 'Offline sync conflict policy undefined — unbounded edge work', array['INT-05','SCO-08'], 'Conflict resolution for offline edits is neither exampled nor dispositioned.', 'open'),
  ('b1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'R-03', 'med', 'Auth for offline field reps only partially specified', array['SEC-03'], 'Token lifetime and re-auth on reconnect are vague.', 'probed'),
  ('b1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'R-04', 'med', 'Capacity is an assumption, not a measurement', array['NFR-05'], 'Peak concurrency dispositioned as an assumption.', 'probed'),
  ('b1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'R-05', 'med', 'Incident-response SLA missing from security scope', array['SEC-08'], 'Breach-notification obligations could pull in monitoring work.', 'open'),
  ('b1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'R-06', 'low', 'Out-of-scope list could be firmer on reporting modules', array['SCO-12'], 'Reporting boundary stated but not enumerated.', 'probed')
on conflict do nothing;
