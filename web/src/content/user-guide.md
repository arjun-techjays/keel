# Keel — User Guide

Keel turns messy client inputs into a precise, **scope-creep-proof** discovery pack — and refuses to let you freeze a pack with holes in it. This guide takes you from zero to running a project, both in the web app and from your own AI coding agent.

## 1. The idea in 60 seconds

Scope creep starts with **silence** (things nobody decided) and **ambiguity** (things decided vaguely). Keel attacks both: it scores your discovery against an exhaustive standard (the **constitution**), forces every gap to a real answer or an explicit decision, and **blocks** you from freezing until the pack holds together.

The pipeline has four phases and two gates:

**Map → Clarify → Generate → Review → (Freeze)**

- **Map** — scores what you have against the standard.
- **Clarify** — drives every open question to a real answer or an explicit decision.
- **Generate** — renders the six-document pack, but only when there are zero blockers (the *generate gate*).
- **Review** — red-teams the pack for scope risk and gives a freeze verdict.
- **Freeze** — allowed only when review is clean, every recommended decision is made, and the client signs (the *freeze gate*).

## 2. Signing in

1. Open the app.
2. Click **Continue with Google** and use your **@techjays.com** account. Other domains are rejected.
3. Your first sign-in creates your profile automatically.

> Can't get past Google's screen? Ask an admin to add you as an allowed user (or to publish the sign-in app).

## 3. A tour of the app

The left sidebar:

- **Projects** — every engagement.
- **Dashboard** — quality KPIs (admins only).
- **Constitution** — the read-only standard.
- **Activity** — the audit log of who did what.
- **Guide** — this page.

### Projects

The list shows each engagement's status, coverage %, open blockers, open questions, and who's currently working. Click **New project**, give it a name and optional client, and it's created as a **DRAFT** pinned to the active constitution.

### Inside a project (the tabs)

- **Overview** — this project's dashboard: freeze status, `[BLOCK]` count, coverage, the phase pipeline, coverage by discipline, and open questions. The checkout controls live here (see §4).
- **Questions (Clarify)** — open questions grouped by the **research method** needed to answer them (Stakeholder interview, Document review, etc.). Assign a method to a teammate, then answer each question by **typing** or by **uploading a file** (e.g. interview notes — Keel extracts the answers).
- **Coverage** — all dimensions, scored **Covered / Partial / Gap**. Click a gap to jump to its blocker in Clarify.
- **Pack** — the six rendered deliverables. Marked **DRAFT** until frozen; sections with open blockers show as **BLOCKED**.
- **Review** — the scope-risk findings and the freeze verdict.

### Dashboard (admins only)

Answer rate vs. closed-by-disposition, the close-mix, answer quality per project, and team activity — so you can see whether teams are *answering* questions or just clearing blockers.

## 4. How work flows: the checkout model

A project is edited one person at a time, like checking out a file.

1. **Pull & lock** (Overview tab) — claims the project. Everyone else now sees "you're working" and can't push.
2. Do the work — in the web app, or in your own agent (§5).
3. **Upload & push** — upload a `.zip` of the engagement folder (the `.keel/`, `discovery/`, and `deliverables/` folders). Pick the phase (**generate** or **review**). Keel runs the real gate on your upload and updates coverage, questions, and findings.
4. **Release** when you're done (locks also auto-release after inactivity).

The **Snapshot** button downloads the latest pushed state so you can continue where someone left off.

## 5. Using Keel from Claude Code or Codex (MCP)

Keel exposes a **remote MCP server** so your AI coding agent can read project state and help drive the pipeline — with generation running on *your* machine (your tokens), against the shared, gated state.

**MCP endpoint:** `https://keel-production-729b.up.railway.app/mcp`

### Claude Code

```bash
claude mcp add keel --transport http https://keel-production-729b.up.railway.app/mcp
```

Then run `/mcp` in a session to confirm `keel` is connected. You'll have tools like:

- `keel_list_projects` — list engagements
- `keel_list_questions` — open questions for a project
- `keel_answer_question` / `keel_disposition_question` — record an answer or a disposition
- `keel_check_constitution` — run the constitution gate

…plus resources `keel://projects/<id>/coverage` and `keel://projects/<id>/questions`.

### Codex

Codex reads MCP servers from `~/.codex/config.toml`. Add the Keel server (check the Codex docs for the exact remote-server key in your version):

```toml
[mcp_servers.keel]
url = "https://keel-production-729b.up.railway.app/mcp"
```

Restart Codex; the `keel_*` tools become available.

### Running the full pipeline locally

1. Install the Keel **skills**: copy each `skills/keel-*/` folder from the repo into your project's `.claude/skills/` so `/keel-map`, `/keel-clarify`, `/keel-generate`, `/keel-review` appear.
2. Drop the client's materials in, then run `/keel-map` → `/keel-clarify` → `/keel-generate` → `/keel-review`. The skills write the engagement files locally.
3. Zip the engagement and **push** it (web app, or `POST /projects/<id>/push`) to run the server-side gate and update shared state.

> **POC note:** the MCP connection isn't per-user authenticated yet, so agent actions aren't attributed to a person in Activity. That's on the roadmap.

## 6. Roles

- **Members** — create and work on projects; view the constitution and activity.
- **Admins** — everything members can do, plus the **Dashboard**.

## 7. Glossary

- **Dimension** — one item in the standard, with a stable ID like `DAT-07`.
- **`[BLOCK]`** — an open question that blocks the generate gate.
- **Disposition** — an explicit decision on a question: *answer*, *assumption*, *exclusion*, or *defer (T&M)*.
- **Freeze** — locking a pack as the signed baseline. Allowed only when every gate passes.
