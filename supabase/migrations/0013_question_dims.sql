-- Questions ledger (.keel/questions.md): questions now carry their own Q-ids
-- (OQ-01, RV1-02, …) and reference the constitution dimensions they concern in
-- a Dimensions column. The dashboard groups questions by discipline via these
-- dimension IDs (the q_id prefix alone is not a dimension ID anymore).

alter table questions add column if not exists dims text[] not null default '{}';
