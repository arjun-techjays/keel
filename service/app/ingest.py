"""Parse a pushed engagement bundle into structured rows and upsert to Supabase.

Reads the same artifacts the gate checks read (`.keel/coverage-map.md`,
`discovery/open-questions.md`, `deliverables/scope-risk-report.md`) and mirrors
their ID/score conventions, so the structured state never disagrees with the gate.

Upserts deliberately omit `assignee_id` / `method_id` on questions so in-app
assignments (set via the UI/service) survive a re-push.
"""

import os
import re

from .config import settings

ID_RE = re.compile(r"\b([A-Z]{3}-\d{2}|RAID-[ADRQ])\b")
# A question/dimension ENTRY *leads* with its ID — after an optional bullet, table
# pipe, bold marker, or "[". Matching only leading IDs stops prose that merely
# MENTIONS an ID — `*(previously tracked as DAT-07)*`, `no SSO (SEC-09) in scope` —
# from being mis-parsed into its own phantom open question.
LEAD_ID_RE = re.compile(
    r"^[\s>]*(?:[-*]\s+)?\|?\s*\*{0,2}\s*\[?([A-Z]{3}-\d{2}|RAID-[ADRQ])\b"
)
SECT_RE = re.compile(r"\bF[1-6]\.\d+\b")
SEV_RE = re.compile(r"\b(high|med(?:ium)?|low)\b", re.I)
FIND_ID_RE = re.compile(r"\b([FR]-?\d{2})\b")


def _read(path: str) -> str | None:
    try:
        with open(path, encoding="utf-8") as fh:
            return fh.read()
    except OSError:
        return None


def _constitution():
    """Lazy import of the canonical parser (stdlib-only) from the pinned checks/."""
    import sys

    checks = os.path.abspath(settings.checks_dir)
    if checks not in sys.path:
        sys.path.insert(0, checks)
    from keel_lib import find_constitution, parse_constitution  # noqa: E402

    cpath = find_constitution(settings.constitution_path) or settings.constitution_path
    try:
        return parse_constitution(cpath)
    except OSError:
        return None


def _score(row_text: str) -> str:
    t = row_text.lower()
    if "partial" in t:
        return "partial"
    if "covered" in t:
        return "covered"
    # Accept the common spellings of not-applicable: "N/A", "N-A", or a bare "na".
    if "n/a" in t or "n-a" in t or re.search(r"\bna\b", t):
        return "na"
    return "gap"


# The coverage-map convention for a dispositioned Gap/Partial (constitution
# Part B): `Partial — resolved (assumption RAID-A12)`. Matched tightly to the
# "— resolved (" form so prose in the evidence cell ("conflict resolved by…")
# can't flip the flag.
_RESOLVED_RE = re.compile(r"[—–-]\s*resolved\s*\(", re.I)


def _resolved(row_text: str, score: str) -> bool:
    return score in ("partial", "gap") and bool(_RESOLVED_RE.search(row_text))


def parse_dimensions(engagement: str, con) -> list[dict]:
    text = _read(os.path.join(engagement, ".keel", "coverage-map.md"))
    if text is None:
        return []
    dims: dict[str, dict] = {}
    for ln in text.splitlines():
        if not ln.lstrip().startswith("|"):
            continue
        cells = [c.strip() for c in ln.strip().strip("|").split("|")]
        # The ID must be the FIRST column (the dimension-ID column). Searching the
        # whole row would let an ID mentioned in the evidence/notes cell create a
        # phantom dimension.
        m = ID_RE.match(cells[0]) if cells else None
        if not m:
            continue
        did = m.group(1)
        disc = "RAID" if did.startswith("RAID") else did.split("-")[0]
        label = (con.dims.get(did) if con else None) or (cells[1] if len(cells) > 1 else did)
        # Last column is the Evidence / provenance cell — for an N-A row it carries
        # the *reason it doesn't apply* (Law 10), which the dashboard shows so N/A
        # isn't mistaken for "skipped". em-dash placeholders contribute nothing.
        evidence = cells[-1] if len(cells) >= 4 else None
        if evidence in ("—", "-", ""):
            evidence = None
        score = _score(ln)
        dims[did] = {
            "dim_id": did,
            "discipline_id": disc,
            "name": label,
            "score": score,
            "resolved": _resolved(ln, score),
            "evidence": evidence,
        }
    return list(dims.values())


def _disposition(line: str) -> tuple[str, str, str | None]:
    t = line.lower()
    if "[block]" in t:
        return "unanswered", "Unanswered", "BLOCK"
    if "assumption" in t:
        return "assumption", "Assumption", None
    if "exclud" in t:
        return "excluded", "Excluded", None
    if "defer" in t:
        return "deferred", "Deferred", None
    if "partial" in t:
        return "partial", "Partial", "PARTIAL"
    if "answered" in t or "closed" in t:
        return "answered", "Answered", None
    return "unanswered", "Open", None


# Ledger disposition vocabulary -> DB disposition enum. SUPERSEDED rows are
# terminal tombstones (the active question is the successor) and are not
# ingested at all.
_LEDGER_DISP = {
    "OPEN": ("unanswered", "Open"),
    "CLOSED": ("answered", "Answered"),
    "ASSUMPTION": ("assumption", "Assumption"),
    "EXCLUDED": ("excluded", "Excluded"),
    "DEFERRED": ("deferred", "Deferred"),
    "TM": ("deferred", "T&M"),
    "T&M": ("deferred", "T&M"),
}


def _questions_from_ledger(engagement: str) -> list[dict] | None:
    """Parse .keel/questions.md — the machine-readable RAID-Q ledger keel-map
    regenerates each run (| Q-id | Dimensions | Tag | Disposition | Question |
    Provenance |). Returns None when the ledger is absent (pre-ledger
    engagement -> caller falls back to the prose heuristic)."""
    import sys

    checks = os.path.abspath(settings.checks_dir)
    if checks not in sys.path:
        sys.path.insert(0, checks)
    from keel_lib import parse_ledger  # noqa: E402

    rows = parse_ledger(os.path.join(engagement, ".keel", "questions.md"))
    if rows is None:
        return None
    qs: dict[str, dict] = {}
    for cells in rows:
        if len(cells) < 5:
            continue
        qid = cells[0]
        disp_key = cells[3].strip().upper()
        if disp_key == "SUPERSEDED":
            continue
        disp, label = _LEDGER_DISP.get(disp_key, ("unanswered", "Open"))
        tag = cells[2].strip().upper()
        dims = ID_RE.findall(cells[1])
        # An adversarial gap-hunt finding (keel-review) cites no catalog dim; its
        # Dimensions cell carries the bare token "PRJ-GEN" (no digits, so ID_RE
        # finds nothing). Bucket it under the PRJ pseudo-discipline so the
        # dashboard groups it instead of dropping it. (Project-specific PRJ-NN
        # dims have a two-digit suffix and are already captured by ID_RE.)
        if not dims and "PRJ" in cells[1].upper():
            dims = ["PRJ-GEN"]
        qs[qid] = {
            "q_id": qid,
            "text": cells[4].strip() or qid,
            "tag": "BLOCK" if tag == "BLOCK" else None,
            "disposition": disp,
            "disposition_label": label,
            "dims": dims,
        }
    return list(qs.values())


def parse_questions(engagement: str) -> list[dict]:
    ledger = _questions_from_ledger(engagement)
    if ledger is not None:
        return ledger
    # Fallback: pre-ledger engagements — heuristic parse of the prose register.
    text = _read(os.path.join(engagement, "discovery", "open-questions.md"))
    if text is None:
        return []
    qs: dict[str, dict] = {}
    for ln in text.splitlines():
        if not ln.strip():
            continue
        # Only lines that LEAD with an ID are question entries. Continuation lines
        # (answers starting with "→"), parentheticals ("(previously tracked as
        # DAT-07)"), and summary lines ("[BLOCK] remaining: 0") mention IDs but are
        # not questions — skip them so they don't become phantom open questions.
        m = LEAD_ID_RE.match(ln)
        if not m:
            continue
        qid = m.group(1)
        disp, label, tag = _disposition(ln)
        if ln.lstrip().startswith("|"):
            cells = [c.strip() for c in ln.strip().strip("|").split("|")]
            text_cell = max((c for c in cells if not ID_RE.fullmatch(c)), key=len, default=qid)
        else:
            text_cell = re.sub(r"^[\*\]\s:.\-]+", "", ln[m.end():]).strip()
        qs[qid] = {
            "q_id": qid,
            "text": text_cell or qid,
            "tag": tag,
            "disposition": disp,
            "disposition_label": label,
            "dims": ID_RE.findall(ln),
        }
    return list(qs.values())


def parse_block_count(engagement: str) -> int:
    """Count genuine [BLOCK] question lines — those tagged [BLOCK] that also carry
    a dimension/question ID. A bare "[BLOCK] remaining: 0" summary line has no ID
    and must not count, or the gate false-positives on the sentence that reports
    zero blockers."""
    text = _read(os.path.join(engagement, "discovery", "open-questions.md"))
    if not text:
        return 0
    return sum(
        1 for ln in text.splitlines()
        if "[BLOCK]" in ln and ID_RE.search(ln)
    )


def parse_review(engagement: str) -> dict | None:
    text = _read(os.path.join(engagement, "deliverables", "scope-risk-report.md"))
    if text is None:
        return None
    low = text.lower()
    verdict = (
        "FREEZE-BLOCKED" if "freeze-blocked" in low
        else "FREEZE-CLEAR" if "freeze-clear" in low
        else "UNKNOWN"
    )
    findings: list[dict] = []
    for ln in text.splitlines():
        s = ln.strip()
        fid, sev = FIND_ID_RE.search(s), SEV_RE.search(s)
        if not (fid and sev):
            continue
        sv = sev.group(1).lower()
        severity = "high" if sv.startswith("high") else "med" if sv.startswith("med") else "low"
        # Collapse the PRJ-GEN-<n> human handle before extracting catalog refs,
        # or ID_RE would mine a phantom "GEN-<n>" (3 letters + 2 digits) out of it.
        s_refs = re.sub(r"PRJ-GEN-\d+", "PRJ-GEN", s)
        refs = ID_RE.findall(s_refs) + SECT_RE.findall(s_refs)
        findings.append({
            "finding_id": fid.group(1),
            "severity": severity,
            "title": s[:240],
            "refs": refs,
            "status": "open",
        })
    return {
        "verdict": verdict,
        "findings": findings,
        "high": sum(f["severity"] == "high" for f in findings),
        "med": sum(f["severity"] == "med" for f in findings),
        "low": sum(f["severity"] == "low" for f in findings),
    }


# --- write to Supabase ------------------------------------------------------

def ingest_generate(sb, project_id: str, engagement: str) -> dict:
    con = _constitution()
    dims = parse_dimensions(engagement, con)
    qs = parse_questions(engagement)
    # Derive the block count from the parsed (ID-keyed, de-duplicated) questions
    # so it can never diverge from open_questions: a blocker is a question still
    # open AND tagged [BLOCK]. A resolved/assumed/excluded question never blocks,
    # and non-question text mentioning "[BLOCK]" is ignored (no ID → not a question).
    blocks = sum(1 for q in qs if q.get("tag") == "BLOCK" and q["disposition"] in ("unanswered", "partial"))

    # The pushed coverage-map / open-questions register is the COMPLETE current
    # state — keel-map regenerates them whole each run. So after upserting, prune
    # any DB row whose ID is absent from this push: a dimension or question that was
    # renamed (DAT-07 → DAT-04), removed, or that was a stale phantom from the old
    # parser must not linger as a ghost "open" item. Guarded by non-empty parses so
    # an unreadable/empty file never wipes the project.
    if dims:
        sb.table("dimensions").upsert(
            [{**d, "project_id": project_id} for d in dims],
            on_conflict="project_id,dim_id",
        ).execute()
        keep = {d["dim_id"] for d in dims}
        existing = sb.table("dimensions").select("dim_id").eq("project_id", project_id).execute().data or []
        stale = [r["dim_id"] for r in existing if r["dim_id"] not in keep]
        if stale:
            sb.table("dimensions").delete().eq("project_id", project_id).in_("dim_id", stale).execute()
    if qs:
        sb.table("questions").upsert(
            [{**q, "project_id": project_id} for q in qs],
            on_conflict="project_id,q_id",
        ).execute()
        keepq = {q["q_id"] for q in qs}
        existingq = sb.table("questions").select("q_id").eq("project_id", project_id).execute().data or []
        staleq = [r["q_id"] for r in existingq if r["q_id"] not in keepq]
        if staleq:
            sb.table("questions").delete().eq("project_id", project_id).in_("q_id", staleq).execute()

    # Coverage is over APPLICABLE dimensions only — N-A dimensions are explicit
    # decisions (Law 10), not gaps, and must not dilute the percentage.
    # Resolved (Part B) = covered + dispositioned: a Gap/Partial whose question
    # was dispositioned no longer counts as unresolved, but stays distinct from
    # Covered (evidenced). Resolved % is the headline progress number.
    applicable = [d for d in dims if d["score"] != "na"]
    total = len(applicable)
    covered = sum(d["score"] == "covered" for d in applicable)
    resolved = covered + sum(d["resolved"] for d in applicable)
    pct = round(covered / total * 100) if total else 0
    resolved_pct = round(resolved / total * 100) if total else 0
    open_q = sum(q["disposition"] in ("unanswered", "partial") for q in qs)

    sb.table("projects").update({
        "total_dims": total,
        "covered_count": covered,
        "coverage_pct": pct,
        "resolved_count": resolved,
        "resolved_pct": resolved_pct,
        "block_count": blocks,
        "open_questions": open_q,
    }).eq("id", project_id).execute()

    return {"dimensions": total, "covered": covered, "coverage_pct": pct,
            "resolved": resolved, "resolved_pct": resolved_pct,
            "block_count": blocks, "open_questions": open_q}


def ingest_review(sb, project_id: str, engagement: str) -> dict | None:
    rv = parse_review(engagement)
    if not rv:
        return None
    run = sb.table("review_runs").insert({
        "project_id": project_id,
        "verdict": rv["verdict"],
        "high": rv["high"], "med": rv["med"], "low": rv["low"],
    }).execute().data
    run_id = run[0]["id"] if run else None
    if run_id and rv["findings"]:
        sb.table("review_findings").insert(
            [{**f, "run_id": run_id, "project_id": project_id} for f in rv["findings"]]
        ).execute()
    return rv
