-- Keel phase 2 — core schema
-- Canonical state lives here (Postgres). The Python service runs the gates and
-- writes results back; the Next.js app reads most of this directly via RLS.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

-- 1:1 with auth.users. Domain restriction is enforced at the auth layer
-- (Google provider + allowed domain); this mirrors the profile for app use.
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text unique not null,
  full_name   text,
  initials    text,
  color       text not null default '#14161A',
  role        text not null default 'member' check (role in ('admin', 'member')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- The standard (versioned IP)
-- ---------------------------------------------------------------------------

create table constitutions (
  id             uuid primary key default gen_random_uuid(),
  version        text not null,                 -- e.g. 'v4.2'
  label          text,
  storage_path   text,                          -- constitution.md in Storage
  checks_version text,                           -- pinned checks bundle id
  status         text not null default 'active'
                 check (status in ('draft', 'active', 'archived')),
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Engagements
-- ---------------------------------------------------------------------------

create type freeze_status as enum ('draft', 'frozen', 'frozen_blocked');

create table projects (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  client          text,
  constitution_id uuid references constitutions,
  freeze_status   freeze_status not null default 'draft',
  coverage_pct    int not null default 0,
  covered_count   int not null default 0,
  total_dims      int not null default 0,
  block_count     int not null default 0,
  open_questions  int not null default 0,
  created_by      uuid references profiles,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Checkout: locks + snapshots
-- ---------------------------------------------------------------------------

-- One lock row per project. Whole-project, single mutator.
-- Lazy reclaim: TTL expiry sets status='reclaimable' (not reassigned); the
-- original holder may reclaim if uncontended, else the next puller wins.
create table locks (
  project_id       uuid primary key references projects on delete cascade,
  holder_id        uuid references profiles,
  phase            text,
  snapshot_version int,
  acquired_at      timestamptz not null default now(),
  heartbeat_at     timestamptz not null default now(),
  status           text not null default 'held'
                   check (status in ('held', 'reclaimable', 'released'))
);

-- Pulled/pushed file bundle (stored in Storage). Push creates a new version.
create table snapshots (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects on delete cascade,
  version      int not null,
  storage_path text not null,
  created_by   uuid references profiles,
  gate_result  jsonb,
  created_at   timestamptz not null default now(),
  unique (project_id, version)
);

-- ---------------------------------------------------------------------------
-- Coverage state (dimensions)
-- ---------------------------------------------------------------------------

create type score as enum ('covered', 'partial', 'gap', 'na');

create table dimensions (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references projects on delete cascade,
  dim_id        text not null,                  -- 'DAT-07'
  discipline_id text not null,                  -- 'DAT'
  name          text not null,
  score         score not null default 'gap',
  evidence      text,
  updated_at    timestamptz not null default now(),
  unique (project_id, dim_id)
);

-- ---------------------------------------------------------------------------
-- Clarify: research methods + questions
-- ---------------------------------------------------------------------------

create table research_methods (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects on delete cascade,
  method_key  text,
  icon        text,                             -- interview|workshop|document|session|estimate
  name        text not null,
  focus       text,
  gathers     text,
  assignee_id uuid references profiles,
  created_at  timestamptz not null default now()
);

create type disposition as enum
  ('unanswered', 'answered', 'partial', 'assumption', 'deferred', 'excluded');

create table questions (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid references projects on delete cascade,
  q_id              text not null,              -- 'DAT-07'
  method_id         uuid references research_methods on delete set null,
  dimension_id      uuid references dimensions on delete set null,
  text              text not null,
  tag               text check (tag in ('BLOCK', 'PARTIAL')),
  disposition       disposition not null default 'unanswered',
  disposition_label text,
  answer_text       text,
  answer_file_path  text,                       -- uploaded file in Storage
  assignee_id       uuid references profiles,
  closed_at         timestamptz,
  updated_at        timestamptz not null default now(),
  unique (project_id, q_id)
);

-- Append-only record of decisions/dispositions (the canonical fix path).
create table decision_log (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade,
  ref_id     text,                              -- dimension/question id
  kind       text not null,                     -- answer|assumption|exclusion|defer
  summary    text,
  actor_id   uuid references profiles,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Deliverables (renders) + review
-- ---------------------------------------------------------------------------

create table renders (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects on delete cascade,
  version      int not null,
  storage_path text,                            -- rendered 6-doc pack
  gate_result  jsonb,
  created_at   timestamptz not null default now()
);

create type severity as enum ('high', 'med', 'low');

create table review_runs (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references projects on delete cascade,
  verdict        text not null,
  high           int not null default 0,
  med            int not null default 0,
  low            int not null default 0,
  probed         int not null default 0,
  total_sections int not null default 0,
  created_at     timestamptz not null default now()
);

create table review_findings (
  id         uuid primary key default gen_random_uuid(),
  run_id     uuid references review_runs on delete cascade,
  project_id uuid references projects on delete cascade,
  finding_id text,
  severity   severity not null,
  title      text not null,
  refs       text[],
  detail     text,
  status     text check (status in ('open', 'probed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Activity (audit trail + presence + KPI source)
-- ---------------------------------------------------------------------------

create table activity (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade,
  actor_id   uuid references profiles,
  action     text not null,                     -- pull|push|answer|disposition|assign|release|...
  target     text,                              -- e.g. 'DAT-07'
  meta       jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index on dimensions (project_id);
create index on research_methods (project_id);
create index on questions (project_id);
create index on questions (assignee_id);
create index on decision_log (project_id);
create index on review_findings (project_id);
create index on activity (project_id, created_at desc);
create index on activity (actor_id);
create index on snapshots (project_id, version desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_projects_updated   before update on projects
  for each row execute function set_updated_at();
create trigger trg_dimensions_updated before update on dimensions
  for each row execute function set_updated_at();
create trigger trg_questions_updated  before update on questions
  for each row execute function set_updated_at();
