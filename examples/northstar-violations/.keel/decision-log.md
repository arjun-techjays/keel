# Decision Log — NorthStar Recycling AP/AR   (written by keel-clarify)

| Dimension(s) | Decision | Provenance | Disposition | Owner | Date |
|---|---|---|---|---|---|
| DAT-07 | Extraction accuracy bar: ≥ 94% field-level on the 250-invoice golden set | NSR Controller email, 2026-05-26 | Answered | NSR Controller | 2026-05-26 |
| ENG-04 | CieTrade: read-only REST v2, OAuth2 client-credentials, 600 req/min, sandbox available, NSR IT owns the other side | CieTrade vendor docs + NSR IT call, 2026-05-27 (RB-02) | Answered | NSR IT lead | 2026-05-27 |
| ENG-04 | EDI 820: X12 5010, single bank (RBC), SFTP drop daily — proceeding on assumption RAID-A07 until the bank spec sheet arrives | RB-01 research + lead decision, 2026-05-28 | Assumption | Engagement lead | 2026-05-28 |
| SEC-01 | Roles: AP Clerk (queue, code, submit) and AP Manager (approve, override, exception release); SAML SSO via Okta | NSR IT call, 2026-05-27 | Answered | NSR IT lead | 2026-05-27 |
| SCO-09 | Tax regimes in scope: GST, HST, QST; PST excluded — NSR has no BC/SK/MB operations, client acknowledged | NSR Controller, 2026-06-02 (RB-03) | Answered | NSR Controller | 2026-06-02 |
| ENG-03 | AI extracts header + line fields (probabilistic); 3-way matching, tax splitting, and tie-breaking are deterministic rules; payment release is human-only | workshop, 2026-05-29 | Answered | Architect | 2026-05-29 |
| DAT-09 | Low-confidence (< 80% field confidence) routes to the AP Clerk queue; behaviour stated but unexercised — assumption RAID-A12 with impact-if-wrong | workshop, 2026-05-29 | Assumption | Engagement lead | 2026-05-29 |
| OPS-05 | Warranty: 30 calendar days post-launch; covers defects against signed acceptance criteria; feature change requests go to change control | lead decision, 2026-06-03 | Answered | Engagement lead | 2026-06-03 |
| PRD-09 | Reports in scope: AP Aging report, Daily Reconciliation summary — both named, list closed-world confirmed | NSR Controller, 2026-06-02 | Answered | NSR Controller | 2026-06-02 |
