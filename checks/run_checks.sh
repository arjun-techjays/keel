#!/usr/bin/env bash
# Keel check runner — wires the mechanical gates for CI or local use.
#
#   bash checks/run_checks.sh                  # gate the constitution (the standard)
#   bash checks/run_checks.sh <engagement>...  # also gate one or more engagement dirs
#                                              # (each judged against the current constitution)
#
# Exit 0 = all green, non-zero = at least one gate failed.
#
# CI note: with no arguments this gates ONLY the constitution — the standard
# must always be internally valid. Engagement gating is opt-in (pass dirs),
# because a repo may carry intentionally-stale fixtures (e.g. test/) that should
# not redden the build.
set -uo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/.." && pwd)"
con="$root/constitution.md"
py="${PYTHON:-python3}"
fail=0

echo "▶ check_constitution  ($con)"
"$py" "$here/check_constitution.py" "$con" || fail=1

# Fixture regression: the maintained examples/ fixtures are deterministic and
# must always reconcile with the current checks (golden passes, every seeded
# violation is caught) — unlike ad-hoc engagement dirs, they are never stale.
if [ -d "$root/examples/northstar-recycling" ]; then
  echo
  bash "$here/test_examples.sh" || fail=1
fi

for eng in "$@"; do
  echo
  echo "▶ check_generate  ($eng)"
  "$py" "$here/check_generate.py" "$eng" "$con" || fail=1
  echo
  echo "▶ check_review  ($eng)"
  "$py" "$here/check_review.py" "$eng" "$con" || fail=1
done

echo
if [ "$fail" -eq 0 ]; then
  echo "ALL GREEN ✅"
else
  echo "FAILURES ❌"
fi
exit "$fail"
