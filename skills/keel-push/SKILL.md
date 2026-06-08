---
name: keel-push
description: "Run when a working round is done, to send this folder's state to the shared Keel platform. Zips the engagement (.keel/ discovery/ deliverables/), uploads it through the remote MCP server, runs the real server-side gate (check_generate / check_review), ingests the structured state (coverage, questions, findings) into the shared dashboards, and releases your working lock. This is the only way local work becomes shared, gated state. Requires a linked project and that you hold the lock (i.e. you ran keel-pull). Triggers on: 'push the project', 'send this to the platform', 'sync my work', 'run the server gate', 'push generate', 'push the review', 'I'm done — push it'."
---

# Keel · Push

The reverse of `keel-connect`. Everything you did locally — map, clarify, generate, review — stays invisible to the team until you push. Push is git-like: it ships the snapshot, the **server** runs the authoritative gate on it (you can't be trusted to run it honestly on your own machine), the structured records update the shared dashboards, and your lock is released so the next person can take the project.

> **You usually don't run this by hand.** `keel-map`, `keel-clarify`, `keel-generate`, and `keel-review` now **auto-push at the end** (map/clarify → `map`, generate → `generate`, review → `review`). Reach for `/keel-push` as a **manual escape hatch**: you edited files under `deliverables/` or `.keel/` directly (outside a skill), a skill's auto-push failed, or you want to push a second phase in one session. Everything below applies equally to the automated and manual paths.

## Prerequisite — the Keel MCP server

Drives the **Keel remote MCP server**; confirm `keel` is connected (`/mcp`). Calls the tool `keel_push` (and `keel_pull` when pushing two phases — see below).

## Precondition — a linked project you hold

Read `.keel/project.json`. **If it is missing, STOP and run `/keel-connect` first** — there's nothing to push *to*. You must also currently **hold the lock** — you take it with `/keel-pull` at the start of the session. If you don't hold it, the push returns `409`; run `/keel-pull` to re-acquire and refresh first (so you're not overwriting newer shared state), then push.

## What gets pushed

The three engagement folders at the top level — nothing else:

```
.keel/         coverage-map.md, decision-log.md, scenario-coverage.md, project.json, …
discovery/     open-questions.md, discovery-plan.md, answers/…
deliverables/  1-executive-summary.md … 6-approval-and-signoff.md, scope-risk-report.md
```

Never push the client's raw source materials or `constitution.md`/`checks/` — the server pins those itself.

## Workflow

**1 · Pick the phase.** The server gate runs in three modes:
- **`map`** → ingests coverage + open questions only; **no document gate** (the six-doc pack doesn't exist yet). Use after `keel-map`/`keel-clarify`, before generation. This is the phase that lets you sync a fresh map *without* being asked to generate the six documents.
- **`generate`** → runs `check_generate` (validates the six-document pack), ingests coverage + questions, and records the pack render (lights up the dashboard's Pack tab).
- **`review`** → runs `check_review` (validates the scope-risk report) and ingests findings.

Choose by what you produced this round. If you only mapped or clarified (no pack), push **`map`**. If you wrote the pack, push **`generate`**. If `deliverables/scope-risk-report.md` exists and is current, you'll want generate **and** review (generate first, then review — see step 4). When unsure, ask.

**2 · Zip the engagement.**
```bash
zip -r .keel/_push.zip .keel discovery deliverables -x '.keel/_push.zip'
```
(Create the zip outside the three folders or exclude it as above so it doesn't try to include itself.)

**3 · Push and read the gate verdict.**
Base64-encode the zip and call `keel_push(project_id, zip_base64, phase)`. Report the returned `gate` result **verbatim** — it is the machine verdict, not your assertion:
- **`gate.ok: true`** → the pack passed the server gate; the platform now reflects this state (`version` returned). 
- **`gate.ok: false`** → the gate is **red**. Print exactly what failed. Do **not** try to fix it by hand-editing `deliverables/` — those are derived. Fix **upstream** (resolve in `/keel-clarify`, re-render with `/keel-generate`), then push again. The push still stored a snapshot and **released your lock**, so run `/keel-pull` to re-acquire before the next push.

**4 · Two-phase push (generate → review), when both apply.**
`keel_push` **releases the lock on every push**. To push generate *and* review in one session: push `generate`, then immediately call `keel_pull(project_id)` again to re-acquire the lock (your local files are already current — don't re-extract the snapshot), then push `review`. Report both gate verdicts. If the re-`keel_pull` returns `409`, someone raced in for the lock between phases — report it and push `review` later after another `/keel-pull`.

**5 · Clean up and report.**
`rm -f .keel/_push.zip`. Summarize: the project, the snapshot `version`(s) created, each phase's gate verdict, and that **your lock is now released** (the team can pull). If you intend to keep working, run `/keel-pull` again to re-acquire the lock.

## Exit criterion

Complete once the snapshot(s) are stored, the gate verdict(s) are reported honestly, and the lock is released. A red gate is a *reported* outcome, not a failure to push — the snapshot and KPIs still update; the fix is upstream-then-repush.

## Handoff

After a clean push, the rest is web-app work: make the Recommended include/exclude decisions, get sign-off, freeze, and export the PDF from the Pack tab. The next teammate continues by running `/keel-pull` (after `/keel-connect`, if their folder isn't linked yet), which locks the project and pulls the snapshot you just pushed.
