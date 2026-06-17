#!/usr/bin/env python3
"""check_review.py — validates the scope-risk-report and its freeze verdict.

  1. The report exists and records findings with severities.
  2. The verdict reconciles with the High count
     (>=1 High  -> FREEZE-BLOCKED ;  0 High -> FREEZE-CLEAR).
  3. Coverage ledger: the report references the Part F section IDs of the
     active documents (an un-referenced section is an un-probed section, which
     must block FREEZE-CLEAR).
  4. Decision reconciliation: when a non-empty .keel/decision-log.md exists,
     the report must carry a "## Decision reconciliation" section (every log
     entry located in the rendered pack and checked for drift — the factual-
     slip net). Warns when its table has fewer rows than the log has
     dimension-ID-bearing entries.

Usage:  python3 check_review.py <engagement-dir>
Exit 0 = pass, 1 = failure(s).
"""
import os
import re
import sys

from keel_lib import Report, SECT_RE, find_constitution, parse_constitution

SEV_HIGH = re.compile(r"\bhigh\b", re.I)


def run(engagement: str, con_override: str | None = None) -> Report:
    r = Report("check_review")
    rp = os.path.join(engagement, "deliverables", "scope-risk-report.md")
    if not os.path.isfile(rp):
        r.fail("missing deliverables/scope-risk-report.md")
        return r
    with open(rp, encoding="utf-8") as fh:
        text = fh.read()
    low = text.lower()

    # 1. verdict present
    clear = "freeze-clear" in low
    blocked = "freeze-blocked" in low
    if not (clear or blocked):
        r.fail("no freeze verdict (FREEZE-CLEAR / FREEZE-BLOCKED) found")

    # 2. High-severity count vs verdict
    #    Count finding rows/lines that carry a High marker; tolerate table or
    #    bullet styles by counting lines that look like findings.
    high = _count_high(text)
    r.note(f"detected ~{high} High finding(s); verdict="
           f"{'CLEAR' if clear and not blocked else 'BLOCKED' if blocked else '?'}")
    if high > 0 and clear and not blocked:
        r.fail(f"{high} High finding(s) but verdict reads FREEZE-CLEAR")
    if high == 0 and blocked:
        r.warn("verdict FREEZE-BLOCKED but no High findings detected — "
               "blocked on coverage? confirm the report says so")

    # 3. coverage ledger vs the constitution's active sections
    cpath = (con_override
             or find_constitution(os.path.join(engagement, "constitution.md"))
             or find_constitution(engagement))
    if cpath:
        c = parse_constitution(cpath)
        referenced = set(m.group(0) for m in SECT_RE.finditer(text))
        all_sections = set(c.sections)
        # Only insist on the sections of docs that exist in deliverables/
        deliv = os.path.join(engagement, "deliverables")
        present_docs = {int(fn[0]) for fn in os.listdir(deliv)
                        if fn[0].isdigit()} if os.path.isdir(deliv) else set()
        # A section whose constitutional Renders-from is empty is synthesis-only
        # / engagement-conditional (e.g. F2.24 project-specific areas): present-
        # if-used, so it is not a required probe target when unused. (Matches
        # check_generate's section-presence treatment.)
        expected = {sid for sid in all_sections
                    if c.sections[sid].doc in present_docs
                    and c.sections[sid].renders_from}
        missing = sorted(expected - referenced, key=_k)
        if missing:
            r.warn(f"coverage ledger does not reference {len(missing)} section(s): "
                   f"{', '.join(missing[:12])}{' …' if len(missing) > 12 else ''} "
                   f"— an un-probed section must block FREEZE-CLEAR")
            if clear and not blocked:
                r.fail("verdict FREEZE-CLEAR but coverage ledger is incomplete "
                       f"({len(missing)} sections not referenced)")
    else:
        r.warn("constitution not found — skipped coverage-ledger check")

    # 4. decision reconciliation — the factual-slip net
    _check_decision_reconciliation(r, engagement, text, low)

    return r


DECISION_ID_RE = re.compile(r"\b([A-Z]{3}-\d{2}|RAID-[ADRQ]\d*)\b")


def _check_decision_reconciliation(r: Report, engagement: str,
                                   text: str, low: str) -> None:
    """When the engagement has a decision log, the review report must carry a
    Decision reconciliation section (presence + row-count floor only — content
    matching is the reviewer's job, not a regex's)."""
    p = os.path.join(engagement, ".keel", "decision-log.md")
    if not os.path.isfile(p):
        r.note("no .keel/decision-log.md — decision reconciliation not required")
        return
    with open(p, encoding="utf-8") as fh:
        log_lines = [ln for ln in fh if DECISION_ID_RE.search(ln)]
    if not log_lines:
        r.note("decision-log has no dimension-ID-bearing entries — decision "
               "reconciliation not required")
        return

    m = re.search(r"^#+\s*decision reconciliation\b", low, re.M)
    if not m:
        r.fail("decision log is non-empty but the report has no "
               "'## Decision reconciliation' section — every decision must be "
               "located in the rendered pack and checked for drift "
               "(the factual-slip net)")
        return

    # row-count floor: table rows under the heading vs ID-bearing log entries
    after = text[m.end():]
    nxt = re.search(r"^#+\s", after, re.M)
    section = after[:nxt.start()] if nxt else after
    rows = [ln for ln in section.splitlines()
            if ln.lstrip().startswith("|")
            and DECISION_ID_RE.search(ln)]
    if len(rows) < len(log_lines):
        r.warn(f"decision reconciliation covers {len(rows)} row(s) but the "
               f"decision log has {len(log_lines)} ID-bearing entries — "
               f"confirm every decision was reconciled")
    else:
        r.note(f"decision reconciliation: {len(rows)} row(s) vs "
               f"{len(log_lines)} log entries ✅")


def _count_high(text: str) -> int:
    """Best-effort: count finding lines tagged High (table rows or bullets)."""
    n = 0
    for ln in text.splitlines():
        s = ln.strip()
        if not s:
            continue
        # a finding line usually has an ID like F-01 / R-01 and a severity word
        if re.search(r"\bF-?\d{2}\b|\bR-?\d{2}\b", s) and SEV_HIGH.search(s):
            n += 1
    # fallback: explicit "High: N" summary
    m = re.search(r"high[^0-9]{0,12}(\d+)", text, re.I)
    if n == 0 and m:
        n = int(m.group(1))
    return n


def _k(sid: str):
    m = SECT_RE.search(sid)
    return (int(m.group(1)), int(m.group(2))) if m else (9, 9)


def main(argv):
    if len(argv) < 2:
        print("usage: check_review.py <engagement-dir> [constitution.md]")
        return 2
    con = argv[2] if len(argv) > 2 else None
    r = run(argv[1], con)
    print(r.render())
    return 0 if r.ok() else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
