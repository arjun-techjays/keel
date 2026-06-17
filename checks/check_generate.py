#!/usr/bin/env python3
"""check_generate.py — pack conformance for a generated engagement.

Validates deliverables/ against the constitution's Part F structure + crosswalk:

  1. All six documents exist.
  2. Each document contains every Part F section the constitution lists for it
     (matched by section ID or by section title) — no section dropped silently.
  3. Every Covered dimension (from coverage-map) is rendered into at least one
     of its mapped sections' documents (the crosswalk, inverted).
  4. No weasel words in the rendered pack (Doctrine Law 3).
  5. Self-containment (Law 12): no statement defers its substance to an external
     document ("per §4.4 of the RFP") — external citations only on Source lines.
     Fails in the binding docs (2, 3, 6); warns elsewhere.
  6. Gate honesty: if the questions ledger (.keel/questions.md) still has
     BLOCK+OPEN rows (fallback: [BLOCK] lines in the prose register), or the
     instance inventory still has OPEN rows, the pack must say DRAFT. The
     ledger is also validated (disposition vocabulary, duplicate Q-ids,
     dimension references).
  7. SCO-08 / Law 11: the scenario ledger reconciles (statuses, provenance,
     RAID-A links, no SILENT, all three classes per module, reasons carry
     their grounds) and every ledger module is named in the scope doc.
  8. SCO-09 / Law 13: the instance inventory reconciles (statuses, RAID-A
     links, closed-world rows per class) and every specified instance appears
     by name in a document its host dimension's crosswalk maps to.

Usage:  python3 check_generate.py <engagement-dir>
Exit 0 = pass, 1 = failure(s).
"""
import os
import re
import sys

from keel_lib import (Report, SECT_RE, find_constitution, parse_constitution,
                      parse_ledger)

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

# --- Law 12: self-containment — external back-references as content ----------
# A deferral verb followed (within the same clause) by an external-document
# target is a body that delegates its substance outside the pack. Internal
# cross-refs (F-section IDs, "RAID Register") never match the target
# alternation, so the pointer-not-duplicate doctrine (F2.15) is unaffected.
BACKREF_RE = re.compile(
    r"(?i)\b(per|as\s+per|see|refer(?:\s+to)?|defined\s+in|described\s+in|"
    r"specified\s+in|detailed\s+in|outlined\s+in|according\s+to|"
    r"in\s+accordance\s+with|pursuant\s+to)\b[^.\n]{0,60}?"
    r"(§\s*\d|\brfp\b|\bsow\b|\bmsa\b|appendix|attachment|exhibit|addendum)")
# A provenance line — the one place an external citation is welcome (suffix).
PROV_LINE_RE = re.compile(r"(?i)^\s*[*>\-|#\s]*\s*(source|provenance|evidence)\s*[:—–]")
# The binding documents, where a Law 12 hit is a failure (elsewhere: warning).
BINDING_DOCS = {2, 3, 6}

# --- reason quality (Part B): a reason must carry its grounds -----------------
STOCK_REASONS = {"not applicable", "n/a", "na", "none", "no reason",
                 "out of scope", "n-a", "not needed", "not required"}
MIN_REASON_LEN = 15

# --- SCO-09 / Law 13: the instance-inventory ledger contract -----------------
# keel-map owns .keel/instance-inventory.md — one row per named instance per
# class, plus one __CLOSED-WORLD__ row per class ("are these ALL the X's?").
INST_STATUS = {"SPECIFIED", "ASSUMPTION", "EXCLUDED", "DEFERRED", "OPEN"}
CW_STATUS = {"CONFIRMED", "ASSUMED", "OPEN"}
CW_MARK = "__closed-world__"

# --- RAID-Q: the questions ledger contract -----------------------------------
# keel-map regenerates .keel/questions.md — one row per question:
# | Q-id | Dimensions | Tag | Disposition | Question | Provenance |.
# It is the machine-readable twin of discovery/open-questions.md (the prose
# register stays the human view). The gate and the dashboard ingest count
# blockers from the LEDGER — a [BLOCK] in prose with no ledger row is invisible
# by design, so the reconcile rule in keel-map matters.
Q_DISP = {"OPEN", "CLOSED", "ASSUMPTION", "EXCLUDED", "DEFERRED", "TM", "T&M",
          "SUPERSEDED"}
Q_TAGS = {"BLOCK", "ASSUME", "TM", "T&M", "FUTURE", "", "—", "-"}

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

    # 2. every Part F section present in its document. A section whose
    # constitutional Renders-from is empty is synthesis-only / engagement-
    # conditional (e.g. F2.24 project-specific areas): it carries no mandatory
    # catalog-dimension content, so it is present-if-used, never required.
    for doc, sids in c.doc_sections.items():
        if doc not in texts:
            continue
        for sid in sids:
            s = c.sections[sid]
            if not s.renders_from:
                continue
            if not section_present(texts[doc], sid, s.title):
                r.fail(f"{DOC_FILES[doc]}: missing Part F section {sid} "
                       f"({s.title})")

    # the crosswalk, inverted: dim -> docs that can render it (checks 3 and 8)
    dim_docs: dict[str, set[int]] = {}
    for s in c.sections.values():
        for d in s.renders_from:
            dim_docs.setdefault(d, set()).add(s.doc)

    # 3. covered-dimension rendering (needs an ID-bearing coverage map).
    # Project-specific PRJ-* dims resolve their Part F home from the per-
    # engagement registry (.keel/project-dimensions.md), not the constitution
    # crosswalk — a Covered PRJ-* with no home there warns (it stays a tracked
    # open area), where a homeless catalog dim is a hard failure.
    covered = _covered_dims(engagement)
    if covered is None:
        r.warn("coverage-map has no dimension IDs — pre-encoding engagement; "
               "skipping covered→section rendering check. Re-run keel-map to "
               "produce an ID-keyed coverage map.")
    else:
        prj_homes = _prj_homes(engagement)
        for dim in sorted(covered):
            docs = dim_docs.get(dim) or prj_homes.get(dim)
            if not docs:
                if dim.startswith("PRJ-"):
                    r.warn(f"Covered PRJ dimension {dim} has no Part F home in "
                           f".keel/project-dimensions.md — route it to a "
                           f"section or to F2.24")
                else:
                    r.fail(f"Covered dimension {dim} has no Part F home "
                           f"(crosswalk)")
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

    # 5. self-containment — Law 12 back-reference linter
    for doc, text in texts.items():
        for i, ln in enumerate(text.splitlines(), 1):
            if PROV_LINE_RE.match(ln):
                continue                      # a Source:/Provenance: suffix line
            m = BACKREF_RE.search(ln)
            if not m:
                continue
            msg = (f"{DOC_FILES[doc]}:{i}: external back-reference as content "
                   f"— '{ln.strip()[:80]}' (Law 12: spell the rule out; cite "
                   f"only on a Source: line)")
            (r.fail if doc in BINDING_DOCS else r.warn)(msg)

    # 8 runs before 6 so OPEN inventory rows feed the gate-honesty verdict.
    open_instances = 0
    if "SCO-09" in c.dims:
        open_instances = _check_instances(r, engagement, dim_docs, texts)

    # 6. gate honesty — [BLOCK] questions and OPEN inventory rows both gate.
    # The questions ledger (.keel/questions.md) is authoritative when present;
    # the prose register is the pre-ledger fallback.
    blocks = _check_questions(r, engagement)
    if blocks is None:
        blocks = _block_count(engagement)
        if blocks is not None:
            r.note("no .keel/questions.md — pre-ledger engagement; counted "
                   "[BLOCK] from the prose register (re-run keel-map to emit "
                   "the ledger)")
    if blocks is None:
        r.warn("no questions ledger or discovery/open-questions.md found — "
               "cannot verify the gate")
    elif blocks + open_instances > 0:
        is_draft = any("draft" in t for t in texts.values())
        parts = []
        if blocks:
            parts.append(f"{blocks} [BLOCK] open question(s)")
        if open_instances:
            parts.append(f"{open_instances} OPEN instance-inventory row(s)")
        msg = " and ".join(parts) + " remain"
        (r.note if is_draft else r.fail)(
            msg + (" — pack marked DRAFT ✅" if is_draft
                   else " but pack is NOT marked DRAFT"))
    else:
        r.note("gate: 0 [BLOCK], 0 OPEN instances — generate gate green")

    # 7. SCO-08 scenario coverage — mechanical (Law 11)
    if 2 in texts:          # only when a scope document was generated
        _check_scenarios(r, engagement, texts)

    return r


def _reason_floor(evid: str) -> str | None:
    """Part B reason-quality floor: a reason must carry its grounds. Returns a
    deficiency description, or None if the floor is met. A lexical floor only —
    the real bar is review's job."""
    e = evid.strip().rstrip(".").lower()
    if e in STOCK_REASONS:
        return f"'{evid}' states no grounds"
    if len(e) < MIN_REASON_LEN:
        return f"'{evid}' is too thin to carry its grounds"
    return None


def _check_scenarios(r: Report, engagement: str, texts: dict[int, str]) -> None:
    """Reconcile .keel/scenario-coverage.md: every in-scope module's happy /
    exception / edge class is either an EXAMPLE (with provenance), a disposition
    (EXCLUDED / ASSUMPTION→RAID-A / NA-with-reason), or — forbidden — SILENT.
    Every ledger module must also be named in the rendered scope doc."""
    rows = parse_ledger(os.path.join(engagement, ".keel",
                                     "scenario-coverage.md"))
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
            else:
                thin = _reason_floor(evid)
                if thin:
                    r.fail(f"SCO-08: module '{mod}' N-A reason fails the "
                           f"reason-quality floor — {thin} (Part B)")
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
        elif status in ("NA", "EXCLUDED"):
            kind = "reason" if status == "NA" else "client acknowledgement"
            if not evid:
                r.fail(f"SCO-08: module '{mod}' {scen} {status} has no {kind}")
            else:
                thin = _reason_floor(evid)
                if thin:
                    r.fail(f"SCO-08: module '{mod}' {scen} {status} {kind} "
                           f"fails the reason-quality floor — {thin} (Part B: "
                           f"reasons carry their grounds)")

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

    # the ledger must agree with the rendered prose: a module the scope doc
    # never names is a ledger entry floating free of the pack (Law 11 ↔ Law 6)
    scope_text = texts.get(2, "")
    for mod in sorted(set(by_mod) | na_mods):
        if mod.lower() not in scope_text:
            r.fail(f"SCO-08: ledger module '{mod}' is never named in "
                   f"{DOC_FILES[2]} — the ledger and the rendered scope "
                   f"disagree on what the modules are")

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


def _check_instances(r: Report, engagement: str,
                     dim_docs: dict[str, set[int]],
                     texts: dict[int, str]) -> int:
    """Reconcile .keel/instance-inventory.md (SCO-09 / Law 13): every named
    instance is SPECIFIED (and rendered by name in a doc its host dimension
    maps to), or carries a disposition; every class has exactly one
    __CLOSED-WORLD__ row, answered or dispositioned. Returns the count of OPEN
    rows (they feed the gate-honesty verdict)."""
    rows = parse_ledger(os.path.join(engagement, ".keel",
                                     "instance-inventory.md"))
    sco09 = _dim_row(engagement, "SCO-09")
    if rows is None:
        if sco09 and "n-a" not in sco09 and " na " not in f" {sco09} ":
            r.fail("SCO-09: missing .keel/instance-inventory.md — the instance "
                   "inventory is required to verify Law 13 mechanically "
                   "(keel-map owns it; keel-generate reconciles it)")
        else:
            r.note("SCO-09: no instance inventory and SCO-09 not active — "
                   "skipping instance reconciliation")
        return 0

    open_rows = 0
    cw_by_class: dict[str, int] = {}
    classes: set[str] = set()
    for cells in rows:
        # | Class | Instance | Dimension(s) | Status | Evidence / disposition |
        cls, inst = cells[0], cells[1]
        dims_cell = cells[2] if len(cells) > 2 else ""
        status = (cells[3] if len(cells) > 3 else "").strip().upper()
        evid = cells[4] if len(cells) > 4 else ""
        classes.add(cls)

        if inst.strip().lower() == CW_MARK:
            cw_by_class[cls] = cw_by_class.get(cls, 0) + 1
            if status not in CW_STATUS:
                r.fail(f"SCO-09: class '{cls}' closed-world row has unknown "
                       f"status '{status}' (expected {sorted(CW_STATUS)})")
            elif status == "CONFIRMED" and not evid:
                r.fail(f"SCO-09: class '{cls}' closed-world CONFIRMED with no "
                       f"provenance (Law 6)")
            elif status == "ASSUMED" and not RAIDA_RE.search(evid):
                r.fail(f"SCO-09: class '{cls}' closed-world ASSUMED must "
                       f"reference a RAID-A item (Law 4) — got "
                       f"'{evid or 'empty'}'")
            elif status == "OPEN":
                open_rows += 1
            continue

        if status not in INST_STATUS:
            r.fail(f"SCO-09: '{cls}' / '{inst}' has unknown status "
                   f"'{status}' (expected {sorted(INST_STATUS)})")
            continue

        if status == "OPEN":
            open_rows += 1
            continue
        if status == "ASSUMPTION" and not RAIDA_RE.search(evid):
            r.fail(f"SCO-09: instance '{inst}' ({cls}) ASSUMPTION must "
                   f"reference a RAID-A item (Law 4) — got '{evid or 'empty'}'")
        elif status in ("EXCLUDED", "DEFERRED") and not evid:
            kind = ("client acknowledgement" if status == "EXCLUDED"
                    else "target phase / T&M note")
            r.fail(f"SCO-09: instance '{inst}' ({cls}) {status} has no {kind}")
        elif status == "EXCLUDED":
            thin = _reason_floor(evid)
            if thin:
                r.fail(f"SCO-09: instance '{inst}' ({cls}) EXCLUDED "
                       f"acknowledgement fails the reason-quality floor — "
                       f"{thin} (Part B)")
        elif status == "SPECIFIED" and not evid:
            r.fail(f"SCO-09: instance '{inst}' ({cls}) SPECIFIED with no "
                   f"evidence/provenance (Law 6)")

        # Law 13 teeth: the prose must actually carry each instance by name.
        name = re.split(r"[(\[]", inst)[0].strip().lower()
        if not name:
            continue
        if status == "SPECIFIED":
            target_docs: set[int] = set()
            for d in DIM_ID_RE.findall(dims_cell):
                target_docs |= dim_docs.get(d, set())
            search_docs = target_docs or set(texts)
            if not any(name in texts.get(d, "") for d in search_docs):
                where = (f"its target doc(s) {sorted(target_docs)}"
                         if target_docs else "any document")
                r.fail(f"SCO-09: SPECIFIED instance '{inst}' ({cls}) never "
                       f"appears by name in {where} — specified in the ledger "
                       f"but absent from the rendered pack (Law 13)")
        elif status == "EXCLUDED":
            if not (name in texts.get(2, "") or name in texts.get(6, "")):
                r.warn(f"SCO-09: EXCLUDED instance '{inst}' ({cls}) is not "
                       f"named in the scope exclusions or sign-off "
                       f"acknowledgement (Law 1)")

    for cls in sorted(classes):
        n = cw_by_class.get(cls, 0)
        if n == 0:
            r.fail(f"SCO-09: class '{cls}' has no __CLOSED-WORLD__ row — "
                   f"'are these ALL the {cls}?' was never answered or "
                   f"dispositioned (Law 13)")
        elif n > 1:
            r.fail(f"SCO-09: class '{cls}' has {n} __CLOSED-WORLD__ rows — "
                   f"expected exactly one")

    r.note(f"SCO-09: instance inventory covers {len(classes)} class(es), "
           f"{len(rows)} row(s); {open_rows} OPEN")
    return open_rows


def _check_questions(r: Report, engagement: str) -> int | None:
    """Reconcile .keel/questions.md (the RAID-Q ledger). Returns the count of
    blocking rows (Tag = BLOCK and Disposition = OPEN), or None when the ledger
    is absent (pre-ledger engagement). The dashboard ingests the same ledger —
    this is what keeps the Questions tab and the gate agreeing."""
    rows = parse_ledger(os.path.join(engagement, ".keel", "questions.md"))
    if rows is None:
        return None
    blocks = 0
    no_dim = 0
    seen: set[str] = set()
    for cells in rows:
        # | Q-id | Dimensions | Tag | Disposition | Question | Provenance |
        qid = cells[0]
        dims_cell = cells[1] if len(cells) > 1 else ""
        tag = (cells[2] if len(cells) > 2 else "").strip().upper()
        disp = (cells[3] if len(cells) > 3 else "").strip().upper()

        if qid in seen:
            r.fail(f"RAID-Q: duplicate ledger row for question '{qid}'")
        seen.add(qid)
        if disp not in Q_DISP:
            r.fail(f"RAID-Q: question '{qid}' has unknown disposition "
                   f"'{disp}' (expected {sorted(Q_DISP)})")
            continue
        if tag not in Q_TAGS:
            r.warn(f"RAID-Q: question '{qid}' has unrecognised tag '{tag}'")
        if disp != "SUPERSEDED" and not DIM_ID_RE.search(dims_cell) \
                and "RAID-" not in dims_cell and "PRJ" not in dims_cell:
            # the OQ-07 hole: a question no dimension can claim is invisible
            # to coverage routing and to the dashboard's discipline grouping.
            # A PRJ / PRJ-GEN cell (project-specific dim or adversarial gap-hunt
            # finding) is a legitimate non-catalog reference and is exempt.
            no_dim += 1
            r.warn(f"RAID-Q: question '{qid}' cites no constitution dimension "
                   f"— it cannot be routed to a discipline or a coverage gap")
        if tag == "BLOCK" and disp == "OPEN":
            blocks += 1

    r.note(f"RAID-Q: questions ledger has {len(rows)} row(s); "
           f"{blocks} blocking (BLOCK + OPEN)"
           + (f"; {no_dim} with no dimension ref" if no_dim else ""))
    return blocks


def _dim_row(engagement: str, dim: str) -> str | None:
    """The coverage-map row for a dimension (lowercased), or None."""
    p = os.path.join(engagement, ".keel", "coverage-map.md")
    if not os.path.isfile(p):
        return None
    with open(p, encoding="utf-8") as fh:
        for ln in fh:
            if dim in ln and ln.lstrip().startswith("|"):
                return ln.lower()
    return None


DIM_ID_RE = re.compile(r"\b([A-Z]{3}-\d{2})\b")


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


def _prj_homes(engagement: str) -> dict[str, set[int]]:
    """Per-engagement Part F homes for project-specific PRJ-* dimensions, read
    from .keel/project-dimensions.md's "Renders into" column. PRJ-* dims live in
    engagement state (never the constitution catalog), so their crosswalk is
    resolved here rather than from Part F's Renders-from. Returns {PRJ-01: {2,3}}.
    """
    rows = parse_ledger(os.path.join(engagement, ".keel",
                                     "project-dimensions.md"))
    if not rows:
        return {}
    homes: dict[str, set[int]] = {}
    for cells in rows:
        # | ID | Dimension | Applies when | "Covered" means | Renders into | Lens |
        did = cells[0].strip()
        if not did.upper().startswith("PRJ-"):
            continue
        renders = cells[4] if len(cells) > 4 else ""
        docs = {int(m.group(1)) for m in SECT_RE.finditer(renders)}
        if docs:
            homes[did] = docs
    return homes


# A genuine blocking question is a line tagged [BLOCK] that ALSO carries a
# dimension/question ID (DAT-07, RAID-A, …). Summary/legend lines that merely
# mention the token — e.g. "**[BLOCK] remaining: 0** — gate unlocked" — carry no
# ID and must not count, or the gate false-positives on the very sentence that
# reports zero blockers.
_BLOCK_ID_RE = re.compile(r"\b([A-Z]{3}-\d{2}|RAID-[ADRQ])\b")


def _block_count(engagement: str):
    p = os.path.join(engagement, "discovery", "open-questions.md")
    if not os.path.isfile(p):
        return None
    n = 0
    with open(p, encoding="utf-8") as fh:
        for ln in fh:
            if "[BLOCK]" in ln and _BLOCK_ID_RE.search(ln):
                n += 1
    return n


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
