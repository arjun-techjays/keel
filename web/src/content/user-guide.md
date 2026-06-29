# Keel — User Guide

Keel turns messy client inputs into a precise, **scope-creep-proof** discovery pack — and refuses to let you freeze a pack with holes in it. This guide takes you from zero to a finished, signed PDF — both in the web app and from your own AI coding agent.

New here? Read §1–§4 first. Working with Claude Code or Codex? Jump to §6 for the full fresh-project-to-PDF walkthrough.

---

## 1. The idea in 60 seconds

Scope creep starts with **silence** (things nobody decided) and **ambiguity** (things decided vaguely). Keel attacks both: it scores your discovery against an exhaustive standard (the **constitution**), forces every gap to a real answer or an explicit decision, and **blocks** you from freezing until the pack holds together.

It is **not** a straight line — it's two loops (see the diagram above):

- **Map** scores what you have against the standard and lists the open questions.
- **Clarify** drives each open question to a real answer or an explicit decision. New answers change the score, so you **re-map** — that's **Loop 1**, repeated until there are zero blockers.
- **Generate** renders the six-document pack — allowed only when blockers are zero (the **generate gate**).
- **Review** red-teams the pack for scope risk. Findings flow **back to Clarify** — that's **Loop 2**, repeated until the review is clean.
- **Freeze** is the **freeze gate**: allowed only when review is clean, every Recommended decision is made, and the client signs.

So the same dimension can pass through Clarify more than once: first to fill a gap, later because Review reopened it.

---

## 2. Signing in

1. Open the app.
2. Click **Continue with Google** and use your **@techjays.com** account. Other domains are rejected.
3. Your first sign-in creates your profile automatically.

> Can't get past Google's screen? Ask an admin to add you as an allowed user (or to publish the sign-in app).

---

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

Every tab carries the project's tab bar (Overview · Questions · Coverage · Pack · Review), so you can move between them from anywhere — including back to Overview.

- **Overview** — this project's dashboard: freeze status, `[BLOCK]` count, coverage, the phase pipeline, coverage by discipline, and open questions. The **checkout controls** (Pull / Push / Release) live here.
- **Questions (Clarify)** — open questions grouped by **discipline** (Scope, Data & Privacy, Security, …), each showing its status. Click a question to read it; closed items show a check. *Answering happens in your agent or via push* — this tab is the shared view of what's open and how it was closed.
- **Coverage** — every dimension, scored **Covered / Partial / Gap / N/A**. **Click any dimension** to inspect it (its evidence, score, and any blocker). **N/A** dimensions were *ruled out by the project's profile* (recorded decisions, e.g. "no AI → AI-accuracy N/A") — not gaps or skips; click one to see the reason. They're excluded from the coverage %.
- **Pack** — the six rendered deliverables. The tab is **empty until you push a `generate`** (run `/keel-generate` first); after that it **renders the actual document content** (pulled live from the latest snapshot) with its **DRAFT / FROZEN** status and gate result. **Export PDF** prints via your browser's *Save as PDF* — a quick copy. For the **client-ready deliverable, run `/keel-enrich`**: it produces the deep, **branded Word `.docx`** (techjays cover & fonts, editorial tables, diagrams, and stat cards).
- **Review** — the scope-risk findings and the freeze verdict.

### Dashboard (admins only)

Answer rate vs. closed-by-disposition, the close-mix, answer quality per project, and team activity — so you can see whether teams are *answering* questions or just clearing blockers.

---

## 4. How work flows: the checkout model

A project is edited **one person at a time**, like checking out a file.

1. **Pull & lock** (Overview tab) — claims the project. Everyone else now sees "you're working" and can't push.
2. Do the work — in the web app, or in your own agent (§6).
3. **Upload & push** — upload a `.zip` of the engagement folder. Pick the phase (**map**, **generate**, or **review**). Keel runs the real gate on your upload and updates coverage, questions, and findings.
   - **map** — syncs coverage + open questions only, with **no document gate**. Use after mapping/clarifying, before the pack exists. (This is what an agent's `/keel-map` and `/keel-clarify` push — so a fresh map syncs without being asked to generate the six documents.)
   - **generate** — runs the pack gate over the six documents and records the render that lights up the Pack tab.
   - **review** — runs the scope-risk gate and ingests the findings.
4. **Release** when you're done (locks also auto-release after ~15 min of inactivity).

> **Agents do this for you.** When you work from Claude Code / Codex (§6), the four working skills now **pull at the start and push at the end automatically** — you don't run Pull/Push by hand in the normal flow. The manual controls above (and `/keel-pull` / `/keel-push`) remain as escape hatches.

The **Snapshot** button downloads the latest pushed state so the next person can continue where you left off.

**What goes in the zip:** the engagement's working folders at the top level —
```
your-project.zip
├── .keel/            (coverage map, decision log, scenario ledger…)
├── discovery/        (open questions, discovery plan, answers/)
└── deliverables/     (the six rendered docs, once generated)
```

---

## 5. The two gates (what "blocked" means)

- **Generate gate** — `[BLOCK] = 0`. Every blocker is an open question that must be answered or explicitly dispositioned (assumption / exclusion / defer / T&M) before the pack can render.
- **Freeze gate** — review shows **0 High findings**, every section was probed, every **Recommended** dimension is decided, and the client signs.

A **Partial** (vague) answer blocks just like a **Gap** — that's deliberate. "We'll use standard auth" doesn't clear "which auth method?".

---

## 6. Using Keel from Claude Code or Codex (MCP)

This is the power workflow: generation runs in **your** Claude Code/Codex (your tokens, your machine), against Keel's **shared, gated state**. The agent reads/writes shared state through Keel's **remote MCP server**; you push the result to run the server-side gate.

**MCP endpoint:** `https://keel-production-729b.up.railway.app/mcp/` — **keep the trailing slash.** Without it the request 307-redirects and large pushes hang.

### 6a. One-time setup — Claude Code

```bash
# 1. Generate a personal access token: web app → Settings (or the Connect-agent
#    panel on a project) → Generate token. Copy it — it's shown once.

# 2. Connect Keel's remote MCP server (the token authenticates every call)
claude mcp add keel --transport http https://keel-production-729b.up.railway.app/mcp/ \
  --header "Authorization: Bearer keel_pat_xxxxxxxx"
#    ^ keep the trailing slash on /mcp/ — without it requests 307-redirect and pushes hang.
#    Already added it without the slash? Re-add: claude mcp remove keel && claude mcp add … /mcp/ …

# 3. Install the Keel skills into your project
#    (clone the repo once, then copy the skill folders)
git clone https://github.com/arjun-techjays/keel.git
cp -r keel/skills/keel-* .claude/skills/
cp keel/constitution.md .          # the standard the skills score against
cp -r keel/checks .                # the mechanical gate scripts (stdlib python3)
```

In a Claude Code session, run `/mcp` to confirm `keel` is connected, and the skills `/keel-connect`, `/keel-pull`, `/keel-map`, `/keel-clarify`, `/keel-generate`, `/keel-review`, `/keel-enrich`, `/keel-push` should appear. Without a valid token every Keel tool returns `401` — generate one in the web app first.

### 6b. One-time setup — Codex

Codex reads MCP servers from `~/.codex/config.toml` (check your Codex version's docs for the exact remote-server key):

```toml
[mcp_servers.keel]
url = "https://keel-production-729b.up.railway.app/mcp/"   # keep the trailing slash
```

Install the skills/constitution/checks the same way as above, then restart Codex.

### 6c. Full walkthrough — a fresh project to a signed PDF

> **Auto checkout (read this first).** `/keel-map`, `/keel-clarify`, `/keel-generate`, and `/keel-review` now **pull at the start and push at the end on their own** — map/clarify push a `map` sync, generate runs the generate gate, review runs the review gate. The `/keel-pull` and `/keel-push` steps below are shown so you understand what each skill does under the hood, but in the normal flow **you don't run them by hand**. Reach for `/keel-pull` / `/keel-push` only as escape hatches — e.g. to re-take the lock after a `409`, or to push files you edited directly (outside a skill) or that a skill's auto-push failed to send. `/keel-connect` is still a real one-time step you run yourself.

```bash
# 0. Create the project in the web app (New project). Creation is web-app-only —
#    it pins the project to the active constitution. Then start a working folder
#    and drop in the client's materials:
mkdir northwind && cd northwind
#    add notes, transcripts, RFP, emails, spreadsheets … anything you have

# 1. CONNECT — link this folder to the project (ONE TIME, no lock)
/keel-connect
#    lists the projects you can edit → you pick one → writes .keel/project.json
#    and shows where the project stands. It does NOT lock or download files.
#    You only ever do this once per folder. This is the gate: /keel-map and the
#    rest refuse to run until a project is linked.

# 2. PULL — optional now: each working skill below pulls on its own at start
/keel-pull
#    acquires the WHOLE-PROJECT lock (everyone else is now view-only) and downloads
#    the latest snapshot. /keel-map et al. now do this for you — run it by hand only
#    to inspect current state or re-take the lock. Locked by someone else? You wait.

# 3. MAP — score what you have against the constitution
/keel-map
#    AUTO: pulls (lock + latest) at start, pushes phase=map at end (syncs coverage +
#    questions to the dashboard, no doc gate, releases the lock).
#    writes: .keel/coverage-map.md, discovery/open-questions.md, discovery/discovery-plan.md

# 4. CLARIFY — close the open questions
/keel-clarify
#    AUTO: pulls at start, pushes phase=map at end (syncs the updated dispositions).
#    answer one-by-one in the terminal, or drop answer files into discovery/answers/
#    for anything you can't answer, disposition it: assumption / exclusion / defer (T&M)

# 5. LOOP 1 — re-map to re-score, repeat until no blockers
/keel-map
#    keep going /keel-clarify → /keel-map until open-questions shows [BLOCK] = 0
#    (each run re-pulls automatically, so the lock released by the prior push is re-taken)

# 6. GENERATE — render the six-document pack (only works at [BLOCK] = 0)
/keel-generate
#    AUTO: pulls at start; after writing the six docs and passing the bundled check,
#    pushes phase=generate (runs the REAL server gate + records the pack render).
#    writes deliverables/1-executive-summary.md … 6-approval-and-signoff.md

# 7. REVIEW — red-team the pack for scope risk
/keel-review
#    AUTO: pulls at start, pushes phase=review at end (server gate + ingests findings).
#    writes deliverables/scope-risk-report.md with findings + a freeze verdict

# 8. LOOP 2 — findings go back to clarify, then regenerate + re-review
/keel-clarify        # resolve the findings
/keel-generate       # re-render
/keel-review         # until 0 High findings + full coverage

# 9. PUSH — usually automatic (the skills above push for you). Manual escape hatch:
/keel-push
#    use by hand when you edited deliverables/ or .keel/ directly (outside a skill),
#    a skill's auto-push failed, or you want to re-push a phase. Zips the engagement,
#    runs the REAL server gate (phase: map | generate | review), updates the shared
#    dashboards, and releases the lock. A red gate is reported — fix upstream
#    (clarify→generate) and push again. (Web alternative: Overview → Pull & lock →
#    upload zip → Push → Release.)

# 10. ENRICH — turn the gated skeleton into the deep, branded .docx pack
/keel-enrich
#    AUTO: pulls at start; expands every section to full depth (named sub-sections,
#    tables, diagrams, stat cards), renders the branded Word .docx (techjays cover &
#    fonts, editorial tables/figures), then pushes. Run once the pack is clean (post-review).
#    writes the enriched deliverables + the branded .docx (rendered with the techjays template)

# 11. FREEZE + EXPORT — make the Recommended decisions, get sign-off, share
#    the branded .docx from /keel-enrich is the client deliverable;
#    Pack tab → Export PDF stays a quick browser Save-as-PDF copy
```

**The rhythm to remember:**

- **`/keel-connect` — once per folder.** Records *which* project this folder is. No lock. You always run this yourself.
- **`/keel-map` · `/keel-clarify` · `/keel-generate` · `/keel-review` — the work.** Each one **pulls at the start** (takes the lock, downloads the latest) and **pushes at the end** (runs the right gate, syncs the dashboards, releases the lock). You just run the work skill; checkout is handled.
- **`/keel-pull` · `/keel-push` — escape hatches.** Manual checkout for the cases the skills don't cover: re-taking a lock after a `409`, inspecting current state, or pushing files you edited by hand. `/keel-push` takes a phase (`map` | `generate` | `review`).

> Tip: steps 2–10 happen entirely in your agent. You only need the web app to *create* the project (step 0), make the Recommended decisions, view the team dashboards, and grab the final deliverable.

> **When is it locked?** From a pull until the matching push (or `keel_release`, or a ~15-min idle auto-free) — and since each work skill pulls then pushes, the lock is now typically held only for the duration of that one skill. While you hold it, everyone else is view-only. If you stop mid-skill or hold it by hand without pushing, release so you don't block teammates.

> **POC note:** `/keel-pull` and `/keel-push` use the same server logic as the web app's *Pull & lock* / *Push* / *Release* buttons. There's no automatic lease heartbeat over MCP yet, so a long idle session can lose its lock (~15 min) — if a later `/keel-push` returns `409`, just `/keel-pull` again and push. Per-user attribution of agent actions in Activity is also still on the roadmap; web actions are already attributed.

---

## 7. Roles

- **Members** — create and work on projects; view the constitution, activity, and guide.
- **Admins** — everything members can do, plus the **Dashboard**.

---

## 8. Troubleshooting

- **Google won't let me in** — your account isn't an allowed test user yet (External OAuth app in testing), or it isn't a `@techjays.com` address.
- **"Locked by someone else"** — another person holds the project. Wait for them to release, or it auto-frees after ~15 min idle.
- **Push says the gate is red** — open the report/Coverage tab to see what's blocking; resolve in Clarify and push again.
- **Constitution page is empty** — the Keel service may be redeploying; refresh in a minute.
- **PDF has the app sidebar in it** — use the **Export PDF** button (it hides the app chrome); a raw Ctrl/Cmd-P won't.

---

## 9. Glossary

- **Dimension** — one item in the standard, with a stable ID like `DAT-07`.
- **`[BLOCK]`** — an open question that blocks the generate gate.
- **Disposition** — an explicit decision on a question: *answer*, *assumption*, *exclusion*, or *defer (T&M)*.
- **Partial** — a vague answer; blocks like a Gap until made specific.
- **Freeze** — locking a pack as the signed baseline. Allowed only when every gate passes.
