# Doc 5 · Implementation Plan & Phasing — NorthStar Recycling AP/AR

## F5.1 · Phase breakdown
Proof (weeks 1–4): extraction accuracy proven on the golden set. Ship (weeks
5–10): both modules to production. Evolve is explicitly out of this fixed bid
(DEL-01 scope: Partial phasing).

## F5.2 · Module-to-phase mapping
Invoice Intake lands in Proof→Ship; Payment Matching ships in Ship (depends on
the EDI 820 spec, RAID-D02).

## F5.3 · Milestones & deliverables
M1: golden-set accuracy report (week 4). M2: Invoice Intake live (week 7).
M3: Payment Matching live + reconciliation week (week 10) (DEL-03).

## F5.4 · Sequencing & dependencies
CieTrade sync precedes everything; extraction precedes matching; EDI 820
ingestion is gated by RAID-D02 (DEL-04).

## F5.5 · Timeline view
Ten working weeks from credential delivery (RAID-D01), caveated by the RAID
assumptions (DEL-05).

## F5.6 · Resource & cost plan
One architect (50%), two engineers, one data lead (50%), QA (25%); cost basis
is the fixed bid per module (DEL-06).

## F5.7 · Communication plan
Weekly status call with the NSR Controller; decisions and escalations logged
in the decision log within 24 hours (DEL-07).

## F5.8 · Quality & acceptance plan
Test levels: unit, integration, E2E, UAT (QAT-01). Scenarios are enumerated
and tied to the module acceptance criteria (QAT-02) — including the duplicate
exception (A2) and the unmatched-remittance queue. Definition of Done per
story: code reviewed, tests green, scenario exercised (QAT-03). UAT runs on
NSR's own invoice corpus; acceptance ties to the payment milestones.

## F5.9 · Entry / exit criteria per phase
Proof exits at ≥ 94% field-level on the golden set, NSR Controller signed.
Ship exits at UAT sign-off with zero open Must defects (DEL-08).

## F5.10 · Support, warranty & maintenance
Warranty: 30 calendar days post-launch; covers defects against the signed
acceptance criteria; feature change requests go to change control (OPS-05).
Post-launch support: vendor-operated, business hours ET. Ongoing maintenance
beyond warranty is not in this fixed bid.

## F5.11 · Handover, documentation & adoption
Deliverables: runbook, admin guide, and the scored-evaluation procedure
(OPS-09). Knowledge transfer: two recorded handover sessions with NSR IT.

## F5.12 · Migration cutover & rollback
N-A — Migration = No: this is greenfield automation alongside the existing
process; there is no legacy cutover, rollback window, parallel run, or
decommission in scope (DAT-15–DAT-19 N-A with reason).
