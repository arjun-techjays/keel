---
name: keel-connect
description: "Run ONCE per working folder to link it to a Keel engagement on the shared platform. Lists the projects you can edit, lets you pick one, writes the local binding (.keel/project.json), and shows where the project currently stands (coverage, blockers, and whether anyone holds the working lock). It does NOT lock the project and does NOT download files — that is /keel-pull, which you run each time you sit down to work. Projects are created in the web app, not here. Triggers on: 'connect to a project', 'link this folder', 'select the engagement', 'which project is this folder on', 'switch project'."
---

# Keel · Connect

The one-time binding. It answers a single question — *which engagement does this folder belong to* — and records the answer in `.keel/project.json`. It deliberately does **not** acquire the lock or pull files: connecting is not the same as starting work. You connect a folder **once**; after that you run `/keel-pull` to begin each work session and `/keel-push` to end it. (If a folder is already linked, you never need this skill again.)

It does **not** create projects — creation is web-app-only (a project is pinned to a constitution version at birth). This skill *selects* an existing one.

## Prerequisite — the Keel MCP server

Confirm the **Keel remote MCP server** is connected (in Claude Code, `/mcp` lists `keel`); if not, follow the guide's §6a setup. Uses the read-only tools `keel_list_projects`, `keel_project_status`, `keel_list_questions`.

## The binding it writes

`.keel/project.json` — ties this folder to a remote engagement:

```json
{
  "project_id": "11111111-1111-1111-1111-111111111111",
  "name": "Northwind",
  "service_url": "https://keel-production-729b.up.railway.app",
  "linked_at": "<ISO date>"
}
```

Every other skill checks for this file. It rides inside pushed snapshots (it's under `.keel/`), so a teammate who later pulls inherits the same binding — identical `project_id`, no conflict.

## Workflow

**1 · Check for an existing binding.**
Read `.keel/project.json`.
- **Present** → report the linked project and skip to step 3 (show status). Only continue to step 2 if the user explicitly wants to **switch** this folder to a different engagement — and warn first, because switching points the folder at a different project's state (their `/keel-pull` would then overwrite this folder).
- **Absent** → continue to step 2.

**2 · List and select.**
Call `keel_list_projects`. Present a compact numbered table — `# · name · client · freeze_status · coverage% · blockers · open questions` — and ask the user to pick one by number or name. If the engagement isn't listed, it hasn't been created yet or they aren't an editor: tell them to create it in the **web app** (New project) or get added as an editor, then re-run. Never invent or guess a `project_id`.

**3 · Show where the project stands (read-only — no lock).**
Call `keel_project_status(project_id)`. Report: freeze status, coverage %, `[BLOCK]` count, open questions — **and whether someone currently holds the working lock** (the `lock` holder/heartbeat), so the user knows up front whether the project is free to check out or busy.

**4 · Write the binding.**
Write `.keel/project.json` with the selected `project_id`, `name`, the service URL, and today's date.

**5 · Hand off — explicitly say nothing is locked yet.**
Print: the folder is now linked, **no lock was taken and no files were downloaded**, and to start working the user runs **`/keel-pull`** — that acquires the lock (making everyone else view-only) and downloads the latest snapshot into this folder. Reinforce the rhythm: *connect once; `/keel-pull` to start each session; `/keel-push` to finish.*

## Exit criterion

Complete once `.keel/project.json` exists. (No lock, no snapshot — those belong to `/keel-pull`.)

## Handoff

`/keel-pull` starts a work session (lock + download latest). The four working skills (`keel-map/clarify/generate/review`) require this binding and refuse without it. `/keel-push` ends the session (server gate + release).
