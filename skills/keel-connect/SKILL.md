---
name: keel-connect
description: "Run FIRST, before keel-map/clarify/generate/review, to link this working folder to a Keel engagement on the shared platform and pull its existing progress. Lists the projects you can edit, lets you pick one, writes the local binding (.keel/project.json), acquires the working lock, and downloads the latest pushed snapshot so your local files reflect shared state — not an empty or stale copy. Projects are created in the web app, not here; this only selects an existing one. Triggers on: 'connect to a project', 'link this folder', 'select the engagement', 'which project am I on', 'pull the latest state', 'switch project'."
---

# Keel · Connect

The front door. Keel's real state lives on the shared platform (server-gated, one-mutator-at-a-time); the four working skills operate on **local files** but those files only mean something once this folder is bound to a specific engagement. `keel-connect` makes that binding, then pulls the shared progress down so you continue where the team left off instead of starting from a blank or stale folder.

It does **not** create projects — creation is web-app-only (a project is pinned to a constitution version at birth, which the web app does). This skill *selects* an existing one and links to it.

## Prerequisite — the Keel MCP server

This skill drives the **Keel remote MCP server**. Confirm it's connected (in Claude Code, `/mcp` lists `keel`); if not, follow the guide's §6a setup (`claude mcp add keel --transport http <endpoint>/mcp`). Every step below calls a Keel MCP tool: `keel_list_projects`, `keel_pull`, `keel_release`.

## The binding it writes

`.keel/project.json` — the one file that ties this folder to a remote engagement:

```json
{
  "project_id": "11111111-1111-1111-1111-111111111111",
  "name": "Northwind",
  "service_url": "https://keel-production-729b.up.railway.app",
  "linked_at": "<ISO date>"
}
```

Every other skill checks for this file as its precondition. It travels inside the pushed snapshot (it's under `.keel/`), so a teammate who later pulls inherits the same binding — the `project_id` is identical, so there is never a conflict.

## Workflow

**1 · Check for an existing binding.**
Read `.keel/project.json`.
- **Present** → report the linked project (`name`, `project_id`). Ask what the user wants: **keep it** (stop — you're already linked; run `/keel-map` etc.), **re-pull** the latest shared state (skip to step 4), or **switch** to a different project (continue to step 2). Never silently switch a folder that already has work in it — switching pulls a *different* engagement's files over this one; confirm first.
- **Absent** → continue to step 2. (This is the "forced selection" path: no skill proceeds until a project is chosen.)

**2 · List and select.**
Call `keel_list_projects`. Present a compact numbered table — `# · name · client · freeze_status · coverage% · blockers · open questions` — and ask the user to pick one by number or name. Show the lock/working status if relevant. If the engagement they want isn't listed, it hasn't been created yet (or they're not an editor): tell them to create it in the **web app** (New project) or get added as an editor, then re-run `/keel-connect`. Do **not** invent or guess a `project_id`.

**3 · Acquire the lock and pull progress.**
Call `keel_pull(project_id)` for the selected project. This is git-like checkout — it claims the **whole-project lock** (others become view-only until you release or push) and returns the latest snapshot.
- **`ok: false, status 409` (locked by someone else)** → STOP. Report the current holder; under the single-mutator model you cannot pull or continue while they hold it. The user waits for their release (auto-frees after ~15 min idle) or asks an admin to force-release. Do **not** write the binding yet — you couldn't take the project.
- **`ok: true`** → continue.

**4 · Download and lay down the shared state.**
From the `keel_pull` result:
- **`snapshot_url` present** (there is prior progress) → download and extract it into this folder so local = shared:
  ```bash
  mkdir -p .keel
  curl -fL -o .keel/_snapshot.zip "<snapshot_url>"
  unzip -o .keel/_snapshot.zip -d .
  rm -f .keel/_snapshot.zip
  ```
  The snapshot contains `.keel/ discovery/ deliverables/` at the top level. If `unzip` reveals a single wrapper folder instead, flatten it so those three land at the folder root. Report the `snapshot_version` you pulled.
- **`snapshot_version: 0` / no `snapshot_url`** (a fresh project) → nothing to download. Keep whatever client materials you've already dropped in this folder; they become the inputs to `/keel-map`.

**5 · Write the binding (after extracting, so it wins over any older copy in the snapshot).**
Write `.keel/project.json` with the selected `project_id`, `name`, the service URL, and today's date.

**6 · Report and hand off.**
Print: the linked project, that **you now hold the working lock** (lease expiry from the pull result), the snapshot version you're sitting on, and the next step (`/keel-map` for a fresh engagement, or continue clarify/generate/review if the pulled state is mid-pipeline). Remind the user that the lock makes everyone else view-only until they run `/keel-push` (which pushes, runs the gate, and **releases**) — or release manually via `keel_release` if they're abandoning the session without pushing.

## Exit criterion

Complete once `.keel/project.json` exists and (unless the project was locked by someone else) the latest shared snapshot has been laid down in this folder and you hold the lock.

## Handoff

`keel-map` / `keel-clarify` / `keel-generate` / `keel-review` all require `.keel/project.json` and refuse to run without it — they point back here. When the working loop is done, `keel-push` zips the result, runs the server gate, updates the platform, and releases your lock.
