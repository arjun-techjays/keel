# Fixture engagements

Synthesized regression fixtures for the mechanical gates — no real client data.
They mirror the named-instance shape of the UAT-1 engagement (EDI 820, SAML,
CieTrade, 3-way matching, GST/HST/QST/PST) and exercise every v1.4 check.

- **`northstar-recycling/`** — the golden fixture: a fully resolved engagement
  (instance inventory with closed-world rows, scenario ledger, research briefs,
  a superseded→successor question pair, a `Partial — resolved (assumption …)`
  coverage row, a self-contained six-doc pack, and a review report with the
  Decision-reconciliation table). `check_generate` and `check_review` must
  exit 0 on it.
- **`northstar-violations/`** — the seeded-failure twin: one violation per new
  check (a "per §4.4 of the RFP" body, a SPECIFIED-but-unrendered instance, a
  missing `__CLOSED-WORLD__` row, an OPEN row without a DRAFT marker, a
  groundless N-A reason, an ASSUMPTION without its RAID-A link, a ledger module
  absent from the scope doc, a FREEZE-CLEAR report missing Decision
  reconciliation). Both checkers must exit 1, each with its expected string.

`checks/test_examples.sh` asserts all of the above and runs as part of
`checks/run_checks.sh`. If you change a checker or a fixture, keep them
reconciled — a violation that stops being caught is a regression.
