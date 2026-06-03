#!/usr/bin/env python3
"""check_generate.py — pack conformance for a generated engagement.

Validates deliverables/ against the constitution's Part F structure + crosswalk:

  1. All six documents exist.
  2. Each document contains every Part F section the constitution lists for it
     (matched by section ID or by section title) — no section dropped silently.
  3. Every Covered dimension (from coverage-map) is rendered into at least one
     of its mapped sections' documents (the crosswalk, inverted).
  4. No weasel words in the rendered pack (Doctrine Law 3).
  5. Gate honesty: if open-questions still has [BLOCK], the pack must say DRAFT.

Usage:  python3 check_generate.py <engagement-dir>
Exit 0 = pass, 1 = failure(s).
"""
import os
import re
import sys

from keel_lib import (Report, find_constitution, parse_constitution)

DOC_FILES = {
    1: "1-executive-summary.md", 2: "2-scope.md",
    3: "3-technical-architecture.md", 4: "4-raid.md",
    5: "5-implementation-plan.md", 6: "6-approval-and-signoff.md",
}

WEASEL = [
    "robust", "blazingly fast", "scalable", "seamless", "user-friendly",
    "intuitive", "as needed", "as required", "and so on", "etc.",
    "state-of-the-art", "world-class", "best-in-class", "cutting-edge",
]

# --- SCO-08 / Law 11: the scenario-coverage ledger contract -----------------
# keel-generate emits .keel/scenario-coverage.md — one row per module × scenario
# class — and this checker reconciles it mechanically. The ledger is the machine
# -readable proof of Law 11 ("no scenario passes in silence"); prose in the scope
# doc is never parsed for it.
SCEN_CLASSES = {"happy", "exception", "edge"}
SCEN_STATUS = {"EXAMPLE", "EXCLUDED", "ASSUMPTION", "NA", "SILENT"}
SCEN_NA_SCEN = {"all", "—", "-", "n/a", "none"}   # a module-level N-A row
# EXAMPLE evidence must carry a traceable provenance (Law 6): an artifact ID,
# a filename, or a named source.
PROV_RE = re.compile(
    r"\bA\d+\b|\.\w{2,4}\b|\b(call|transcript|interview|workshop|sample|"
    r"record|screenshot|memo|demo|recording|email)\b", re.I)
# ASSUMPTION evidence must link to a RAID assumption (Law 4).
RAIDA_RE = re.compile(r"\bRAID-A\b|\bRAID-A\d+\b", re.I)


def _title_core(title: str) -> str:
    t = title.lower()
    for pre in ("per-module:", "ux —", "ux -"):
        if t.startswith(pre):
            t = t[len(pre):]
    return t.strip()


def section_present(text: str, sid: str, title: str) -> bool:
    if sid.lower() in text:
        return True
    core = _title_core(title)
    # match on the first clause of the title (before a slash / parenthesis)
    head = re.split(r"[/(]", core)[0].strip()
    return bool(head) and head in text


def run(engagement: str, con_override: str | None = None) -> Report:
    r = Report("check_generate")
    cpath = con_override or (
        find_constitution(os.path.join(engagement, "constitution.md"))
        or find_constitution(engagement))
    if not cpath:
        r.fail("could not locate constitution.md")
        return r
    c = parse_constitution(cpath)
    deliv = os.path.join(engagement, "deliverables")

    # 1. six files exist
    texts: dict[int, str] = {}
    for doc, fn in DOC_FILES.items():
        p = os.path.join(deliv, fn)
        if not os.path.isfile(p):
            r.fail(f"missing deliverable: deliverables/{fn}")
            continue
        with open(p, encoding="utf-8") as fh:
            texts[doc] = fh.read().lower()

    # 2. every Part F section present in its document
    for doc, sids in c.doc_sections.items():
        if doc not in texts:
            continue
        for sid in sids:
            s = c.sections[sid]
            if not section_present(texts[doc], sid, s.title):
                r.fail(f"{DOC_FILES[doc]}: missing Part F section {sid} "
                       f"({s.title})")

    # 3. covered-dimension rendering (needs an ID-bearing coverage map)
    covered = _covered_dims(engagement)
    if covered is None:
        r.warn("coverage-map has no dimension IDs — pre-encoding engagement; "
               "skipping covered→section rendering check. Re-run keel-map to "
               "produce an ID-keyed coverage map.")
    else:
        # invert the crosswalk: dim -> docs that can render it
        dim_docs: dict[str, set[int]] = {}
        for s in c.sections.values():
            for d in s.renders_from:
                dim_docs.setdefault(d, set()).add(s.doc)
        for dim in sorted(covered):
            docs = dim_docs.get(dim)
            if not docs:
                r.fail(f"Covered dimension {dim} has no Part F home (crosswalk)")
                continue
            if not any(dim.lower() in texts.get(d, "") or
                       _rendered_in(c, texts, dim) for d in docs):
                r.warn(f"Covered dimension {dim} not clearly rendered in its "
                       f"target doc(s) {sorted(docs)}")

    # 4. weasel words
    for doc, text in texts.items():
        for w in WEASEL:
            n = text.count(w)
            if n:
                r.warn(f"{DOC_FILES[doc]}: weasel term '{w}' ×{n} (Law 3)")

    # 5. gate honesty
    blocks = _block_count(engagement)
    if blocks is None:
        r.warn("no discovery/open-questions.md found — cannot verify the gate")
    elif blocks > 0:
        is_draft = any("draft" in t for t in texts.values())
        msg = (f"{blocks} [BLOCK] open question(s) remain")
        (r.note if is_draft else r.fail)(
            msg + (" — pack marked DRAFT ✅" if is_draft
                   else " but pack is NOT marked DRAFT"))
    else:
        r.note("gate: 0 [BLOCK] — generate gate green")

    # 6. SCO-08 scenario coverage — mechanical (Law 11)
    if 2 in texts:          # only when a scope document was generated
        _check_scenarios(r, engagement)

    return r


def _check_scenarios(r: Report, engagement: str) -> None:
    """Reconcile .keel/scenario-coverage.md: every in-scope module's happy /
    exception / edge class is either an EXAMPLE (with provenance), a disposition
    (EXCLUDED / ASSUMPTION→RAID-A / NA-with-reason), or — forbidden — SILENT."""
    rows = _scenario_rows(engagement)
    if rows is None:
        r.fail("SCO-08: missing .keel/scenario-coverage.md — the scenario "
               "ledger is required to verify Law 11 mechanically "
               "(keel-generate must emit it)")
        return

    by_mod: dict[str, dict[str, str]] = {}
    na_mods: set[str] = set()
    manifest_ids = _manifest_ids(engagement)   # registered artifact IDs, or None
    uncrosschecked = 0                          # EXAMPLE rows with no A# to check
    for cells in rows:
        mod = cells[0]
        scen = cells[1].lower()
        status = cells[2].strip().upper()
        evid = cells[3] if len(cells) > 3 else ""

        if status not in SCEN_STATUS:
            r.fail(f"SCO-08: module '{mod}' / '{scen}' has unknown status "
                   f"'{status}' (expected {sorted(SCEN_STATUS)})")
            continue

        # a module-level N-A row (no process workflow) — needs a reason (Law 10)
        if scen in SCEN_NA_SCEN and status == "NA":
            if not evid:
                r.fail(f"SCO-08: module '{mod}' marked N-A with no reason "
                       f"(Law 10)")
            na_mods.add(mod)
            continue

        if scen not in SCEN_CLASSES:
            r.fail(f"SCO-08: module '{mod}' has unrecognised scenario '{scen}' "
                   f"(expected happy/exception/edge, or 'all' for an N-A module)")
            continue

        by_mod.setdefault(mod, {})[scen] = status

        if status == "SILENT":
            tag = "EXCEPTION " if scen == "exception" else ""
            r.fail(f"SCO-08: {tag}module '{mod}' {scen} scenario is SILENT — "
                   f"claimed-handled but neither exampled nor dispositioned "
                   f"(Law 11)")
        elif status == "EXAMPLE" and not PROV_RE.search(evid):
            r.fail(f"SCO-08: module '{mod}' {scen} EXAMPLE has no traceable "
                   f"artifact reference (Law 6) — got '{evid or 'empty'}'")
        elif status == "ASSUMPTION" and not RAIDA_RE.search(evid):
            r.fail(f"SCO-08: module '{mod}' {scen} ASSUMPTION must reference a "
                   f"RAID-A item (Law 4) — got '{evid or 'empty'}'")
        elif status in ("NA", "EXCLUDED") and not evid:
            kind = "reason" if status == "NA" else "client acknowledgement"
            r.fail(f"SCO-08: module '{mod}' {scen} {status} has no {kind}")

        # cross-check EXAMPLE provenance against the registered asset manifest
        if status == "EXAMPLE" and manifest_ids:
            cited = re.findall(r"\bA\d+\b", evid)
            if cited:
                for aid in cited:
                    if aid not in manifest_ids:
                        r.fail(f"SCO-08: module '{mod}' {scen} EXAMPLE cites "
                               f"'{aid}', which is not registered in "
                               f".keel/asset-manifest.md (Law 6/8 — provenance "
                               f"must resolve to a real, registered artifact)")
            else:
                uncrosschecked += 1

    # completeness: every non-N-A module must resolve all three classes
    for mod, scens in by_mod.items():
        if mod in na_mods:
            continue
        missing = SCEN_CLASSES - set(scens)
        if missing:
            crit = " (incl. EXCEPTION)" if "exception" in missing else ""
            r.fail(f"SCO-08: module '{mod}' is missing scenario class(es) "
                   f"{sorted(missing)}{crit} — a class left out is silence "
                   f"(Law 11)")

    n = len(set(by_mod) | na_mods)
    r.note(f"SCO-08: scenario ledger covers {n} module(s) "
           f"({len(na_mods)} N-A); all rows reconciled")
    if manifest_ids is None:
        r.note("SCO-08: no .keel/asset-manifest.md — EXAMPLE provenance not "
               "cross-checked against a registry")
    elif not manifest_ids:
        r.note("SCO-08: asset-manifest has no A# artifact IDs — EXAMPLE "
               "provenance not cross-checked")
    elif uncrosschecked:
        r.note(f"SCO-08: {uncrosschecked} EXAMPLE row(s) cite a filename/named "
               f"source with no A# id — not cross-checked against the manifest")


def _manifest_ids(engagement: str):
    """The set of stable artifact IDs (A1, A2, …) registered in
    .keel/asset-manifest.md, or None if the manifest is absent. EXAMPLE rows in
    the scenario ledger must cite an ID that resolves here — provenance can't
    point at an artifact the engagement never registered."""
    p = os.path.join(engagement, ".keel", "asset-manifest.md")
    if not os.path.isfile(p):
        return None
    ids: set[str] = set()
    with open(p, encoding="utf-8") as fh:
        for ln in fh:
            ids.update(re.findall(r"\bA\d+\b", ln))
    return ids


def _scenario_rows(engagement: str):
    """Parse .keel/scenario-coverage.md into trimmed table-cell rows, or None
    if the ledger is absent. Header and separator rows are dropped."""
    p = os.path.join(engagement, ".keel", "scenario-coverage.md")
    if not os.path.isfile(p):
        return None
    out = []
    with open(p, encoding="utf-8") as fh:
        for ln in fh:
            if not ln.lstrip().startswith("|"):
                continue
            cells = [c.strip() for c in ln.strip().strip("|").split("|")]
            if len(cells) < 4:
                continue
            if cells[0].lower() == "module" or set(cells[0]) <= set("-: "):
                continue
            out.append(cells)
    return out


def _rendered_in(c, texts, dim) -> bool:
    """Loose check: is the dimension's label text present anywhere?"""
    label = c.dims.get(dim, "").lower()
    head = re.split(r"[/(]", label)[0].strip()
    return bool(head) and any(head in t for t in texts.values())


def _covered_dims(engagement: str):
    p = os.path.join(engagement, ".keel", "coverage-map.md")
    if not os.path.isfile(p):
        return None
    with open(p, encoding="utf-8") as fh:
        rows = [ln for ln in fh if ln.lstrip().startswith("|")]
    idre = re.compile(r"\b([A-Z]{3}-\d{2}|RAID-[ADRQ])\b")
    any_id = any(idre.search(ln) for ln in rows)
    if not any_id:
        return None
    covered = set()
    for ln in rows:
        m = idre.search(ln)
        if m and "covered" in ln.lower():
            covered.add(m.group(1))
    return covered


def _block_count(engagement: str):
    p = os.path.join(engagement, "discovery", "open-questions.md")
    if not os.path.isfile(p):
        return None
    with open(p, encoding="utf-8") as fh:
        return fh.read().count("[BLOCK]")


def main(argv):
    if len(argv) < 2:
        print("usage: check_generate.py <engagement-dir> [constitution.md]")
        return 2
    con = argv[2] if len(argv) > 2 else None
    r = run(argv[1], con)
    print(r.render())
    return 0 if r.ok() else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
