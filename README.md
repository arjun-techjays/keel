# Keel

*A spec-discovery pipeline that turns raw, messy inputs into a precise, internally-consistent, scope-creep-proof discovery pack — and refuses to let you freeze a pack with holes in it.*

Keel kills **scope creep** at its source: incomplete and imprecise discovery. It works the way GitHub's Spec Kit works for code — a gated pipeline over a fixed standard — but for design-and-discovery documentation, the kind a fixed-bid engagement is priced against.

## The problem

Scope creep has exactly two entry points:

- **Silence** — anything not explicitly decided gets assumed *in* by the client.
- **Ambiguity** — anything decided imprecisely gets interpreted broadly later.

Keel attacks both. It maximises coverage of the decision space against an exhaustive, conditional completeness model (fights silence), and forces every statement to be unambiguous and testable (fights ambiguity).

## The standard — `constitution.md`

Everything runs against `constitution.md`, the reusable, versioned IP. Edit it to your org's standard; every run consumes it. It has seven parts:

| Part | What it is |
|---|---|
| **A · The Doctrine** | Eleven laws every artifact must obey — silence-is-exclusion, every-criterion-testable, no-weasel-words, every-gap-dispositioned, full traceability, conflicts-surfaced-not-resolved, coverage-judged-against-the-full-corpus, applicability-is-explicit, no-scenario-passes-in-silence. |
| **B · Applicability** | How each dimension resolves to **Required / Conditional / Recommended / N-A**, with the teeth: *present-but-vague = Partial* (blocks like a Gap), and an *undecided Recommended* blocks the gate. |
| **C · The Project Profile** | The 16 axes (Surface, AI/ML, Data sensitivity, Regulated, Tenancy, Commercial model, Phasing…) that drive every applicability rule. |
| **D · The Dimension Catalog** | ~108 dimensions across 11 disciplines + RAID, each with a stable **ID** (`DAT-07`, `SCO-05`), an *Applies-when* rule, and a concrete *"Covered means"* bar. |
| **E · How the Skills Consume This** | The contract for each phase. |
| **F · The Pack Structure** | The six deliverable documents and their 66 sections, each with an **`F{doc}.{n}` ID** and a **Renders from** column naming the dimensions that fill it. |
| **G · The Crosswalk** | The dimension ↔ section join (read both ways), and the coverage guarantee: **every dimension has a Part F home, or freeze is blocked.** |

The stable IDs are the join key the whole pipeline relies on — skills reference `DAT-07`, never the prose label, so cross-references can't drift.

## The four skills

Run in order; each hands off to the next **through files** — skills never call each other.

| Invoke | What it does | Its gate |
|---|---|---|
| `/keel-map` | Audits inputs against the constitution → coverage map (every applicable dimension scored Covered / Partial / Gap, by ID), open questions, discovery plan, asset manifest. | Confirms the project profile before scoring. |
| `/keel-clarify` | Ingests discovery answers — pasted, dropped as files, or answered **one-question-at-a-time in the terminal** — and drives every open item to CLOSED or an explicit disposition (assumption / exclusion / defer / T&M). | Reports the `[BLOCK]` count remaining. |
| `/keel-generate` | Renders the six-document pack against Part F, routing each covered dimension into its mapped section via the crosswalk, with cross-document consistency. | Refuses unless `[BLOCK] = 0`. |
| `/keel-review` | Adversarial red-team of all six docs → severity-ranked Scope Risk Report + freeze verdict; feeds its findings back into the open-questions register. | Any High **or** an un-probed section → FREEZE-BLOCKED. |

> These install flat, so they invoke as `/keel-map`, `/keel-clarify`, etc.

### Three more skills for the shared platform (git-like checkout)

When you run against Keel's hosted, shared state over the remote MCP server (rather than purely local files), three checkout skills wrap the four above:

| Invoke | What it does | Its gate |
|---|---|---|
| `/keel-connect` | **Once per folder.** Lists the engagements you can edit and links this folder to the one you pick (`.keel/project.json`); shows where the project stands. Does **not** lock or download. Projects are created in the web app; this only selects one. | The four skills above refuse to run until a project is linked. |
| `/keel-pull` | **Start of every session.** Checks the project out: acquires the whole-project lock (everyone else view-only) and downloads the latest snapshot. Returning later → just `/keel-pull` again, no re-connect. | `409` if someone else holds the lock — only one mutator at a time. |
| `/keel-push` | **End of session.** Zips `.keel/ discovery/ deliverables/`, uploads via MCP, runs the **real server-side gate** (generate, then review), updates the shared dashboards, and **releases the lock**. | A red gate is reported; fix upstream and push again. |

The lock is held from `/keel-pull` to `/keel-push` (or a manual release / ~15-min idle auto-free) — that's the whole-project, single-mutator model. Full setup and a fresh-project-to-PDF walkthrough live in the in-app **Guide → §6 (Using Keel from Claude Code or Codex)**. For local-only use (no platform), skip these three and run the four skills directly on local files.

### The six deliverable documents (Part F)

`1` Executive Summary · `2` Scope (incl. Requirements) · `3` Technical Architecture · `4` RAID Register · `5` Implementation Plan · `6` Approval / Sign-off — written to `deliverables/` as six separate files, each structured to its Part F section list.

### Enriching to a branded deliverable (`/keel-enrich`)

A fifth skill, **`/keel-enrich`**, turns the gated skeleton into the **client-ready document**: it expands every section to full depth (named sub-sections, tables, worked examples), authors the diagrams (context, component, ERDs, flows, Gantt, risk heatmap), and renders a **branded Word `.docx`** — techjays cover, embedded fonts, editorial tables, and stat cards — against `enrichment-spec.md` (depth) and `design-system.md` (the editorial visual standard). The skeleton stays the gated source of truth; enrichment is a **faithful presentation transform** — it never invents decisions (proposed design is marked, gaps are stated). Run it once the pack is clean (post-`keel-review`).

### The loop

Each line below is marked by who acts. **You invoke the skills and supply the discovery; the kit writes every artifact (the coverage map, the questions, the pack).** You never author those files yourself.

```
Legend:   👤 you do this      ⚙️ the kit does this (inside a skill run)

👤  drop the client's materials into the project
        │
        ▼
⚙️  /keel-map        writes the coverage map + open questions + discovery plan   ← you don't author these
        │
        ▼
👤  run the discovery the plan recommends; bring back answers + artifacts
        │
        ▼
⚙️  /keel-clarify    closes each open item — you answer it, or pick a disposition
        │            ↺ re-run /keel-map to re-score · loop until [BLOCK] = 0
        ▼
⚙️  /keel-generate   writes the six-document pack, then self-checks it
        │
        ▼
⚙️  /keel-review     red-teams the pack → findings flow back into the register
        │            ↺ /keel-clarify → re-generate → re-review · until 0 High + full coverage
        ▼
⚙️  /keel-enrich     expands + diagrams + renders the branded .docx (client-ready)
        │
        ▼
👤  make the Recommended decisions, sign, freeze     =  FROZEN, signable baseline
```

So your hands-on work is only the four 👤 lines: invoke a phase, do the real discovery, answer/decide, and sign. Everything labelled ⚙️ — scoring, writing files, running the Python checks — happens for you inside the skill run.

Two gates, kept distinct: the **generate gate** (`[BLOCK] = 0`) and the **freeze gate** (review clears with 0 High and full coverage **and** every Recommended dimension is decided **and** the client signs). Until then the pack is a DRAFT.

One disposition path: whether a gap is found by `keel-map` or by `keel-review`, it lands in `open-questions.md` and is driven to a terminal state by `keel-clarify` — never a parallel fix path. Fixes go **upstream** (decision log / discovery), then re-render; the `deliverables/` are disposable renders and are never hand-edited.

## Who does what — automated vs. manual

The same split as the loop's 👤/⚙️ markers, spelled out as a reference:

**You do (manual):**
- **Invoke each phase** — `/keel-map`, `/keel-clarify`, `/keel-generate`, `/keel-review`. You decide when to move on.
- **The real discovery** — run the interviews, workshops, and data audits the discovery plan recommends, and bring the answers and artifacts back. The kit cannot manufacture information the client hasn't given.
- **The decisions** — answer clarify's questions or make the call (assumption / exclusion / defer / T&M); make the Recommended include/exclude choices; sign and freeze.
- **Edit `constitution.md`** once, to match your org's standard.

**The kit does (automated, inside a skill run):**
- All scoring, rendering, gap-finding, and the adversarial review — the agent executes each skill against the constitution.
- **Running the Python checks — you do *not* run them by hand.** `keel-generate` runs `check_generate.py` on its own output before handing off, and `keel-review` runs `check_review.py` against its verdict; a failing check is fixed in-loop, not left for you. CI runs `check_constitution.py` on every push/PR as a backstop.

So: **you drive the phases and supply the discovery; the kit scores, renders, and verifies itself.** The `python3 checks/…` commands in *The checks* below exist for manual or CI use — a normal engagement never needs you to type them.

## File layout

Keel keeps its machinery out of the way. A run produces:

```
.keel/                  ← internal machinery (rarely opened)
  coverage-map.md
  asset-manifest.md
  decision-log.md
discovery/              ← what you act on
  open-questions.md
  discovery-plan.md
  answers/              ← drop each round's material here
deliverables/           ← client-facing outputs
  1-executive-summary.md … 6-approval-and-signoff.md
  scope-risk-report.md
```

The project root stays clean for the client's own materials.

## The checks (mechanical gates)

`checks/` validates a run by **computing and reconciling** against the IDs and crosswalk — not by trusting prose. A drifted count, an orphan dimension, a dropped section, a weasel word, or a verdict that doesn't match its findings fails loudly. Stdlib Python 3 only.

| Gate | Validates | Runs against |
|---|---|---|
| `check_constitution.py` | The standard: IDs unique, every crosswalk reference resolves, **every dimension has a Part F home**, counts match the catalog. | `constitution.md` |
| `check_generate.py` | The pack: six docs exist, every Part F section present, covered dimensions rendered, no weasel words, DRAFT-vs-`[BLOCK]` honesty, and the **`SCO-08` scenario ledger** (every module's happy/exception/edge class exampled or dispositioned, never silent — each example's artifact ID cross-checked against the asset-manifest). | an engagement dir |
| `check_review.py` | The report: findings carry severities, the verdict reconciles with the High count, the coverage ledger references every active section. | an engagement dir |

```bash
# the standard (always gated in CI)
python3 checks/check_constitution.py constitution.md

# an engagement, judged against the current standard
python3 checks/check_generate.py <engagement-dir> constitution.md
python3 checks/check_review.py   <engagement-dir> constitution.md

# or run them together
bash checks/run_checks.sh                 # constitution only
bash checks/run_checks.sh <engagement>    # + engagement gates
```

`.github/workflows/keel-checks.yml` runs the constitution gate on every push and PR. See `checks/README.md` for what each gate asserts and its limits.

## Installation

**Prerequisites:** [Claude Code](https://code.claude.com) (or any agent that supports the open Agent Skills standard, agentskills.io), and **Python 3** (stdlib only — no packages to install) for the mechanical checks the skills self-run.

1. **Get the kit.** Clone or copy this repo to your machine.
2. **Install the skills.** Copy each `skills/keel-<name>/` folder into your project's `.claude/skills/`. They install flat, so they invoke as `/keel-map`, `/keel-clarify`, `/keel-generate`, `/keel-review`.
3. **Place the standard.** Keep `constitution.md` where the skills can read it — the project root is the default they look for, then the kit root. Edit it once to your org's standard; every run consumes the current file, so edits take effect immediately (no rebuild).
4. **Keep `checks/` reachable.** The skills self-run the Python gates from the kit's `checks/` directory, so keep it alongside `constitution.md`. If it isn't present (e.g. only the constitution was copied in), the skills note that and skip the mechanical self-verify — the pack is then unverified.
5. **Verify the install:**
   ```bash
   python3 checks/check_constitution.py constitution.md   # expect: ALL GREEN ✅
   ```
   In Claude Code, `/keel-map` should now appear. You're ready.
6. **(Optional) CI.** If you host the kit in Git, `.github/workflows/keel-checks.yml` gates the constitution on every push and PR — no setup beyond committing it.

Packaging reference: https://code.claude.com/docs/en/skills and https://agentskills.io.

## Folder structure

```
keel/
  README.md
  constitution.md                 ← the standard (edit this for your org)
  skills/
    keel-map/SKILL.md
    keel-clarify/SKILL.md
    keel-generate/SKILL.md
    keel-review/SKILL.md
  checks/
    keel_lib.py                     shared constitution parser + report harness
    check_constitution.py  check_generate.py  check_review.py
    run_checks.sh                   the CI/local runner
    README.md
  .github/workflows/keel-checks.yml
```

## Quickstart on a real engagement

1. Drop the client's materials in; run `/keel-map`; confirm the project profile it infers.
2. Take its discovery plan, run the sessions, bring the answers back; run `/keel-clarify`; re-run `/keel-map` to re-score. Repeat until `[BLOCK] = 0`.
3. Run `/keel-generate` to write the six docs.
4. Run `/keel-review`; let its findings flow into the register; `/keel-clarify` → re-generate → re-review until **0 High + full coverage**.
5. Make the Recommended decisions, sign, freeze.

## Status & next steps

This is a POC. The standard, the four skills, the stable-ID crosswalk, and the mechanical gates are in place. Not yet built:

- A **production retrieval front-end** — curated direct-drop plus full-corpus RAG for the audit. The POC assumes the whole corpus fits in context.
- `check_coverage.py` / `check_clarify.py` to complete the four-gate set the design calls for.
- The engagement checks parse model-generated markdown, so section detection is heuristic and the covered→section render check needs an ID-keyed coverage map; they fail safe, but they are not yet as airtight as `check_constitution.py`.
