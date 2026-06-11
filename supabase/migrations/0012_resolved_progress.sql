-- v1.4 (constitution Part B): a Gap/Partial dimension whose open question is
-- dispositioned (assumption / exclusion / deferral / T&M) is RESOLVED for
-- progress purposes — distinct from Covered (evidenced), but no longer
-- unresolved. Resolved % (covered + resolved over applicable) becomes the
-- headline progress number; Covered % stays as the evidence-only statistic.
-- `resolved` is orthogonal to `score` (a dim stays partial/gap AND resolved),
-- so it is a flag, not a new enum value.

alter table projects   add column if not exists resolved_count int not null default 0;
alter table projects   add column if not exists resolved_pct   int not null default 0;
alter table dimensions add column if not exists resolved       boolean not null default false;
