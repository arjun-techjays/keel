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

- **Overview** — this project's dashboard: freeze status, `[BLOCK]` count, coverage, the phase pipeline, coverage by discipline, and open questions. The **checkout controls** (Pull / Push / Release) live here.
- **Questions (Clarify)** — open questions grouped by the **research method** needed to answer them (Stakeholder interview, Document review, etc.), each assignable to a teammate. *Answering happens in your agent or via push* — this tab is the shared view of what's open and how it was closed.
- **Coverage** — every dimension, scored **Covered / Partial / Gap**. Click a gap to see its blocker.
- **Pack** — the six rendered deliverables. **DRAFT** until frozen; sections with open blockers show **BLOCKED**. **Export PDF** prints the document via your browser's *Save as PDF*.
- **Review** — the scope-risk findings and the freeze verdict.

### Dashboard (admins only)

Answer rate vs. closed-by-disposition, the close-mix, answer quality per project, and team activity — so you can see whether teams are *answering* questions or just clearing blockers.

---

## 4. How work flows: the checkout model

A project is edited **one person at a time**, like checking out a file.

1. **Pull & lock** (Overview tab) — claims the project. Everyone else now sees "you're working" and can't push.
2. Do the work — in the web app, or in your own agent (§6).
3. **Upload & push** — upload a `.zip` of the engagement folder. Pick the phase (**generate** or **review**). Keel runs the real gate on your upload and updates coverage, questions, and findings.
4. **Release** when you're done (locks also auto-release after ~15 min of inactivity).

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

In a Claude Code session, run `/mcp` to confirm `keel` is connected, and the skills `/keel-connect`, `/keel-pull`, `/keel-map`, `/keel-clarify`, `/keel-generate`, `/keel-review`, `/keel-push` should appear. Without a valid token every Keel tool returns `401` — generate one in the web app first.

### 6b. One-time setup — Codex

Codex reads MCP servers from `~/.codex/config.toml` (check your Codex version's docs for the exact remote-server key):

```toml
[mcp_servers.keel]
url = "https://keel-production-729b.up.railway.app/mcp/"   # keep the trailing slash
```

Install the skills/constitution/checks the same way as above, then restart Codex.

### 6c. Full walkthrough — a fresh project to a signed PDF

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

# 2. PULL — check out: lock the project + download the latest state
/keel-pull
#    acquires the WHOLE-PROJECT lock (everyone else is now view-only — this is how
#    you stop parallel edits) and downloads the latest snapshot into the folder.
#    Run this at the START of EVERY work session — including when you return later.
#    Locked by someone else? You wait — only one person holds it at a time.
#    (Brand-new engagement → nothing to download yet, that's fine.)

# 3. MAP — score what you have against the constitution
/keel-map
#    writes: .keel/coverage-map.md, discovery/open-questions.md, discovery/discovery-plan.md
#    the plan groups questions by research method (interview, document review, …)

# 4. CLARIFY — close the open questions
/keel-clarify
#    answer one-by-one in the terminal, or drop answer files into discovery/answers/
#    for anything you can't answer, disposition it: assumption / exclusion / defer (T&M)

# 5. LOOP 1 — re-map to re-score, repeat until no blockers
/keel-map
#    keep going /keel-clarify → /keel-map until open-questions shows [BLOCK] = 0

# 6. GENERATE — render the six-document pack (only works at [BLOCK] = 0)
/keel-generate
#    writes deliverables/1-executive-summary.md … 6-approval-and-signoff.md

# 7. REVIEW — red-team the pack for scope risk
/keel-review
#    writes deliverables/scope-risk-report.md with findings + a freeze verdict

# 8. LOOP 2 — findings go back to clarify, then regenerate + re-review
/keel-clarify        # resolve the findings
/keel-generate       # re-render
/keel-review         # until 0 High findings + full coverage

# 9. PUSH — send the result to the shared platform (runs the server gate, releases lock)
/keel-push
#    zips .keel/ discovery/ deliverables/, uploads via MCP, runs the REAL server
#    gate (generate, then review), updates the shared dashboards, and releases
#    your lock. A red gate is reported here — fix upstream (clarify→generate) and
#    /keel-push again. (You can still push from the web app instead: Overview →
#    Pull & lock → upload zip → Push → Release.)

# 10. FREEZE + PDF — make the Recommended decisions, get sign-off, export
#    Pack tab → Export PDF  (your browser's Save as PDF produces the client PDF)
```

**The three checkout verbs — the rhythm to remember:**

- **`/keel-connect` — once per folder.** Records *which* project this folder is. No lock.
- **`/keel-pull` — every session.** Checks the project out: takes the lock (others view-only) and pulls the latest. Returning tomorrow? Just `/keel-pull` again — you don't re-connect.
- **`/keel-push` — end of session.** Runs the gate and releases the lock so the next person can pull.

> Tip: steps 2–9 happen entirely in your agent. You only need the web app to *create* the project (step 0), make the Recommended decisions, view the team dashboards, and export the final PDF.

> **When is it locked?** From `/keel-pull` until `/keel-push` (or `keel_release`, or a ~15-min idle auto-free). While you hold it, everyone else is view-only — that's how parallel editing is prevented. If you stop mid-session without pushing, release so you don't block teammates.

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
