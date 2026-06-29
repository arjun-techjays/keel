---
name: keel-enrich
description: "Run AFTER keel-generate, once the gated skeleton pack exists in deliverables/. Turns the six skeleton documents into a deep, branded pack: expands every Part F section to the depth target in enrichment-spec.md (rich prose, the required tables, worked examples, instances enumerated by name), authors the diagrams the spec lists (mermaid/d2, rendered locally and privately), and emits a branded .docx via the render module. A faithful presentation transform — it never invents a decision: proposed design is tagged **Proposed — subject to change**, every gap is stated explicitly, every external citation stays a `Source:` suffix (Law 12), every plural is enumerated by name (Law 13). The skeleton stays the gated source of truth; corrections go upstream, then re-generate, then re-enrich. Triggers on: 'enrich the pack', 'deepen the documents', 'make the pack client-ready', 'add the diagrams', 'render the branded docx', 'turn the skeleton into the full pack'."
---

# Keel · Enrich

Turns the gated **skeleton** into the **deep, branded** pack. It decides nothing — `keel-generate` already rendered every section from gated `.keel/` state; enrich only makes that material *legible and presentable*: it expands each section to its depth target, draws the diagrams, and emits the branded `.docx`. It is a **faithful presentation transform**. If a section can only reach its depth target by *inventing* a decision, it does not invent — it states the gap explicitly and tags any derived design `**Proposed — subject to change**`.

**The enriched docs are a derived render of the skeleton, which is a derived render of `.keel/`.** Enrich reads the six skeleton files in `deliverables/` and expands them in place. A hand-edit to an enriched file is **overwritten** the next time either skill runs — so any correction (a wrong number, a missing exclusion, a `keel-review` finding) belongs **upstream** in `.keel/decision-log.md` / `discovery/`, after which you re-run `keel-generate` (re-renders the skeleton) **then** `keel-enrich` (re-expands it). The only thing that ends edits is *freeze*.

## Precondition — a linked project

This folder must be **linked to an engagement** before enrich runs. Check for `.keel/project.json`. **If it is missing, STOP and run `/keel-connect` first** (one-time link).

This skill **manages checkout itself**: at the start (step 0) it calls `keel_pull(project_id)` to lock the project and download the latest shared state (the skeleton it expands lives in that snapshot), and at the end (step 6) it calls `keel_push(project_id, …, phase="generate")` — the enriched pack is still the six-doc pack, so the server re-runs the authoritative `check_generate` against it and records the branded render so the dashboard's Pack tab reflects the deep version. `/keel-pull` and `/keel-push` remain manual escape hatches (re-acquire after a `409`; push by hand if you edited `deliverables/` directly or auto-push failed). If the binding is present, continue.

## Gate — refuse if not met

There must be a **generated skeleton to expand**. Check `deliverables/` for the six files `1-executive-summary.md … 6-approval-and-signoff.md`. **If they are missing (or a doc is absent), STOP** — do not enrich nothing; point back to `/keel-generate` and report which files are missing. Enrich never substitutes for generation: it cannot manufacture a section the skeleton does not carry, because that section's content has not been decided.

Enrich does **not** re-run the generate gate (zero `[BLOCK]`) — the skeleton's existence means that gate was green when it was written. It **does** preserve the skeleton's status honestly: a pack the skeleton marked **DRAFT** stays DRAFT; an *owed / Partial / to-be-confirmed* note the skeleton carries is deepened *as a stated gap*, never papered over (that is "no silent depth", below). Freeze is still `keel-review` + sign-off, not enrich.

## Where files live

- Reads: **`enrichment-spec.md`** (project root, then kit root — the depth/figure/branding contract this skill executes), **`constitution.md`** (the Doctrine), the **skeleton** `deliverables/1-*.md … 6-*.md` (keel-generate's output — the gated source of truth this faithfully expands), `.keel/coverage-map.md` (the component/scoring list), `.keel/decision-log.md` (the decided facts), `.keel/instance-inventory.md` (the named instances, **read-only**), `.keel/questions.md` (open items to state explicitly as gaps), `.keel/scenario-coverage.md` (the `SCO-08` ledger — enriched `F2.3`/`F2.8` must stay consistent with it), and the `discovery/` evidence + `discovery/research/` briefs.
- `.keel/` is **read-only** here — enrich renders *from* it, never edits it (exactly as generate treats the instance inventory). The one file enrich owns is its working **Enrichment Brief** at `.keel/enrichment-brief.md` (step 1).
- Writes: the **enriched** six documents **in place** at `deliverables/1-*.md … 6-*.md` (the same canonical paths `keel-review` reads), the **diagram image assets** the render step rasterizes (`deliverables/assets/figures/`), and the branded **`.docx`** per document (`deliverables/docx/`).

## The standard — applied to the OUTPUT

Two files govern enrich; read both before expanding:
- **`enrichment-spec.md` is the contract.** It extends Part F with a per-document, per-section **depth target** (the prose, the required tables, the worked examples, the diagrams), the global depth rules, the figure/diagram/readability + **privacy** rules, and the output/branding rules. Expand against it section by section — do **not** improvise a depth per run.
- **The Doctrine (Part A) binds the prose you add.** Enriching multiplies the words, so it multiplies the chances to violate the Doctrine: no weasel words (the precision linter runs in step 4), every criterion still testable, **the pack stays self-contained** (Law 12 — every rule/threshold/enumeration spelled out in full at the point it binds; an external citation is a `*Source: …*` suffix line, never the body), and **every plural is enumerated by name** (Law 13 — *"the integrations"* renders as its named instances from `.keel/instance-inventory.md`, each spelled out).

Part F is the section map enrich must **preserve exactly** — every section the skeleton rendered stays (deepened); a present-if-used section the skeleton omitted-with-reason (the UX block `F2.19–23`, `F2.24` `PRJ-*`, `F5.12` migration, RAID Issues) stays omitted-with-reason. Enrich deepens content; it never adds or drops scope.

## Doctrine applied to enrichment

Three rules make this a *faithful transform*, not a second authoring pass:
- **No invention.** Every statement traces to decided state (decision log, coverage map, instance inventory) or the evidence. Enrich expands *what was decided*, in more words and better tables — it never settles an open question to make a section look complete.
- **Tag proposals.** Design derived from decided requirements but not itself decided (a component split, a sequence, a schema detail) is allowed and useful — written tagged **`**Proposed — subject to change**`** (the model the reference spec uses). Decided facts are untagged.
- **No silent depth.** A section that cannot reach its depth target from decided state carries an **explicit gap note** pointing at the discovery activity that closes it — never padding, never a vague filler paragraph. Thinness is stated, not hidden.

## Outputs

- The **enriched six documents** — every Part F section expanded to its `enrichment-spec.md` depth target, plus the doc-level additions the spec requires (cover/title block, `§0` Purpose · Audience · Definitions, numbered `Figure N — <caption>` references, and the **Figure sources appendix**).
- The **diagram image assets** (`deliverables/assets/figures/`) the render step produces from the fenced source.
- The branded **`.docx`** pack — rendered server-side by `keel_render` through `techjays-reference.docx` and returned as a signed download link (offline alternative: local `python -m app.render` → `deliverables/docx/`).

## Workflow

**0 · Pull / preconditions.** Confirm the linked project (`.keel/project.json`, else STOP → `/keel-connect`). Call `keel_pull(project_id)`; on **`409`** STOP and report the holder; on success lay down the snapshot if a `snapshot_url` is returned. Run the **Gate** above — refuse if the skeleton is absent. Read `enrichment-spec.md` and `constitution.md`.

**1 · Build the Enrichment Brief — the shared context for every agent.** Synthesise one brief at `.keel/enrichment-brief.md` from `.keel/coverage-map.md`, `.keel/decision-log.md`, `.keel/instance-inventory.md`, `.keel/questions.md`, `.keel/scenario-coverage.md`, and the `discovery/` evidence + research briefs. It carries: the **module/component list** (the names every doc and diagram must use identically); the **named instances** (integrations, roles, reports, rules — by name, with status); the **glossary** (decided terms); the **decided facts** routed by dimension ID; the **open gaps** to state explicitly; and the **diagram inventory** — every figure the spec requires across the pack, each with a global **figure number**, caption, home section, notation, and which docs reuse it. This brief is the single shared context that keeps the six per-doc agents and the diagram agent consistent — naming drift is what makes a multi-author pack read like several packs.

**2 · Per-doc depth agents (parallel).** Spawn **one sub-agent per deliverable (1–6)**, in parallel. Each receives: the path to `.keel/enrichment-brief.md`, the path to its skeleton doc, the `enrichment-spec.md` per-doc table for *its* document (the depth targets, required tables, and diagrams per section), read access to `.keel/` + `discovery/`, and the Doctrine rules above. Each agent **expands EVERY section** of its document to the spec's depth target — rich prose, the required tables, worked examples (`SCO-08`: the happy-path example into `F2.3`, exception/edge into `F2.8`, each traced to its source artifact or carrying its disposition), and **every plural enumerated by name** (Law 13) — strictly from decided state + the brief. It tags proposed design, states gaps explicitly, and writes source traces as `*Source: …*` suffix lines (never bodies, Law 12). Where the spec's Diagram column calls for a figure, the agent **slots and captions it** — `Figure N — <caption>` from the brief's inventory, referenced in the nearby prose — but leaves the **diagram source itself to the single diagram agent** (step 3). Each agent writes its enriched doc in place and returns a short report (sections expanded, figures slotted, gaps stated, proposed-tagged content). *(Doc 1 summarises from the brief/skeleton — decided state — so it runs in parallel with the rest; its reused figures are filled in step 3.)*

**3 · One diagram agent (cross-cutting) — owns ALL diagrams.** After the per-doc agents finish, spawn a **single** agent that authors every diagram across the pack, so the whole pack shares one visual language (same component names, notation, colours) — the reason one agent owns them. It reads the brief's diagram inventory + all six enriched docs and, for each figure slot, authors the fenced ` ```mermaid ` (preferred) or ` ```d2 ` block, applying the spec's rules:
- **Decompose before drawing** — complexity budget **≈ ≤15 nodes/entities** per figure; over budget → one **overview** (clusters/domains) + per-cluster **drill-downs**, each page-legible.
- **Tool routing by density** — Mermaid for small/medium (sequence, state, gantt, small flow, quadrant heatmap); D2/Graphviz for dense (large ERD, large architecture).
- **Privacy (HARD rule)** — diagrams render via a **LOCAL / PRIVATE** renderer at render time; **never send diagram source to a public service** (kroki.io, mermaid.ink). A "view larger" link is permitted **only** as `https://mermaid.live/edit#pako:<encoded>` (decoded client-side — source never hits a server); a dense D2 figure that can't be made legible ships as an attached high-res SVG instead.
- **Reused figures** are authored once and referenced wherever the brief lists reuse (the context diagram in `F3.1`/`F1.5`; the AI-vs-deterministic boundary in `F3.4`/`F2.12`; the risk heatmap in `F4.3`/`F1.7`).

It then appends the **Figure sources appendix** to each doc (every diagram's source — the durability backstop) and returns the figure manifest.

**4 · Consistency + doctrine gate — fix, then re-run until clean.** Validate the enriched pack and fix any failure before rendering:
- **Cross-doc joins agree** (the same checks `review` will run): `DAT-07` — the AI accuracy bar reads identically in `F2.11` and `F3.3`; `SCO-04` — every global exclusion in `F1.5`/`F2.14` is acknowledged in `F6.3`; `ENG-03` — the AI-vs-deterministic boundary tells one story across `F2.4`/`F2.7`/`F2.12`/`F3.3`/`F3.4`; `SCO-09` — every specified instance appears **by name** in its host section, every excluded one rolls up to `F6.3`.
- **Precision linter** — no weasel word survived the expansion (replace each with the resolved number/enumeration).
- **No unmarked invention** — every non-decided statement is either traced or tagged `**Proposed — subject to change**`.
- **Depth-or-explicit-gap** — every section meets its spec depth target or carries a stated gap note (no silent thinness, no padding).
- **Structure preserved** — every Part F section the skeleton carried is present and deepened; present-if-used omissions are unchanged.
- **Figures** — every figure is numbered, referenced in prose near where it appears, page-legible (decompose applied), and present in the Figure sources appendix; component names match the brief pack-wide.

A presentation defect (a diagram naming a component differently, a missed enumeration, a weasel word) is **fixed here** — re-run the responsible per-doc or diagram agent. A *missing-decision* defect is **not** fixed by inventing — it is stated as a gap (and is a `keel-review` / `keel-clarify` matter upstream). Then run the bundled gate mechanically — the enriched pack is still the six-doc pack, so `check_generate` is its backstop:
```bash
python3 <kit>/checks/check_generate.py <engagement-dir> <constitution.md>
```
(`<kit>/checks/` sits beside the `constitution.md` you loaded; if it isn't present, say so and skip, noting the pack is unverified.) A **non-zero exit is a defect you fix now** — a dropped section, a weasel word the expansion introduced, a DRAFT-honesty miss, an instance-inventory or `SCO-08`-ledger mismatch the enriched prose drifted from. Print its output in the summary so the lead sees the machine verdict.

**5 · Push — check the enriched pack back in.** The server renders from the latest snapshot, so push *before* rendering. The push re-runs the authoritative gate against the enriched pack. Use the **begin → PUT → finish** flow — **never base64-encode the zip or read it into context; that stalls the agent and the push never lands**:
```bash
zip -r .keel/_push.zip .keel discovery deliverables -x '.keel/_push.zip'
```
- `keel_push_begin(project_id, phase="generate")` → `version` + `upload_url`
- `curl -sS -X PUT "<upload_url>" --data-binary @.keel/_push.zip -H "Content-Type: application/zip"`
- `keel_push_finish(project_id, version, phase="generate")`

Then `rm -f .keel/_push.zip`. Report the `gate` verdict **verbatim** and the snapshot `version`; `keel_push_finish` releases the lock. *(No dedicated `enrich` server phase — enrich reuses `generate`; its output is still the six-doc pack `check_generate` validates and the Pack tab records — now the branded version.)* On a transport/`409` failure, retry by hand with `/keel-push` (phase `generate`).

**6 · Render the branded `.docx` — server-side, no local toolchain.** Call **`keel_render(project_id)`**. The service renders the just-pushed enriched pack through `pandoc` + the techjays reference doc, **rasterises the diagrams with its own local renderer** (the privacy rule holds — diagram source never leaves the service), bundles the six branded `.docx`, and returns a signed **`download_url`**. **Report that URL to the user — it is the client-ready pack** (it also surfaces in the dashboard's Pack tab). Rendering only reads the latest snapshot, so it needs no lock. *(Offline/dev alternative, only if you have pandoc + mermaid-cli installed locally: `cd service && python -m app.render ../deliverables --reference-doc ../assets/branding/techjays-reference.docx --out ../deliverables/docx`. Never route diagram source to a public service.)*

## Handoff

`keel-review` reads the **enriched** six documents at the same `deliverables/` paths and red-teams them as a hostile client before freeze — its lenses operate on meaning, so the deeper prose and enumerated instances give it more to probe, not less. Any finding it raises flows upstream through `keel-clarify` → `keel-generate` → `keel-enrich`, never a hand-edit of the rendered docs.

## Loop position

```
keel-generate ─► deliverables/*.md   (the gated SKELETON — source of truth)
        │
        ▼
keel-enrich   ─► deliverables/*.md   (deepened in place) + assets/figures/ + docx/
        │            (faithful transform: no invention · proposals tagged · gaps stated)
        ▼
keel-review   (red-teams the enriched pack)
        │   findings ─► open-questions ─► clarify ─► RE-generate ─► RE-enrich
        ▼
freeze + sign-off
```

## Render & assets — in place

The render path is **live**: **`keel_render(project_id)`** (MCP) renders server-side via `service/app/render.py` + `assets/branding/techjays-reference.docx` (techjays cover, embedded fonts, editorial tables, local diagram rendering) and returns a signed download URL. There is no dedicated `enrich` server phase — enrich pushes `phase="generate"` (its output is still the six-doc pack the gate validates). The local `python -m app.render` CLI remains an offline/dev alternative for anyone who has pandoc + mermaid-cli installed.
