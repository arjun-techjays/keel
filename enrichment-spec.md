# Keel Enrichment Spec

*Extends `constitution.md` Part F. `keel-generate` writes the gated **skeleton**; `keel-enrich` expands each section to the depth defined here, adds the diagrams listed, and the render step emits a branded **.docx**. The skeleton stays the gated source of truth; enrichment is a **faithful presentation transform** — it never invents decisions. Proposed design is allowed but **tagged** `**Proposed — subject to change**` (the model the reference spec uses). Gaps are stated explicitly, never padded.*

*Version: v0.1 (draft for review).*

---

## Global depth rules — every doc, every section

- **Enumerate plurals (Law 13).** "the integrations", "the roles", "the reports" render as their named instances, each spelled out.
- **Table over prose** for any enumerable set (fields, rules, integrations, NFRs, risks, milestones…).
- **Minimum depth:** hit the section's depth target, or write an explicit gap note pointing at the discovery activity that closes it. No silent thinness.
- **Proposed design** derived from decided requirements is allowed but marked with a **discreet, professional inline note** — *(proposed; subject to change)* — never a bold banner, never a paragraph explaining the method. Decided facts are untagged.
- **Consultancy voice — never expose the tooling.** The document reads as a professional Techjays deliverable. It never references Keel, the pipeline, the "skeleton", the "gate", "keel-review/keel-generate", the `F{doc}.{n}` / `§` IDs, or internal process status. A reader must not be able to tell it was machine-generated or that an internal tool exists. (When the gate requires a draft marker, a plain **DRAFT** label is fine — never "awaiting keel-review".)
- **Source trace** renders as a `*Source: …*` suffix line, never in the body (Law 12). Internal pointers (RAID, other sections) stay.
- **Cross-doc joins preserved** (the consistency gate enforces): `DAT-07` bar identical in F2.11 & F3.3; `SCO-04` exclusions in F1.5/F2.14/F6.3; `ENG-03` across F2.4/F2.7/F2.12/F3.3/F3.4; `SCO-09` instances by name in their target sections.
- **Present-if-used sections** render when their dimensions are active, else omit with a one-line reason (UX block F2.19–23, F2.24 PRJ-*, F5.12 migration, RAID Issues).

## Doc-level — every document

- **Cover page (designed, full first page):** techjays logo · document title (large) · document type/subtitle · project name · version · date. **No status line, no internal terms.** The render builds it from each file's **YAML frontmatter** (`title`, `subtitle`, `project`, `version`, `date` — never `status`); it is not authored as body prose.
- **Introduction (the doc's first section):** Purpose · Audience · Definitions (only terms this doc needs; the rest point to the F2.16 glossary). A normal professional introduction — no meta-explanation of how the doc was produced.
- **Headings & numbering:** the rendered document uses clean, human, **sequentially numbered** headings (`1`, `1.1`, `2` …) per document. The internal `F{doc}.{n}` / `§` IDs stay in the source markdown for traceability and the gate, but the render **strips them for display** and Word auto-numbers — the TOC shows clean numbered titles with right-aligned page numbers. The strip also covers **inline `(F3.x)` / `§n` cross-references in prose** — author cross-refs as human section names, never IDs.
- **Figures:** numbered `Figure N — <caption>`, **all captions identically formatted** (one Caption style; never hand-bolded); every figure referenced in the prose near where it appears.
- Output is a single enriched markdown file per deliverable (carrying the frontmatter above), rendered to branded `.docx`.

## Figures, diagrams & readability — the render contract

- **Authoring:** diagrams are authored in the enriched markdown as fenced ` ```mermaid ` (preferred) or ` ```d2 ` blocks. Each block carries its caption as an in-source comment the renderer reads — `%% caption: <text>` (mermaid) or `# caption: <text>` (d2) — which the render step turns into `Figure N — <caption>`.
- **Decompose before drawing (the real readability fix):** complexity budget **≈ ≤15 nodes/entities per figure**. Over budget → split into one **overview** (clusters/domains, low detail) + **per-cluster drill-downs**, each page-legible. (The reference spec did exactly this: a system-wide ERD split into a map + per-domain detail.)
- **Tool routing by density:** Mermaid for small/medium (sequence, state, gantt, small flow); D2/Graphviz for dense (large ERD, large architecture).
- **Render:** PNG at **3× scale** via a **LOCAL / PRIVATE renderer** (mermaid-cli or self-hosted Kroki). **HARD privacy rule: never send diagram source to a public service (kroki.io, mermaid.ink) at render time.**
- **Layout:** diagrams render **inline at content width** and the text **flows naturally** after them — **no page rotation, no forced one-figure-per-page, no large empty gaps**. (Decomposition keeps figures small enough to sit in portrait; the rare too-big one gets the view-larger link below.)
- **View-larger link (only when the in-doc render is flagged not-readable** by a node-count / rendered-width heuristic): a caption link to **`https://mermaid.live/edit#pako:<encoded>`** (decoded client-side in the browser — source never hits a server). Dense D2 diagrams that can't be made legible ship instead as an **attached high-res SVG**.
- **"Figure sources" appendix:** every diagram's source is appended at the end of the doc — the durability backstop, so nothing depends on a third-party viewer staying up, and the team can re-edit offline.

## Output & branding

- Branded **.docx** via `pandoc <enriched.md> --reference-doc=techjays-reference.docx --toc -o <out>.docx`.
- **Typography:** **Oranienbaum** for headings, **Roboto** for body — both **embedded** in the .docx. **Few weights** (Roboto Regular + Medium; Oranienbaum is single-weight); establish hierarchy by **size, not weight** (max semibold — no heavy/black).
- **Color:** body text in a **soft dark grey** (never `#000`-on-`#fff` glare); headings and table-header fills in a **darker shade of the brand purple** chosen for **≥4.5:1 contrast** with white text; the light `#6872FF` is an accent only.
- **Spacing / breathing room:** generous space after paragraphs, tables, and figures; real table **cell padding**; clear separation between item types. Err toward whitespace.
- **Cover + header:** a designed cover page and a designed running header (logo + thin brand rule), not a bare logo; page numbers in the footer.
- `techjays-reference.docx` carries all of the above as Word styles + document properties + **embedded fonts**.

---

## Per-document depth specs

Section IDs are the `F{doc}.{n}` IDs from `constitution.md` Part F. "Std" = standard section (always present); "proj" = project-specific content/section.

### Doc 1 · Executive Summary — *≤2pp, skim-first, decision-oriented; "you/your" voice; written last*

| Sec | Depth target | Tables | Diagram | Scope / doctrine |
|---|---|---|---|---|
| F1.1 | 1 ¶ business driver in client's terms + trigger-to-act-now | — | — | std · decided |
| F1.2 | 1 ¶ current state + **quantified** cost of status quo | — | — | std |
| F1.3 | 1 ¶ future-state outcome, plain language | — | optional before→after strip | std |
| F1.4 | recommended approach as **Objectives · Approach · Outcomes** + Learn→Proof→Ship→Evolve | O/A/O 3-col | optional phase strip | std |
| F1.5 | modules + headline exclusions | scope-at-a-glance (Module·In·Out) | **context** (reused from F3.1) | std |
| F1.6 | pricing model high-level, ROI / cost range if known | — | — | std · mark proposed if no number |
| F1.7 | top 3–5 risks / assumptions | headline-risk (Risk·L·I) | optional mini heatmap | std · joins RAID |
| F1.8 | exact decision asked + what it unlocks | decision-ask callout box | — | std |

### Doc 2 · Scope — *the frozen heart; per-module depth; WBS + clear in/out. F2.3–F2.11 repeat per module.*

| Sec | Depth target | Tables | Diagram | Scope / doctrine |
|---|---|---|---|---|
| F2.1 | 1-sentence boundary | — | — | std |
| F2.2 | module decomposition | module / WBS table | **module map** (flowchart) | std |
| F2.3 *(per-module)* | current state actors/triggers/IO/pain + **happy-path worked example** | — | **current-state flow** | SCO-08: example or disposition |
| F2.4 *(pm)* | future AI process + HITL points | — | **future-state flow** | join ENG-03 |
| F2.5 *(pm)* | in / out enumerated | in/out-of-scope table | — | Law 1 |
| F2.6 *(pm)* | capability reqs, prioritised | requirements (Req·MoSCoW·Note) | — | std |
| F2.7 *(pm)* | **each named rule spelled out in full** | rules table / spelled list | optional decision flow | Laws 12–13 |
| F2.8 *(pm)* | exceptions + **edge/exception worked examples** | exceptions (Case·Handling) | optional | SCO-08: no class silent |
| F2.9 *(pm)* | key IO fields | data-field (Field·Type·R/W) | — | std |
| F2.10 *(pm)* | each system named | integration (System·Direction·Notes) | — | Law 13 · join F3.6 |
| F2.11 *(pm)* | measurable acceptance | acceptance (Criterion·Measure) | — | DAT-07 = F3.3 |
| F2.12 | AI-vs-deterministic line (governs all modules) | split (AI·Deterministic·Human) | **boundary** (reused F3.4) | std |
| F2.13 | each role named | RBAC (Role·Permissions) | — | Law 13 |
| F2.14 | cross-cutting exclusions | global out-of-scope list | — | join F6.3 |
| F2.15 | pointer to RAID | — | — | std (no dup) |
| F2.16 | each term defined once | glossary table | — | std |
| F2.17 | North Star + guardrails, each measurable | metrics (Metric·Target) | — | std |
| F2.18 | each report named | reporting (Report·Cadence·Audience) | — | Law 13 |
| F2.19–23 | UX matrix / inventory / fidelity / content / admin | per-section tables | screen/flow inventory | **present-if Discipline-2 active**, else N-A-reason |
| F2.24 | PRJ-* catch-all, by name | per-PRJ | per-PRJ | present-if-used |

### Doc 3 · Technical Architecture — *the model; answers HOW; the reference-spec analog*

| Sec | Depth target | Tables | Diagram (Mermaid) | Scope / doctrine |
|---|---|---|---|---|
| F3.1 | 2–4 ¶ system-in-context + end-to-end flow | — | **context** (flowchart) | std · decided |
| F3.2 | per-component responsibilities + one representative transaction walked step-by-step | component responsibilities (Component·Responsibility·Depends-on) | **component** + **sequence** | std · mark proposed if undecided |
| F3.3 | capability types, model/service, hosting, data-flow boundary | AI components (Capability·Model·Hosting·Accuracy-bar·Eval) | optional data-flow | std · DAT-07 = F2.11 |
| F3.4 | deterministic-vs-AI split, confidence floors, HITL points | thresholds (Decision·Floor·Below-floor action) | **AI/deterministic boundary** (decision nodes) | std |
| F3.5 | core entities, stores, field dictionary, data movement | entity dictionary (Entity·Role·Key-fields) + data stores (Store·Tech·Contents·Encryption) | **ERD** (erDiagram) | std skeleton, proj entities · heaviest |
| F3.6 | each integration spelled out (Law 13) | integration specs (System·Direction·Protocol·Auth·Limits·Constraints·Owner) | — | std skeleton, proj systems |
| F3.7 | measurable targets, no adjectives | NFRs (Category·Metric·Target·Measurement) | — | std |
| F3.8 | authN/Z, encryption, SSO, PII, residency, retention, audit, regs | safeguard mapping (Control·Mechanism) + encryption/retention; optional per-component sensitivity matrix | — | std · compliance mapping if regulated |
| F3.9 | deployment model + environments + release | environments (Env·Purpose·Region·Release) | optional deployment | std |
| F3.10 | each constraint + its design impact | constraints (Constraint·Source·Impact) | — | std |
| F3.11 | restricted actions, redaction, injection controls, no-irreversible-without-human | guardrails (Action·Restriction·Human-step) | — | std for AI |
| F3.12 | accuracy monitoring, alerting, retrain triggers | signals (Metric·Threshold·Action) | — | std for AI |
| F3.P | **project-specific subsystem deep-dives** — one sub-section per architecturally-significant subsystem, prose + own diagram | per-subsystem | per-subsystem | proj (PRJ-*) · present-if-used |

### Doc 4 · RAID — *tabular; L×I 1–5 scoring; heatmap green/yellow/red*

| Sec | Depth target | Tables | Diagram | Scope / doctrine |
|---|---|---|---|---|
| F4.1 | each assumption + impact-if-wrong + owner | assumptions table | — | std |
| F4.2 | each dependency + owner + by-when | dependencies table | — | std |
| F4.3 | risks scored **L×I (1–5)** + mitigation + owner + status | risk register (Likelihood·Impact·Score·Mitigation·Owner·Status) | **risk heatmap** (Mermaid quadrantChart) | std · uplift scoring |
| F4.x | **Issues** — open problems active now (the "I" in RAID) | issues table (Issue·Impact·Owner·Status) | — | **present-if-any**, else omit with reason |
| F4.4 | open questions, each classified | open-questions table | — | std |
| F4.5 | classification scheme applied | classification legend | — | std |
| F4.6 | each item tracked to closure | resolution log | — | std |

### Doc 5 · Implementation Plan — *WBS → RACI → Gantt; one Accountable per task*

| Sec | Depth target | Tables | Diagram | Scope / doctrine |
|---|---|---|---|---|
| F5.1 | Learn→Proof→Ship→Evolve goals | phase table | **phase breakdown** (flowchart/timeline) | std |
| F5.2 | which module in which phase + why | module→phase map | — | every in-scope module mapped |
| F5.3 | deliverables + decision points per phase | milestones (M#·Deliverable·Week) | optional milestone strip | std |
| F5.4 | build order + inter-dependencies | — | **dependency graph** (flowchart) | std |
| F5.5 | indicative schedule, RAID-caveated | — | **Gantt** (Mermaid gantt) | std |
| F5.6 | team shape + effort + cost basis | resource/cost + **RACI** (Task·R·A·C·I) | — | one Accountable per task |
| F5.7 | cadence / channels / stakeholders | comms table | — | std |
| F5.8 | quality + acceptance per phase | test-levels table + DoD | — | ties to F2.11 |
| F5.9 | entry / exit per phase | entry/exit table | — | std |
| F5.10 | support / warranty / maintenance | SLA table (Item·Window·Coverage) | — | std |
| F5.11 | handover / docs / adoption | deliverables + KT table | — | std |
| F5.12 | migration cutover / rollback | cutover table | optional cutover flow | **present-if Migration=Yes**, else N-A-reason |

### Doc 6 · Approval / Sign-off — *one-page formal gate; branding-critical*

| Sec | Depth target | Tables | Diagram | Scope / doctrine |
|---|---|---|---|---|
| F6.1 | scope-freeze statement | — | — | std |
| F6.2 | explicit what's-approved list | approved-baseline table (modules·rules·integrations·reports·bars) | — | std |
| F6.3 | each exclusion acknowledged | exclusions-ack table | — | join SCO-04 / F2.14 |
| F6.4 | PSRC review of the 7 lenses | PSRC checklist (Lens·Verdict) | — | std |
| F6.5 | change-control note | — | — | std |
| F6.6 | client + vendor signatories | signatory table | — | std |

---

## Required subsections — depth within each section

Every major section **drills into named subsections** (the reference spec's `3.2.1–3.2.6` model) — not one flat block. Subsections are derived from the actual content; the enrichment agent names them. Guidance for the **Technical Architecture** doc (apply the same drill-down principle to the other docs when the pack is enriched):

- **Solution overview** → System context · End-to-end flow.
- **Component architecture** → Components & responsibilities (table + diagram) · Representative transaction (sequence) · **a named subsection per architecturally-significant component** (role, inputs/outputs, dependencies).
- **Functional scope** *(new — present in Tech Arch)* → a short summary of the functional capabilities + a pointer: *"Functional requirements are specified in the Scope Document; summarized here."* The detailed FRs live in Doc 2; Tech Arch must not read as if the "what" is missing.
- **AI / ML approach** → Capabilities & models (table) · Data-flow boundary · Accuracy bar & evaluation.
- **Deterministic logic boundary** → AI-vs-deterministic split · Confidence thresholds & human-in-the-loop.
- **Data architecture & dictionary** → Entity model (ERD) · Entity dictionary (table) · Data stores (table) · Data movement.
- **Integration specifications** → one subsection (or table row) per named system — direction · protocol · auth · limits · constraints.
- **NFRs** → grouped by category (performance · availability · scalability · reliability), each measurable.
- **Security & compliance** → AuthN/Z · Encryption & key management · Data handling, residency & retention · Audit · Compliance mapping.
- **Environments & deployment** → Environments · Deployment & release.
- **Technical constraints** → each constraint + its design impact.
- **Responsible AI & guardrails** → restricted actions · redaction/safety · the no-irreversible-without-human rule.
- **Monitoring & drift** → Monitoring · Alerting · Drift & retraining triggers.
- **Project-specific subsystems** → a named deep-dive per significant subsystem.

### Other documents

- **Doc 1 · Executive Summary** — stays **concise (≤2pp); no deep sub-drilling** (over-sectioning defeats a summary). Depth comes from the **Objectives · Approach · Outcomes** treatment in the recommended-approach section, a scope-at-a-glance table, a headline-risk table, a decision-ask callout, and **stat cards** for the 2–3 headline numbers.
- **Doc 2 · Scope** — the per-module block (current state · future state · in/out · functional requirements · business rules · exceptions · data fields · integrations · acceptance) **is** the subsection structure, **repeated per module** (each module a numbered section). Add per-module **current/future flow diagrams** and a **status-lifecycle** diagram; spell every business rule out in full; exceptions / data-fields / integrations / acceptance as tables; scenario worked examples. The longest doc.
- **Doc 4 · RAID** — tabular; the sections (Assumptions · Dependencies · Risks · Issues · Open questions · Resolution log) are the structure. Risks carry **L×I (1–5) scoring** and a **risk heatmap** (Mermaid `quadrantChart`); Issues present-if-any; minimal further nesting.
- **Doc 5 · Implementation Plan** — drill where it helps: **Phase breakdown → a `###` subsection per phase (Learn · Proof · Ship · Evolve)** with its goal + entry/exit; plus module→phase map, milestones table, **dependency graph**, **Gantt timeline**, and a resource/cost + **RACI** table.
- **Doc 6 · Approval / Sign-off** — a **one-pager; stays flat**: freeze statement, what's-approved (table), exclusions acknowledgement (table), PSRC checklist (table), change-control note, signatory table. No sub-drilling.

## Callout / stat cards

Key numbers (acceptance bars, NFR targets, success metrics, headline risks) and short highlights render as **stat/callout cards** — a grey `#F2EEE4` box, square corners, with a big value, a mono label, and one supporting line. Author them in markdown as a fenced block the render converts:

```card
value: 99.5%
label: PIPELINE AVAILABILITY
note: Measured monthly against the production SLA.
```

The render turns each ` ```card ` block into the grey card. Use sparingly — only for the few numbers that deserve emphasis.
