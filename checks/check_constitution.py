#!/usr/bin/env python3
"""check_constitution.py — integrity gate for the constitution itself.

Validates the stable-ID encoding mechanically, so the crosswalk can't silently
rot:

  1. Dimension IDs are unique and well-formed.
  2. Section IDs are unique and well-formed.
  3. Every Renders-from reference points at a defined dimension (no dangling).
  4. Coverage guarantee (Part G): every dimension maps to >=1 Part F section.
  5. Section numbering is contiguous per document (warn-only).

Usage:  python3 check_constitution.py [path/to/constitution.md]
Exit 0 = pass, 1 = at least one failure.
"""
import sys

from keel_lib import (Constitution, Report, SECT_RE, find_constitution,
                      parse_constitution)

EXPECTED_PER_PREFIX = {  # catalog sizes (sanity anchor; update with the catalog)
    "SCO": 9, "PRD": 9, "UXD": 15, "ENG": 13, "DAT": 19, "SEC": 9,
    "QAT": 12, "OPS": 9, "CHG": 4, "COM": 7, "DEL": 8,
}


def run(c: Constitution) -> Report:
    r = Report("check_constitution")
    dims = c.dims
    sections = c.sections

    catalog_dims = {d for d in dims if not d.startswith("RAID")}
    r.note(f"{len(catalog_dims)} catalog dimensions + "
           f"{len(dims) - len(catalog_dims)} RAID items · {len(sections)} sections")

    # 1. per-prefix counts vs the expected catalog sizes
    for prefix, expected in EXPECTED_PER_PREFIX.items():
        got = len([d for d in catalog_dims if d.startswith(prefix)])
        if got != expected:
            r.fail(f"{prefix}: expected {expected} dimensions, found {got}")
        # contiguity: SCO-01..SCO-07 with no gaps
        nums = sorted(int(d.split("-")[1]) for d in catalog_dims
                      if d.startswith(prefix))
        if nums and nums != list(range(1, len(nums) + 1)):
            r.fail(f"{prefix}: non-contiguous numbering {nums}")

    # 2. RAID items present
    for raid in ("RAID-A", "RAID-D", "RAID-R", "RAID-Q"):
        if raid not in dims:
            r.fail(f"missing RAID item {raid}")

    # 3. every renders-from reference resolves to a defined dimension
    for sid, s in sections.items():
        for ref in s.renders_from:
            if ref not in dims:
                r.fail(f"{sid} renders from undefined dimension '{ref}'")
        if not s.renders_from:
            r.warn(f"{sid} ({s.title}) has no Renders-from — synthesis-only "
                   f"section? confirm it is intentional")

    # 4. coverage guarantee — every dimension has a Part F home
    mapped = {ref for s in sections.values() for ref in s.renders_from}
    orphans = sorted(d for d in dims if d not in mapped)
    for o in orphans:
        r.fail(f"ORPHAN — dimension {o} ({dims[o]}) has no Part F section "
               f"(violates the Part G coverage guarantee)")

    # 5. section numbering contiguous per doc (warn-only — additive sections ok)
    for doc, sids in c.doc_sections.items():
        nums = [int(SECT_RE.search(s).group(2)) for s in sids]
        if nums != list(range(1, len(nums) + 1)):
            r.warn(f"Doc {doc}: section numbers {nums} are non-contiguous")

    return r


def main(argv):
    arg = argv[1] if len(argv) > 1 else "."
    path = find_constitution(arg)
    if not path:
        print(f"could not locate constitution.md from '{arg}'")
        return 2
    c = parse_constitution(path)
    r = run(c)
    print(f"(parsed {path})")
    print(r.render())
    return 0 if r.ok() else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
