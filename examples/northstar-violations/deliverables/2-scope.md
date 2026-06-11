# Doc 2 · Scope Document — NorthStar Recycling AP/AR

## F2.1 · Scope statement
Automate NorthStar Recycling's accounts-payable intake and payment matching for
CAD-denominated vendor invoices flowing through CieTrade, with human approval
on every payment release (SCO-01).

## F2.2 · Module breakdown
Two modules, each independently sign-off-able (SCO-02):
1. **Invoice Intake** — receive, extract, code, and queue vendor invoices.
2. **Payment Matching** — ingest EDI 820 remittance files and match payments
   3-way against purchase order and receiving record.

## F2.3 · Per-module: Current state
**Invoice Intake** — invoices arrive by email; clerks re-key header and line
fields into CieTrade. Happy-path worked example: the kickoff walkthrough of a
standard vendor invoice from receipt to coded entry (SCO-08). *Source: A1, A4.*
**Payment Matching** — remittance files are printed and ticked off by hand.
Happy-path worked example: matched-invoice walkthrough (SCO-08). *Source: A5.*

## F2.4 · Per-module: Future state
AI extracts header and line fields with per-field confidence; deterministic
rules code, match, and split tax; an AP Clerk reviews the queue and an AP
Manager approves release — the AI never posts a payment (ENG-03, DAT-10).

## F2.5 · Per-module: In scope / Out of scope
**Invoice Intake — in:** PDF and scanned-image invoices, CAD only, single
ship-to per invoice. **Out:** FX/multi-currency, handwritten invoices,
multi-B/S split invoices (SCO-03, SCO-09).
**Payment Matching — in:** EDI 820 remittance ingestion (single bank), 3-way
match, exception queue. **Out:** payment initiation, bank reconciliation
beyond AP (SCO-03).

## F2.6 · Per-module: Functional requirements
Each capability is tagged Must/Should/Could/Won't (SCO-07, PRD-04): extraction
(Must), duplicate detection (Must), 3-way match (Must), tax split (Must),
exception queue (Must), aging visibility (Should).

## F2.7 · Per-module: Business rules
Spelled out in full (Law 12, Law 13):
- **3-way matching rule:** an invoice line matches when vendor, PO line, and
  receiving record agree within a tolerance of ±2% or CAD 25, whichever is
  lower. **Tie-breaking:** when two open PO lines both match, the earliest PO
  line date wins; if dates are equal, the lowest PO line number wins.
  **Override path:** only the AP Manager may override a failed match, with a
  recorded reason.
- **Duplicate rule:** same vendor + invoice number + amount within 365 days is
  a duplicate; duplicates queue to the AP Manager and are never auto-posted.
- **Tax split rules (per line, rounding half-up):** GST 5% on all taxable
  lines; HST 13% where ship-to is Ontario (replaces GST); QST 9.975% on the
  GST-exclusive amount where ship-to is Quebec. PST is excluded — NorthStar
  has no BC/SK/MB operations (acknowledged at sign-off).
*Source: decision log ENG-03, SCO-09; brief RB-03.*

## F2.8 · Per-module: Exceptions
**Invoice Intake — exception:** duplicate invoice, demonstrated by worked
example A2 (duplicate-invoice-sample.pdf). Below 80% field confidence the
invoice routes to the AP Clerk queue (DAT-09; assumption RAID-A12 — behaviour
stated, unexercised on real volume). **Edge:** no FX edge exists — invoices
are single-currency CAD only, confirmed by the NSR Controller 2026-06-02
(SCO-08; an explicit no-edge decision, not silence).
**Payment Matching — exception:** unmatched remittance lines queue to the AP
Manager (assumption RAID-A09 with impact-if-wrong). **Edge:** multi-B/S split
invoices are out of scope; client acknowledged 2026-05-28.

## F2.9 · Per-module: Data fields
Header: vendor, invoice number, invoice date, PO number, currency, totals.
Line: description, quantity, unit price, tax code, GL code (ENG-06).

## F2.10 · Per-module: Integrations
Every system named individually (SCO-09, ENG-04):
- **CieTrade** — read-only pull of vendor/PO/receiving data, every 15 minutes.
- **EDI 820** — daily remittance file from RBC via SFTP (assumption RAID-A07:
  X12 5010).
- **SAML SSO** — staff sign-in via Okta, SP-initiated.
The closed-world question is answered: NSR IT confirmed on 2026-05-27 that no
other systems touch AP/AR.

## F2.11 · Per-module: Acceptance criteria
**Invoice Intake:** extraction accuracy ≥ 94% field-level on the 250-invoice
golden set (DAT-07); zero duplicates auto-posted across the UAT corpus
(SCO-05). **Payment Matching:** 100% of remittance lines either matched within
tolerance or queued — none silently dropped (SCO-05).

## F2.12 · AI vs deterministic responsibility split
AI: field extraction only (probabilistic, with per-field confidence).
Deterministic: coding, 3-way matching, tie-breaking, tax splitting, duplicate
detection. Human-only: payment release and match override (ENG-03, DAT-10).

## F2.13 · User roles & permissions
Every role named individually (SEC-01, SCO-09): **AP Clerk** — work the queue,
code invoices, submit for approval. **AP Manager** — approve release, override
failed matches with reason, release exceptions. Closed-world confirmed: two
roles only; no read-only auditor role in v1.

## F2.14 · Global out-of-scope
PST handling and PST filings; multi-B/S split invoices; FX/multi-currency;
payment initiation; vendor onboarding (SCO-04, PRD-05).

## F2.15 · Assumptions reference
Assumptions are owned in the RAID Register (RAID-A); this document does not
duplicate them.

## F2.16 · Glossary of terms
**3-way match** — invoice ⇄ purchase order ⇄ receiving record agreement within
tolerance. **Remittance advice** — the bank's EDI 820 statement of payments
applied. **Golden set** — the 250-invoice scored evaluation corpus (SCO-06).

## F2.17 · Success metrics
North Star: ≥ 70% of invoices touchless from receipt to approval queue within
90 days of launch. Guardrails: zero duplicate payments; 100% of payments
human-approved (PRD-02).

## F2.18 · Reporting & analytics scope
In scope, each named (PRD-09, SCO-09): **AP Aging report** (weekly, AP Manager
audience) and **Daily Reconciliation summary** (daily, Controller audience).
Closed-world confirmed: exactly these two; anything further is change control.

## F2.19 · UX — platforms, responsive & browser matrix
N-A — Surface is Batch/Pipeline: no human-facing screens are built; review
happens inside CieTrade's existing UI (UXD-01 N-A with reason).

## F2.20 · UX — screen/flow inventory & state coverage
N-A — no screens are built in this engagement (UXD-02, UXD-03 N-A with reason).

## F2.21 · UX — design fidelity, system, revisions & brand
N-A — no design deliverables in scope (UXD-04, UXD-05, UXD-06 N-A with reason).

## F2.22 · UX — content, accessibility & i18n
N-A — no interface content is authored; Languages = Single (UXD-07, UXD-08,
UXD-09 N-A with reason).

## F2.23 · UX — admin & human-review surfaces
N-A — the human-review queue is realized inside CieTrade's existing screens,
not a new console (UXD-14, UXD-15 N-A with reason).

Matching tolerances and tie-breaking are handled per §4.4 of the RFP.
