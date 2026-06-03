"""Shared parsing helpers for the Keel mechanical checks.

Dependency-free (stdlib only). Parses the constitution's Part D (dimension
catalog) and Part F (pack structure + Renders-from crosswalk) from their
markdown tables, which are machine-structured on purpose.

Nothing here trusts prose: IDs are matched by pattern, the crosswalk is read
straight out of the Part F tables, and callers reconcile counts rather than
believing summaries.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass, field

# A Part D dimension ID: three-letter discipline prefix + two digits, e.g. DAT-07.
DIM_RE = re.compile(r"\b([A-Z]{3}-\d{2})\b")
# A RAID item ID: RAID-A / RAID-D / RAID-R / RAID-Q.
RAID_RE = re.compile(r"\b(RAID-[ADRQ])\b")
# A Part F section ID: F<doc>.<n>, e.g. F2.11.
SECT_RE = re.compile(r"\bF([1-6])\.(\d+)\b")

ANY_ID_RE = re.compile(r"\b([A-Z]{3}-\d{2}|RAID-[ADRQ])\b")


@dataclass
class Section:
    sid: str            # F2.11
    doc: int            # 2
    title: str          # "Per-module: Acceptance criteria"
    renders_from: list[str] = field(default_factory=list)  # ['SCO-05', 'DAT-07']


@dataclass
class Constitution:
    dims: dict[str, str]              # id -> dimension label  (incl. RAID-*)
    sections: dict[str, Section]      # sid -> Section
    path: str

    @property
    def doc_sections(self) -> dict[int, list[str]]:
        out: dict[int, list[str]] = {}
        for sid, s in self.sections.items():
            out.setdefault(s.doc, []).append(sid)
        for d in out:
            out[d].sort(key=_section_sort_key)
        return out


def _section_sort_key(sid: str):
    m = SECT_RE.search(sid)
    return (int(m.group(1)), int(m.group(2))) if m else (99, 99)


def _split_row(line: str) -> list[str]:
    """Split a markdown table row into trimmed cells (drops outer pipes)."""
    parts = [c.strip() for c in line.strip().strip("|").split("|")]
    return parts


def find_constitution(start: str) -> str | None:
    """Locate constitution.md: explicit file, in start dir, or repo root above."""
    if os.path.isfile(start) and start.endswith(".md"):
        return start
    cand = os.path.join(start, "constitution.md")
    if os.path.isfile(cand):
        return cand
    # walk upward a few levels
    d = os.path.abspath(start)
    for _ in range(5):
        cand = os.path.join(d, "constitution.md")
        if os.path.isfile(cand):
            return cand
        d = os.path.dirname(d)
    return None


def parse_constitution(path: str) -> Constitution:
    dims: dict[str, str] = {}
    sections: dict[str, Section] = {}
    with open(path, encoding="utf-8") as fh:
        lines = fh.readlines()

    for raw in lines:
        line = raw.rstrip("\n")
        if not line.lstrip().startswith("|"):
            continue
        cells = _split_row(line)
        if not cells:
            continue
        first = cells[0]

        # Part D dimension row:  | SCO-01 | Scope statement | Applies | Covered |
        m = re.fullmatch(r"([A-Z]{3}-\d{2})", first)
        if m and len(cells) >= 2:
            dims.setdefault(m.group(1), _strip_md(cells[1]))
            continue

        # RAID row:  | RAID-A | Assumptions | ... |
        m = re.fullmatch(r"(RAID-[ADRQ])", first)
        if m and len(cells) >= 2:
            dims.setdefault(m.group(1), _strip_md(cells[1]))
            continue

        # Part F section row:  | F2.11 | Key section | What | Owner | Renders from |
        m = SECT_RE.fullmatch(first)
        if m and len(cells) >= 5:
            sid = first
            renders = ANY_ID_RE.findall(cells[-1])
            sections[sid] = Section(
                sid=sid, doc=int(m.group(1)), title=_strip_md(cells[1]),
                renders_from=renders,
            )
            continue

    return Constitution(dims=dims, sections=sections, path=path)


def _strip_md(s: str) -> str:
    return s.replace("**", "").strip()


# ---- a tiny check-result harness -------------------------------------------

class Report:
    def __init__(self, name: str):
        self.name = name
        self.failures: list[str] = []
        self.warnings: list[str] = []
        self.notes: list[str] = []

    def fail(self, msg: str): self.failures.append(msg)
    def warn(self, msg: str): self.warnings.append(msg)
    def note(self, msg: str): self.notes.append(msg)

    def ok(self) -> bool:
        return not self.failures

    def render(self) -> str:
        out = []
        status = "PASS ✅" if self.ok() else "FAIL ❌"
        out.append(f"== {self.name}: {status} "
                   f"({len(self.failures)} failures · {len(self.warnings)} warnings) ==")
        for n in self.notes:
            out.append(f"  · {n}")
        for w in self.warnings:
            out.append(f"  ⚠️  {w}")
        for f in self.failures:
            out.append(f"  ❌ {f}")
        return "\n".join(out)
