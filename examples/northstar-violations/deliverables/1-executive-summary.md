# Doc 1 · Executive Summary / Engagement Brief — NorthStar Recycling AP/AR

## F1.1 · Engagement context & business driver
NorthStar Recycling processes ~1,100 vendor invoices a month by hand against
CieTrade records; coding errors and duplicate payments triggered this
engagement (PRD-01). The trigger to act now is the 2026 audit cycle.
*Source: A1 — RFP §1; A4 kickoff call.*

## F1.2 · Current-state summary
AP clerks re-key invoice data into CieTrade and match payments manually;
duplicates are caught late and remittance files are reconciled by hand (PRD-01,
SCO-02). The cost of the status quo is ~3 FTE-days per week plus duplicate-payment exposure.

## F1.3 · Future-state vision
Invoices are extracted automatically, matched 3-way against purchase order and
receiving record, and queued for human approval; staff handle only exceptions
(PRD-04, ENG-01).

## F1.4 · Recommended approach
Two fixed-bid modules — Invoice Intake and Payment Matching — delivered
Proof → Ship, with extraction accuracy proven against a golden set before
ship (COM-01, DEL-01).

## F1.5 · Scope at a glance
Modules: Invoice Intake, Payment Matching (SCO-01, SCO-02). Headline
exclusions: PST handling, multi-B/S split invoices, FX/multi-currency
(SCO-04). Detail lives in the Scope Document.

## F1.6 · Commercial model note
Both modules are fixed-bid; the EDI 820 bank-spec assumption (RAID-A07) gates
the price (COM-01).

## F1.7 · Key risks & assumptions (headline)
EDI 820 bank spec unconfirmed (RAID-A07); low-confidence routing behaviour
unexercised on real volume (RAID-A12); CieTrade sandbox availability is a
dependency (RAID-D01). Full list in the RAID Register.

## F1.8 · Decision requested
Approve the enumerated baseline in this pack as the fixed-bid scope; PSRC
approval precedes client sign-off (COM-06).
