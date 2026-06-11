# Keel mechanical checks

Deterministic gates that validate a Keel run by **computing and reconciling**
against the constitution's stable IDs and crosswalk — not by trusting prose. A
drifted count, an orphan dimension, a dropped Part F section, a weasel word, or
a verdict that doesn't match its findings fails loudly here instead of shipping.

Stdlib Python 3 only — no dependencies.

## The gates

| Script | Validates | Runs against |
|---|---|---|
| `check_constitution.py` | The standard itself: dimension/section IDs unique & well-formed, every Renders-from reference resolves, **every dimension has a Part F home** (Part G coverage guarantee), counts match the catalog. | `constitution.md` |
| `check_generate.py` | The pack: all six docs exist, every Part F section present (by ID/title), every Covered dimension rendered into a mapped section, no weasel words, **self-containment** (Law 12 — an external back-reference as content, e.g. *"per §4.4 of the RFP"*, fails in docs 2/3/6; citations belong on `Source:` lines), DRAFT honesty vs the `[BLOCK]` count **and OPEN instance rows**, the **`SCO-08` scenario ledger** (`.keel/scenario-coverage.md` — every module's happy/exception/edge class either an EXAMPLE-with-provenance or a disposition, never SILENT; Law 11; every ledger module named in the scope doc; N-A/EXCLUDED reasons clear the reason-quality floor), with each EXAMPLE's cited artifact ID **cross-checked against `.keel/asset-manifest.md`**, and the **`SCO-09` instance inventory** (`.keel/instance-inventory.md` — every named instance SPECIFIED-and-rendered-by-name or dispositioned; one `__CLOSED-WORLD__` row per class; Law 13). | an engagement dir |
| `check_review.py` | The risk report: findings carry severities, the freeze verdict reconciles with the High count, the coverage ledger references every active section ID (an un-probed section blocks FREEZE-CLEAR), and — when a decision log exists — the report carries a **`## Decision reconciliation`** section (the factual-slip net) with at least as many rows as the log has ID-bearing entries (warn on shortfall). | an engagement dir |

`keel_lib.py` is the shared constitution parser (Part D dimensions, Part F
sections + the Renders-from crosswalk) plus a small pass/fail report harness.

## Usage

```bash
# 1. The standard — should always pass on a healthy constitution
python3 check_constitution.py ../constitution.md

# 2/3. An engagement (a dir containing .keel/, discovery/, deliverables/)
python3 check_generate.py <engagement-dir>
python3 check_review.py   <engagement-dir>
```

By default the engagement checks load the engagement's **own** `constitution.md`
snapshot (a pack is judged against the standard it was built on). To judge a
pack against a *different* standard — e.g. the current repo constitution after a
catalog change — pass it explicitly:

```bash
python3 check_generate.py ../test ../constitution.md
```

Exit code `0` = pass, `1` = at least one failure, `2` = usage/locate error.
Wire them as CI gates so the discipline is enforced, not assumed.

## What "pass" depends on

These are POC-grade gates. `check_constitution.py` is fully deterministic (it
parses only the well-structured catalog tables). The engagement checks parse
model-generated markdown, so section detection is heuristic (section ID **or**
title match) and the covered→section render check needs an **ID-keyed**
coverage map (re-run `keel-map` under the current standard to produce one;
pre-encoding coverage maps are skipped with a warning). They are designed to
fail safe: a missing file, a dropped required section, or a verdict/finding
mismatch is a hard failure; softer signals (weasel words, an unreferenced
section) are warnings.

The **`SCO-08` scenario-ledger check is fully deterministic** — like
`check_constitution`, it parses a structured ledger (`.keel/scenario-coverage.md`),
not model prose, so its verdict is exact: a SILENT scenario, a missing
happy/exception/edge class, an EXAMPLE without traceable provenance, an
EXAMPLE citing an artifact ID **not registered in `.keel/asset-manifest.md`**,
or an ASSUMPTION not linked to a `RAID-A` item is a hard failure. The ledger is
the contract `keel-generate` writes and this gate reconciles — against the
asset-manifest registry, so provenance can't point at an artifact that was
never registered.
