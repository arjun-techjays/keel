---
name: keel-pull
description: "Run each time you sit down to work on the linked project. This is the checkout: it acquires the whole-project lock (everyone else becomes view-only — this is how you stop teammates from editing in parallel) and downloads the latest pushed snapshot into the folder so you edit current shared state. Run it whenever you start or resume a session, including returning to a folder you connected earlier. Requires a linked project (/keel-connect). Triggers on: 'start working', 'pull the latest', 'lock the project', 'check out the project', 'resume work', 'I'm starting on this', 'grab the lock'."
---

# Keel · Pull

The checkout — the reverse of `/keel-push`. **This is the moment the project gets locked.** Call it every time you begin a work session; only one person can hold the lock at a time, so pulling is simultaneously how you (a) get the latest shared state and (b) lock everyone else out while you work. Connecting only recorded *which* project this folder is; pulling is *"I am starting work now."*

You run this **repeatedly** — once at the start of every session. You do **not** re-connect each time; you re-pull.

## Prerequisite — the Keel MCP server

Confirm `keel` is connected (`/mcp`). Uses the tool `keel_pull`.

## Precondition — a linked project

Read `.keel/project.json`. **If it is missing, STOP and run `/keel-connect` first** — there's nothing to pull until the folder is linked to an engagement.

## Workflow

**1 · Acquire the lock.**
Call `keel_pull(project_id)`.
- **`ok: false, status 409` (held by someone else)** → STOP. Report the current holder. Under the single-mutator model you cannot check out the project while they hold it — nobody works in parallel, by design. The user waits for their `/keel-push` or release (a stale lease auto-frees after ~15 min idle) or asks an admin to force-release. Try again then.
- **You already hold it** (re-pulling in the same session) → fine; this refreshes the lease and gets any newer snapshot.
- **`ok: true`** → you now hold the lock; continue.

**2 · Download the latest snapshot into this folder.**
From the `keel_pull` result:
- **`snapshot_url` present** → lay the shared state down so local = latest:
  ```bash
  mkdir -p .keel
  curl -fL -o .keel/_snapshot.zip "<snapshot_url>"
  unzip -o .keel/_snapshot.zip -d .
  rm -f .keel/_snapshot.zip
  ```
  The snapshot holds `.keel/ discovery/ deliverables/` at the top level; if `unzip` reveals a single wrapper folder, flatten it so those three land at the folder root. Report the `snapshot_version`.
  > **This overwrites local working files with the latest pushed state.** If you have un-pushed local edits you care about, `/keel-push` them (or copy them aside) before re-pulling.
- **`snapshot_version: 0` / no `snapshot_url`** (a fresh project) → nothing to download. Keep whatever client materials you've dropped here; they're the inputs to `/keel-map`.

**3 · Report and hand off.**
Print: **you now hold the working lock** (lease expiry from the result), the snapshot version you're on, and that everyone else is view-only until you push or release. Next step: `/keel-map` for a fresh engagement, or continue clarify/generate/review if the pulled state is mid-pipeline. End with `/keel-push` to gate, update the dashboards, and release the lock.

> **Lease note (POC):** the agent holds the lock from pull until push/release. There is no automatic heartbeat over MCP, so a very long idle session can have its lease reclaimed (~15 min) — if a later `/keel-push` returns `409`, just `/keel-pull` again to re-acquire, then push. Manual release: the `keel_release` tool.

## Exit criterion

Complete once you hold the lock and this folder reflects the latest snapshot.

## Handoff

Work with `keel-map / clarify / generate / review` (all require the binding). `/keel-push` ends the session: it zips the result, runs the real server gate, updates the shared dashboards, and **releases the lock** so the next person can `/keel-pull`.
