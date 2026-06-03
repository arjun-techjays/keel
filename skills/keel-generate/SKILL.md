---
name: keel-generate
description: "Run only when the gate is green (zero [BLOCK] open questions). Writes the six-document discovery pack — Executive Summary, Scope, Technical Architecture, RAID, Implementation Plan, Approval/Sign-off — straight from the re-scored coverage map and the decision log. Pulls precise values from resolved decisions (never invents, never softens), enforces the Doctrine on its own output (no weasel words, measurable acceptance criteria, explicit exclusions), validates cross-document consistency, and marks the pack a DRAFT until the freeze prerequisites are met. Triggers on: 'generate the pack', 'write the discovery documents', 'produce the scope document', 'draft the proposal pack', 'we're ready — write it up'."
---

# Keel · Generate

Turns the resolved engagement into the deliverable. It does not decide anything — every statement is sourced from a closed question, a disposition, or a covered dimension. If it would have to invent or soften to fill a section, that section isn't ready, and the gate should have caught it.

**The six docs are derived artifacts, not source.** They are re-rendered from `.keel/` state (`coverage-map.md` + `decision-log.md`) on every run — so a hand-edit to a file in `deliverables/` is **overwritten** the next time this runs. Any correction (including a `keel-review` fix) belongs **upstream** — in `.keel/decision-log.md`, `discovery/open-questions.md`, or a fresh discovery round — and then re-generates into the docs. The only thing that ends edits is *freeze* (after which changes are change-control, not regeneration).

## Where files live

- Reads: `discovery/open-questions.md` (gate check), `.keel/coverage-map.md` (re-scored), `.keel/decision-log.md`, and the evidence corpus.
- Writes: the **six documents of the pack as six separate files** in `deliverables/` (create the folder if absent). These are the first user-facing outputs — they belong in the visible deliverables folder, not inside `.keel/`. Also writes **`.keel/scenario-coverage.md`** — the machine-readable `SCO-08` scenario ledger (internal machinery; see *The scenario ledger* below).

## Gate — refuse if not met

Read `discovery/open-questions.md`. **If any [BLOCK] remains, STOP** — do not write the pack; point back to `keel-clarify` and report the count. Also count undecided Recommended dimensions and report them as a freeze prerequisite (they do not stop generation, but the pack stays a DRAFT until they're decided).

## The standard — applied to the OUTPUT

Read `constitution.md` (project root, then kit root). Two parts govern this skill:
- **Part F — The Pack Structure** is the **rendering target**: it lists, per document, the exact sections (Key section · What it should cover · Owner) and their order. Render against it — do **not** improvise a structure per run.
- **The Doctrine** governs what you *write* into those sections: no weasel words (run the precision linter), every module carries a measurable acceptance criterion, every exclusion is stated (silence is not inclusion), every statement traces to its source (Law 6).

Part D (the dimension catalog) is the *completeness* target; Part F is the *document* target. Every Covered dimension lands in its mapped Part F section; every section is populated from covered dimensions + the decision log, never invented.

## Outputs

The pack is **six separate documents**, written to `deliverables/` as six files — not one combined file, **each structured exactly per its Part F table**:

1. `deliverables/1-executive-summary.md` — Executive Summary / Engagement Brief (Part F · Doc 1, 8 sections)
2. `deliverables/2-scope.md` — Scope Document incl. Requirements (Part F · Doc 2; §3–11 repeat **per module**)
3. `deliverables/3-technical-architecture.md` — Technical Architecture & Solution Design (Part F · Doc 3, 12 sections)
4. `deliverables/4-raid.md` — RAID Register (Part F · Doc 4, 6 sections)
5. `deliverables/5-implementation-plan.md` — Implementation Plan & Phasing (Part F · Doc 5, 9 sections)
6. `deliverables/6-approval-and-signoff.md` — Approval / Sign-off Page (Part F · Doc 6, 6 sections)

Write **all six** every run — never a single `discovery-pack.md`, never a subset, and **never drop a Part F section silently** (a missing section is an exclusion that must be deliberate — Law 1 applied to the pack's own structure). You may *add* engagement-specific sections beyond the Part F list where the material needs them. If a section's source dimensions are still Partial, write the section anyway, stating plainly what is owed and pointing at the responsible discovery activity (it does not get silently merged away). "The pack" is the collective name for these six files, not a seventh file.

## Workflow

**0 · Gate check** (above). **1 · Confirm the coverage map is current** — if the evidence changed since the last score, re-run `keel-map` first.

**2 · Build in dependency order, each doc to its Part F skeleton.** RAID and Scope first (assumptions, exclusions, modules, acceptance criteria from the decision log + covered dimensions) → Architecture and Implementation Plan (the "how" and the sequencing of that scope) → Executive Summary and Approval (which summarise and freeze the rest). Within each file, lay down **every section from that document's Part F table, in order**, then fill it — for `2-scope.md`, repeat sections `F2.3–F2.11` once per module in the breakdown.

**3 · Source every statement — route by the crosswalk.** Pull exact values from resolved decisions; cite the source (a decision-log dimension ID, a coverage dimension, an input artifact). Use Part F's **Renders from** column as the routing table: each section is filled from the dimension IDs it lists, and **every Covered dimension must appear in at least one section that lists its ID** (invert the crosswalk to find its home). A Covered dimension with no rendered home is a generation defect — the coverage guarantee (Part G) says it must have a Part F section. Never write what wasn't decided.

**4 · Apply the Doctrine to the draft.** Precision linter (replace any vague term with the resolved number/enumeration); confirm every module has a measurable acceptance criterion; confirm every exclusion is explicit.

**5 · Cross-document consistency — the anti-creep sub-gates.** These run *across the six files*, joining on **dimension IDs** via Part F's Renders-from columns (Part G lists the multi-section joins); validate, and fix or flag any failure:
- **structure:** each document contains every section from its Part F table, in order (and `2-scope.md` has the `F2.3–F2.11` block once per module) — no Part F section dropped silently;
- **coverage:** every Covered dimension is rendered into ≥1 section that lists its ID (invert the crosswalk) — nothing covered-but-unwritten;
- **`DAT-07` join:** the AI accuracy bar reads identically in `F2.11` (Scope acceptance) and `F3.3` (AI/ML);
- **`SCO-08` scenario join (Law 11):** per module, render the **happy-path scenario into `F2.3`** and the **exception + edge scenarios into `F2.8`** — each as either a real worked example (citing its source artifact) or its explicit disposition (out / N-A-with-reason / assumption); the two sections must concern the *same* workflow. A module scored `SCO-08` Covered shows, for every class, an example or a disposition — **no class left blank**. If `SCO-08` is Partial, write what exists and state plainly which class is claimed-but-unevidenced and the discovery activity that closes it — **never render a module scope-ready with a scenario class left in silence** (an explicit "no edge case, because X" is fine; a blank is not);
- **`SCO-04` / `COM-07` join:** every global exclusion in `F1.5` / `F2.14` is acknowledged in `F6.3`;
- every in-scope module (`F2.2`) appears in the phase mapping (`F5.2`) — no orphan modules;
- every integration named (`F2.10`) has an integration spec in `F3.6` (`ENG-04`);
- every assumption in the decision log (`RAID-A`) appears in `F4.1`;
- nothing marked N-A appears as in-scope work;
- each resolved conflict reads consistently across every document that touches it.

**6 · Emit** all six files to `deliverables/`, **and write `.keel/scenario-coverage.md`** (the SCO-08 ledger, below), plus a short traceability note and the **freeze prerequisites**, and print the list of files written. Confirm in the summary that all six exist — if any is missing, generation is incomplete.

**7 · Self-verify mechanically — run the checks, don't hand off unverified.** After emitting, run the bundled gate against this engagement and act on the result:
```bash
python3 <kit>/checks/check_generate.py <engagement-dir> <constitution.md>
```
(`<kit>/checks/` sits next to the `constitution.md` you loaded; if the kit's `checks/` isn't present — e.g. only the constitution was copied into the project — say so and skip, noting the pack is unverified.) A **non-zero exit is a generation defect you fix now**, not something to leave for CI or the human: a dropped Part F section, a weasel word, a DRAFT-honesty miss, or — the SCO-08 ledger — a SILENT scenario / missing class / untraceable example. Fix upstream (decision-log / re-render) and re-run until the gate is green or every remaining failure is a genuine, reported freeze-prerequisite. Print the check output in the summary so the lead sees the machine verdict, not just your assertion.

## The scenario ledger (`SCO-08`, Law 11) — the mechanical artifact

Prose in the scope doc is for humans; **`.keel/scenario-coverage.md` is the machine-checkable proof** that no scenario passes in silence. Emit it as one row per **module × scenario class**, drawn from the decision log + coverage map — it must agree with what you rendered into `F2.3`/`F2.8`:

```
# Scenario Coverage Ledger — SCO-08 / Law 11   (generated by keel-generate, <date>)

| Module | Scenario | Status | Evidence / disposition |
|---|---|---|---|
| Invoice Intake | happy     | EXAMPLE    | A3 — invoice_sample.pdf |
| Invoice Intake | exception | EXAMPLE    | A4 — duplicate_invoice.pdf |
| Invoice Intake | edge      | NA         | single-currency only; client confirmed no FX edge |
| Approval       | happy     | EXAMPLE    | A7 — approval_flow, kickoff transcript |
| Approval       | exception | ASSUMPTION | RAID-A12 — over-threshold routes to manager |
| Approval       | edge      | EXCLUDED   | multi-approver chains out of scope; client acknowledges |
| Config Screen  | all       | NA         | static config; no process workflow |
```

**Status vocabulary (the checker enforces exactly these):**
- `EXAMPLE` — a real worked example; **evidence must cite the artifact by its registered `A#` id** from `.keel/asset-manifest.md` (e.g. `A4`), optionally with a filename/label. The checker **cross-checks that id against the manifest and fails any id not registered there** — so prefer the `A#` id over a bare filename, which passes the provenance floor but can't be cross-checked. Law 6 / Law 8.
- `ASSUMPTION` — a stated behaviour with no artifact; **evidence must reference a `RAID-A` item** (impact-if-wrong lives there). Law 4.
- `EXCLUDED` — the scenario is out of scope; evidence states the **client acknowledgement**.
- `NA` — the class genuinely doesn't apply; evidence states the **reason** (Law 10). For a module with no process workflow at all, use one row `| <module> | all | NA | <reason> |`.
- `SILENT` — **forbidden.** Claimed-handled but neither exampled nor dispositioned. Emit it only to make a known hole explicit (the checker will fail on it — that is the point); never use it to pad a module to three rows.

**Every in-scope process module has exactly three class rows** (happy/exception/edge), or one module-level `all · NA` row. A missing class is silence and fails the gate. The **exception** class is the one that matters most — never let it ride on `SILENT`.

## Two gates, kept distinct

- **Generate gate:** zero [BLOCK] questions → the pack may be written.
- **Freeze gate:** `keel-review` passes with no high-severity finding **and** every Recommended dimension is decided **and** the client signs. Until then the pack is a **DRAFT**. `keel-generate` writes it; `keel-review` + sign-off freeze it.

## Handoff

`keel-review` reads the six documents and red-teams them as a hostile client looking for residual ambiguity and silent inclusions, before freeze.
