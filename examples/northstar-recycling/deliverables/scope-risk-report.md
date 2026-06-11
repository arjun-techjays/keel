# Scope Risk Report — NorthStar Recycling AP/AR   (keel-review, round 2, 2026-06-08)

**Verdict: 🟢 FREEZE-CLEAR** — High findings: 0 · Medium: 0 · Low: 0 · full coverage.

All round-1 findings were dispositioned through clarify and re-rendered; this
round surfaced no new findings. The pack reads as definitive: every rule is
spelled out in place, every plural is enumerated against the instance
inventory, and every scenario class is exampled or dispositioned.

## Decision reconciliation

Every decision-log entry located in the rendered pack and checked for drift.

| Decision / dimension | Rendered location | Verdict |
|---|---|---|
| DAT-07 — ≥ 94% field-level on the 250-invoice golden set | F2.11 and F3.3 | match (verbatim in both) |
| ENG-04 — CieTrade REST v2, OAuth2, 600 req/min | F2.10, F3.6 | match |
| ENG-04 — EDI 820 X12 5010 assumption (RAID-A07) | F2.10, F3.6, F4.1 | match |
| SEC-01 — AP Clerk / AP Manager roles via SAML SSO | F2.13, F3.8 | match |
| SCO-09 — GST/HST/QST in, PST excluded with acknowledgement | F2.7, F2.14, F6.3 | match |
| ENG-03 — extraction probabilistic; matching/tax deterministic; release human-only | F2.12, F3.4 | match |
| DAT-09 — sub-80% confidence routes to AP Clerk queue (RAID-A12) | F2.8, F3.4, F4.1 | match |
| OPS-05 — 30-day warranty, defects-only | F5.10, F6.3 | match |
| PRD-09 — AP Aging report + Daily Reconciliation summary, closed-world | F2.18 | match |

## Coverage ledger

Every Part F section of every document was probed end-to-end.

| Section | Result |
|---|---|
| F1.1 | clean |
| F1.2 | clean |
| F1.3 | clean |
| F1.4 | clean |
| F1.5 | clean |
| F1.6 | clean |
| F1.7 | clean |
| F1.8 | clean |
| F2.1 | clean |
| F2.2 | clean |
| F2.3 | clean |
| F2.4 | clean |
| F2.5 | clean |
| F2.6 | clean |
| F2.7 | clean |
| F2.8 | clean |
| F2.9 | clean |
| F2.10 | clean |
| F2.11 | clean |
| F2.12 | clean |
| F2.13 | clean |
| F2.14 | clean |
| F2.15 | clean |
| F2.16 | clean |
| F2.17 | clean |
| F2.18 | clean |
| F2.19 | clean (N-A with reason) |
| F2.20 | clean (N-A with reason) |
| F2.21 | clean (N-A with reason) |
| F2.22 | clean (N-A with reason) |
| F2.23 | clean (N-A with reason) |
| F3.1 | clean |
| F3.2 | clean |
| F3.3 | clean |
| F3.4 | clean |
| F3.5 | clean |
| F3.6 | clean |
| F3.7 | clean |
| F3.8 | clean |
| F3.9 | clean |
| F3.10 | clean |
| F3.11 | clean |
| F3.12 | clean |
| F4.1 | clean |
| F4.2 | clean |
| F4.3 | clean |
| F4.4 | clean |
| F4.5 | clean |
| F4.6 | clean |
| F5.1 | clean |
| F5.2 | clean |
| F5.3 | clean |
| F5.4 | clean |
| F5.5 | clean |
| F5.6 | clean |
| F5.7 | clean |
| F5.8 | clean |
| F5.9 | clean |
| F5.10 | clean |
| F5.11 | clean |
| F5.12 | clean (N-A with reason) |
| F6.1 | clean |
| F6.2 | clean |
| F6.3 | clean |
| F6.4 | clean |
| F6.5 | clean |
| F6.6 | clean |

## Action plan

Nothing owed. Freeze prerequisites: every Recommended dimension is decided and
the bank spec sheet (RAID-D02) remains a tracked dependency — its arrival
either validates RAID-A07 or triggers change control.
