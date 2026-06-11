#!/usr/bin/env bash
# Fixture regression for the Keel mechanical gates.
#
#   bash checks/test_examples.sh
#
# Asserts:
#   - examples/northstar-recycling (golden) passes check_generate + check_review
#   - examples/northstar-violations (seeded-failure twin) fails BOTH, and every
#     seeded violation produces its expected failure string — so a regression
#     that silently stops catching a defect class reddens this script, not prod.
#
# Exit 0 = all assertions hold, 1 = at least one regression.
set -uo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/.." && pwd)"
con="$root/constitution.md"
py="${PYTHON:-python3}"
golden="$root/examples/northstar-recycling"
viol="$root/examples/northstar-violations"
fail=0

note() { printf '  %s\n' "$1"; }
bad()  { printf '  ❌ %s\n' "$1"; fail=1; }

# --- golden: both gates green ------------------------------------------------
echo "▶ golden fixture ($golden)"
if out="$("$py" "$here/check_generate.py" "$golden" "$con" 2>&1)"; then
  note "check_generate: PASS"
else
  bad "check_generate should pass on the golden fixture"; printf '%s\n' "$out"
fi
if out="$("$py" "$here/check_review.py" "$golden" "$con" 2>&1)"; then
  note "check_review: PASS"
else
  bad "check_review should pass on the golden fixture"; printf '%s\n' "$out"
fi

# --- violations: each seeded defect must produce its failure string -----------
echo "▶ violations fixture ($viol)"
gen_out="$("$py" "$here/check_generate.py" "$viol" "$con" 2>&1)"
gen_rc=$?
if [ "$gen_rc" -ne 1 ]; then
  bad "check_generate should exit 1 on the violations fixture (got $gen_rc)"
fi
expected_gen=(
  "external back-reference as content"                      # Law 12 linter
  "never appears by name"                                   # SCO-09 prose reconciliation
  "has no __CLOSED-WORLD__ row"                             # SCO-09 closed-world per class
  "OPEN instance-inventory row(s) remain but pack is NOT marked DRAFT"  # gate honesty
  "fails the reason-quality floor"                          # Part B reason floor
  "must reference a RAID-A item"                            # Law 4 link
  "is never named in 2-scope.md"                            # SCO-08 ledger↔prose
  "unknown disposition"                                     # RAID-Q ledger vocabulary
  "duplicate ledger row"                                    # RAID-Q unique Q-ids
  "[BLOCK] open question(s)"                                # blockers counted from the ledger
)
for s in "${expected_gen[@]}"; do
  if printf '%s' "$gen_out" | grep -qF "$s"; then
    note "check_generate catches: $s"
  else
    bad "check_generate no longer catches: $s"
  fi
done

rev_out="$("$py" "$here/check_review.py" "$viol" "$con" 2>&1)"
rev_rc=$?
if [ "$rev_rc" -ne 1 ]; then
  bad "check_review should exit 1 on the violations fixture (got $rev_rc)"
fi
if printf '%s' "$rev_out" | grep -qF "Decision reconciliation' section"; then
  note "check_review catches: missing Decision reconciliation section"
else
  bad "check_review no longer catches: missing Decision reconciliation section"
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "FIXTURES GREEN ✅"
else
  echo "FIXTURE REGRESSIONS ❌"
fi
exit "$fail"
