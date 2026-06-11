# Doc 4 · RAID Register — NorthStar Recycling AP/AR

## F4.1 · Assumptions
| ID | Assumption | Impact-if-wrong | Owner |
|---|---|---|---|
| RAID-A07 | EDI 820 is X12 5010, single bank (RBC), daily SFTP drop, no 997 acks | Parser rework + trading-partner re-test, est. 1–2 weeks; gates the fixed price | Engagement lead |
| RAID-A09 | Unmatched remittance lines queue to the AP Manager (no auto-write-off) | Exception-queue volume balloons; staffing model revisited | NSR Controller |
| RAID-A12 | Below 80% field confidence, invoices route to the AP Clerk queue; behaviour stated but unexercised on real volume | Queue volume exceeds clerk capacity; confidence floor re-tuned via change control | Engagement lead |

## F4.2 · Dependencies
| ID | Dependency | Owner | By when |
|---|---|---|---|
| RAID-D01 | CieTrade sandbox tenant + read credentials (DAT-01) | NSR IT lead | 2026-06-20 |
| RAID-D02 | RBC EDI 820 spec sheet (closes RAID-A07) | NSR Controller | 2026-07-01 |
| RAID-D03 | 250-invoice golden set, labelled (DAT-06) | NSR Controller | 2026-06-25 |

## F4.3 · Risks
| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| RAID-R01 | CieTrade rate limit throttles sync during month-end burst | Medium | Medium | batch windows + backoff; verified in staging | Architect |
| RAID-R02 | Golden set is unrepresentative of vendor mix | Low | High | stratified sampling across the 95 vendors before labelling | Data lead |

## F4.4 · Open questions
None open. The register's questions are all CLOSED or dispositioned; the
resolution log below tracks them (RAID-Q).

## F4.5 · Open-question classification
Classification scheme applied per question in discovery/open-questions.md:
Must-close-before-estimate · Proceed-with-assumption ·
Minor-implementation-detail · Too-uncertain (exclude / T&M) · Future-phase
(RAID-Q).

## F4.6 · Resolution log / status
| Question | Status | Resolved |
|---|---|---|
| Q-31 (EDI 820 version) | Proceed-with-assumption → RAID-A07 | 2026-05-28 |
| Q-16 (low-confidence floor) | Proceed-with-assumption → RAID-A12 | 2026-05-29 |
| Q-21 (tax regimes closed-world) | Answered | 2026-06-02 |
| Q-25 (roles, sharpened) | Answered | 2026-05-27 |
