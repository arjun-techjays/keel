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
    if "n/a" in t or re.search(r"\bna\b", t):
        return "na"
    return "gap"


def parse_dimensions(engagement: str, con) -> list[dict]:
    text = _read(os.path.join(engagement, ".keel", "coverage-map.md"))
    if text is None:
        return []
    dims: dict[str, dict] = {}
    for ln in text.splitlines():
        if not ln.lstrip().startswith("|"):
            continue
        cells = [c.strip() for c in ln.strip().strip("|").split("|")]
        m = ID_RE.search(" | ".join(cells))
        if not m:
            continue
        did = m.group(1)
        disc = "RAID" if did.startswith("RAID") else did.split("-")[0]
        label = (con.dims.get(did) if con else None) or (cells[1] if len(cells) > 1 else did)
        dims[did] = {
            "dim_id": did,
            "discipline_id": disc,
            "name": label,
            "score": _score(ln),
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


def parse_questions(engagement: str) -> list[dict]:
    text = _read(os.path.join(engagement, "discovery", "open-questions.md"))
    if text is None:
        return []
    qs: dict[str, dict] = {}
    for ln in text.splitlines():
        if not ln.strip():
            continue
        m = ID_RE.search(ln)
        if not m:
            continue
        qid = m.group(1)
        disp, label, tag = _disposition(ln)
        if ln.lstrip().startswith("|"):
            cells = [c.strip() for c in ln.strip().strip("|").split("|")]
            text_cell = max((c for c in cells if not ID_RE.fullmatch(c)), key=len, default=qid)
        else:
            text_cell = re.sub(r"^[\-\*\d.\s]+", "", ln).strip()
        qs[qid] = {
            "q_id": qid,
            "text": text_cell or qid,
            "tag": tag,
            "disposition": disp,
            "disposition_label": label,
        }
    return list(qs.values())


def parse_block_count(engagement: str) -> int:
    text = _read(os.path.join(engagement, "discovery", "open-questions.md"))
    return text.count("[BLOCK]") if text else 0


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
        refs = ID_RE.findall(s) + SECT_RE.findall(s)
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
    blocks = parse_block_count(engagement)

    if dims:
        sb.table("dimensions").upsert(
            [{**d, "project_id": project_id} for d in dims],
            on_conflict="project_id,dim_id",
        ).execute()
    if qs:
        sb.table("questions").upsert(
            [{**q, "project_id": project_id} for q in qs],
            on_conflict="project_id,q_id",
        ).execute()

    total = len(dims)
    covered = sum(d["score"] == "covered" for d in dims)
    pct = round(covered / total * 100) if total else 0
    open_q = sum(q["disposition"] in ("unanswered", "partial") for q in qs)

    sb.table("projects").update({
        "total_dims": total,
        "covered_count": covered,
        "coverage_pct": pct,
        "block_count": blocks,
        "open_questions": open_q,
    }).eq("id", project_id).execute()

    return {"dimensions": total, "covered": covered, "coverage_pct": pct,
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
