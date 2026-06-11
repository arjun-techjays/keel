# RB-03 — Canadian sales tax regimes (GST/HST/QST/PST)   (keel-map research, 2026-06-01)

**Why it matters here.** SCO-09 · class: Tax regimes; renders into the
per-module business rules (F2.7). The RFP names the four regimes in one line
(A1 §5.2) — without per-regime rules the tax split is an unpriced plural.

**What the research found** *(sourced; fixture URLs illustrative)*
- GST: 5% federal, applies everywhere. HST: harmonized (e.g. Ontario 13%)
  replaces GST+PST in participating provinces. QST: Quebec, 9.975%, calculated
  on the GST-exclusive amount since 2013. PST: separate provincial tax in
  BC/SK/MB only. (canada.ca GST/HST rates page; revenuquebec.ca QST basics —
  accessed 2026-06-01)

**The decision space**
- Which regimes can actually appear on NSR invoices (ship-to provinces).
- Per-line vs per-invoice split; rounding rule (half-up per line is typical).

**Questions for the lead** *(each with example answers)*
1. Which provinces does NSR ship to — e.g. **ON+QC only**, **all provinces**?
2. Split per line or per invoice — e.g. **per line, half-up rounding**?
3. Are GST, HST, QST, PST **all** the regimes NSR invoices can carry — closed-world?

**Suggested default assumption** — ON+QC operations: GST/HST/QST in scope, per
line, half-up; PST out. *Impact-if-wrong:* tax engine rework + re-filing risk
for the client.
