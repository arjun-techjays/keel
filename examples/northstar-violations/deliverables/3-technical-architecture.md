# Doc 3 · Technical Architecture & Solution Design — NorthStar Recycling AP/AR

## F3.1 · Solution overview & context diagram
A vendor-cloud pipeline sits between invoice intake (email/SFTP), the
extraction service, the rules engine, and CieTrade; staff interact only
through CieTrade's existing screens (ENG-01).

## F3.2 · Component architecture
Components: intake listener → extraction service → rules engine (matching,
tax, duplicates) → CieTrade sync → exception queue. A representative
transaction flows end-to-end in under five minutes (ENG-02).

## F3.3 · AI / ML approach
Extraction only (AI/ML = Extraction): a hosted document-extraction model
produces header and line fields with per-field confidence. Accuracy bar:
extraction accuracy ≥ 94% field-level on the 250-invoice golden set (DAT-07).
Evaluation: monthly scored run against the golden set; the NSR Controller
signs the result (DAT-08, DAT-06). Model/vendor change is change-controlled.

## F3.4 · Deterministic logic boundary
Everything after extraction is deterministic and unit-testable: coding, 3-way
matching with the ±2%/CAD 25 tolerance, tie-breaking, tax splitting, duplicate
detection. Confidence floor: below 80% field confidence the document routes to
the AP Clerk queue (DAT-09, DAT-10).

## F3.5 · Data architecture & dictionary
Core entities: Invoice, InvoiceLine, PurchaseOrder, ReceivingRecord,
RemittanceFile, MatchResult. Master field list maintained with the schema;
CieTrade is the system of record for vendor/PO/receiving data (ENG-06,
DAT-01).

## F3.6 · Integration specifications
One entry per named system (ENG-04, SCO-09):
- **CieTrade** — read (vendor, PO, receiving): REST v2, OAuth2
  client-credentials, 600 req/min, sandbox available; NSR IT owns the tenant.
- **EDI 820** — read (remittance): X12 5010 via daily SFTP drop from RBC;
  no 997 acknowledgments. Assumption RAID-A07 until the bank spec sheet lands.
- **SAML SSO** — staff sign-in: SP-initiated SAML 2.0 against Okta; NSR IT
  owns provisioning.

## F3.7 · Non-functional requirements (NFRs)
Throughput: 1,100 invoices/month with bursts of 120/day (PRD-07). Pipeline
availability 99.5% monthly. End-to-end intake-to-queue latency p95 ≤ 5
minutes (ENG-07).

## F3.8 · Security & compliance
AuthN via SAML SSO (Okta); AuthZ per role — AP Clerk and AP Manager as defined
in the Scope Document (SEC-01). Data is Financial-sensitivity: encrypted in
transit (TLS 1.2+) and at rest (AES-256). No regulated regime applies.

## F3.9 · Environments & deployment
Vendor-cloud, ca-central region: dev, staging, production; weekly release
train during build, change-controlled after launch (ENG-11).

## F3.10 · Technical constraints
CieTrade REST v2 rate limit (600 req/min) caps sync frequency; the bank's SFTP
window (04:00–06:00 ET) fixes the remittance ingestion schedule (ENG-08).

## F3.11 · Responsible AI & guardrails
The extraction model never finalises an irreversible action: payment release
and match override are human-only, and every override carries a recorded
reason (DAT-10).

## F3.12 · Monitoring & drift (Evolve)
Monthly golden-set scoring doubles as drift detection; a score below 94%
field-level opens a defect, not a renegotiation (DAT-08).
