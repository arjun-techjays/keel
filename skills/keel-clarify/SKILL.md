---
name: keel-clarify
description: "Run AFTER keel-map, once answers start coming in. Ingest a round of discovery material — interview notes, workshop transcripts, answers, data samples, decision memos — OR answer interactively in the terminal, reconcile it against the open-questions register, and drive every open item to a terminal state: CLOSED (answered, with provenance) or an explicit disposition (assumption / exclusion / defer-to-phase / T&M). Adjudicates conflicts, captures new questions the material raises, updates the project profile when an answer changes an axis, and reports the blocking gate that unlocks keel-generate. Triggers on: 'here are the discovery answers', 'we ran the workshop, here are the notes', 'update the open questions', 'resolve the gaps', 'clarify', 'are we ready to generate yet'."
---

# Keel · Clarify

The loop between `keel-map` and `keel-generate`. It takes the open questions `keel-map` produced and the answers the project lead gathers — pasted in, dropped as files, or **typed straight into the terminal** — and it closes the gap, literally. Each pass either turns questions into resolved knowledge or into an explicit, recorded decision. Nothing is allowed to quietly evaporate.

## Precondition — a linked project

This folder must be **linked to an engagement** before clarify runs. Check for `.keel/project.json`. **If it is missing, STOP and run `/keel-connect` first** (one-time link).

This skill **manages checkout itself**: at the start (step 0) it calls `keel_pull(project_id)` to lock the project and download the latest shared state — the open-questions register you're about to reconcile lives in that pulled state — and at the end (step 9b) it calls `keel_push(project_id, …, phase="map")` to sync the updated dispositions + block count and release the lock. `/keel-pull` and `/keel-push` remain manual escape hatches (re-acquire after a `409`; push by hand if auto-push failed). If the binding is present, continue.

## The standard it enforces

Read **`constitution.md`** first (project root, then kit root). Clarify lives and dies by three laws: **Law 5** (every gap is dispositioned, never left open), **Law 6** (everything traces to a source), and **Law 7** (conflicts are surfaced and resolved on the record, never silently).

## Where files live

- Reads: `discovery/open-questions.md`, `discovery/discovery-plan.md`, `.keel/coverage-map.md`. Round material, if file-based, lives in `discovery/answers/` (create it if absent).
- Writes: `.keel/decision-log.md` (the audit trail) and the updated `discovery/open-questions.md`.

## Inputs

- From `keel-map`: the three files above.
- From the project lead, this round: **discovery material in whatever form is convenient** — notes, transcripts, memos, data samples dropped in `discovery/answers/`, *or* answers given live in the terminal. Intake is messy on purpose; clarify imposes the structure on the way out.

**Open items can originate from `keel-review`, not just `keel-map`.** `open-questions.md` is the single register of *all* open items — including findings `review` fed back in, tagged `raised-by: keel-review` and often carrying a **suggested disposition** (a ready-to-paste exclusion / definition / cap from the scope-risk-report). Clarify treats these identically to map-raised gaps: drive each to a terminal state. For a review item the suggested disposition is usually the fast path — present it, let the lead **accept as-is or adjust**, then record it. This is how scope-risk findings actually get fixed: through clarify into the decision log, then re-generated — never by hand-editing the rendered pack.

## Workflow

**0 · Pull, then load.** First call `keel_pull(project_id)` (id from `.keel/project.json`). On **`409`** STOP and report the holder; on success lay down the snapshot if a `snapshot_url` is returned (see `/keel-pull`). Then read `constitution.md`, `discovery/open-questions.md`, `.keel/coverage-map.md`.

**1 · Show the board (orient the lead before touching anything).**
Print a categorised snapshot of the current open set so the lead sees the whole landscape at a glance. **Group by discipline** (Scope Hygiene, Product, UX, Engineering, Data/ML, Security, QA, Ops, Change, Commercial, Delivery, RAID), and within each list one line per open question: `ID · [BLOCK?] · tag · origin · the question` — surface the `raised-by: keel-review` origin so the lead can see which items came from the adversarial pass (these often ship with a suggested disposition ready to accept). Lead with a header line of totals:

```
Open: N   |   🔴 BLOCK: K   |   by tag: must-close X · assume-ok Y · T&M Z · future-phase W
By discipline:  Product 3 (2🔴) · Engineering 5 (3🔴) · Data/ML 4 (4🔴) · Security 2 · …
```

This is the "better information" view: the lead should be able to see what is blocking, where it clusters, and what is merely nice-to-have — before deciding how to spend the session.

**1b · The discipline filter — let the person choose what THEY are clarifying.** Not everyone answers everything: a developer should never be walked through UX questions, a designer not through integration auth. After showing the board, issue one `AskUserQuestion` (multiSelect) listing the disciplines that have open questions — label each with its open/blocking counts (e.g. `Engineering (5 open, 3🔴)`) — and let the person select which discipline(s) *this session* covers. Then work **only** the selected groups. The rules:
- **Unselected questions are untouched** — still open, still **[BLOCK]** where tagged, never dispositioned, de-prioritized, or auto-assumed because this person skipped them. Filtering is about *who answers*, never about *whether* it gets answered.
- The end-of-round report **names every unworked discipline** with its open/blocking counts and the suggested owner role: *"UX: 6 open, 2🔴 — needs a UX/design owner; Security: 3 open — needs the security lead."*
- The gate math is unchanged: unselected [BLOCK]s still gate `keel-generate`.

**2 · Choose how to answer.** Offer the lead three intake modes and let them pick:
- **(a) Inline (guided)** — resolve questions one at a time via guided prompts, discipline by discipline (best for a working session with the lead in the room).
- **(b) From files** — ingest material already dropped in `discovery/answers/` (notes, transcripts, memos).
- **(c) Both** — ingest the files first, then interactively mop up whatever they didn't cover.

**3 · Ingest file material** (modes b/c). For each open question, find what the material says and record *where* it came from — which session, which speaker, which memo, what date. An answer with no traceable source is not an answer (Law 6).

**4 · Interactive triage (modes a/c) — one question at a time via the structured question tool.**
This is the inline UX, and it must be **one item per screen** — never dump a discipline's questions as a list and wait for prose. Walk the open questions one at a time and, for each, issue a single `AskUserQuestion` prompt (Claude's structured Q&A tool) so the lead resolves exactly one question per screen:
- **header**: discipline + Q-id (e.g. `ENG · Q14`).
- **question**: the full question text, plus a one-line *why it matters / what it blocks* so the lead has context. **Research-sharpened questions carry example answers — use them as the option scaffold**: present the brief's 2–3 example answers as selectable options (the lead picks one or free-types), and point at the brief (`RB-03`) for the trade-offs.
- **answering is the free-text path, never an explicit option.** The lead types the answer into the tool's built-in **"Type something"** field. **Do not add an "I'll answer it" option** — it just duplicates the free-text box. A typed answer → CLOSED, provenance `client lead, inline, <date>`.
- **Sharpen vague answers NOW, in the same round — never kick the can.** If the answer is vague ("standard reports", "the usual approvals"), record it, then immediately write the sharpened follow-up: it **quotes the vague answer and names exactly what is missing** (*"You said 'standard reports' — name each report and its audience"*), tagged `raised-by: keel-clarify` and `supersedes: <Q-id>` where it replaces the original (mark the original `superseded-by:`). Present the follow-up in this session if the lead is still here; otherwise it waits in the register — but it exists *before* the round ends, not after the next re-score.
- **Research what you can't ground (Law 14).** When a question lacks example answers, or an answer names a system / standard / regime the corpus can't ground ("we use cietrade", "Quebec tax applies"), research it before pressing on — same brief format and location as `keel-map`'s (`discovery/research/RB-<nn>-<slug>.md`) — so the follow-up is specific, not another generic probe. More research is always acceptable; a generic follow-up where a specific one was researchable is not.
- **options** — the four explicit choices are the *dispositions* (what to do when there is no clean answer). Each must read as **visibly distinct from "Skip"** — never present two options that mean the same thing:
  1. **Make an assumption** — proceed on a stated assumption; capture its *impact-if-wrong* → RAID. **Resolves the gap (non-blocking).**
  2. **Exclude — out of scope** — the client acknowledges it's out; flows to scope exclusions. **Resolves (non-blocking).**
  3. **Defer / T&M** — push to a named later phase, or price that slice time-and-materials. **Resolves (non-blocking)** — making the decision is exactly what separates this from Skip.
  4. **Skip — decide later** — **no** decision is made; the question stays open / **[BLOCK]** and is resurfaced in the end report.

  Keep that line sharp: options 1–3 each *close* the item (it leaves the blocking set); only **Skip** leaves it red. The per-option **note** field captures the specifics — the assumption text, which phase to defer to, the exclusion wording.

  **Reasons carry their grounds (Part B).** A disposition note that states no basis — *"not applicable"*, *"out of scope"* with nothing behind it — fails the reason-quality bar and will fail the mechanical gate later. Push back **once**: ask what profile fact or evidence the decision rests on (*"out of scope because the client confirmed single-currency on the 6 May call"*), then record whatever the lead settles on. One push-back, not an argument.

Process questions in **discipline order**, pausing after each discipline to print its mini-tally (`Engineering: 3 closed · 1 assumed · 1 still 🔴`) so progress is visible as you go. Two practical rules:
- **Escape hatch** — before starting a discipline, offer the alternative: *"answer these one at a time (guided), or free-type answers to several at once?"* Guided one-by-one is best for deliberate triage; bulk free-typing is faster when the lead is transcribing answers they already have (e.g. reading from a call transcript). Honour the choice.
- **Batch only when tight** — if up to four questions are closely related you may put them in a single `AskUserQuestion` call (its maximum), but never more; keep the focused, one-thing-per-screen feel.

**5 · The forced-disposition rule (the anti-creep teeth).** A **[BLOCK]** question may not go green by being ignored or hand-waved. It gets a real, sourced answer, or the lead makes one of the dispositions above. **Silence is not a resolution** — the gate stays red until every [BLOCK] is answered or explicitly dispositioned. (A "Skip for now" leaves it red by design.)

**5a · Scenario gaps (`SCO-08`, Law 11) close by example or by an explicit decision — never by silence.** When the open item is a scenario class (happy / exception / edge) for a workflow, drive it to one of: (1) the lead **supplies the real example artifact** (drop in `discovery/answers/`; provenance = that file → re-scores Covered on the next `keel-map`); or (2) a **scenario disposition** — *not-applicable* (record the reason, e.g. "this module has no edge case because X" — a legitimate close, not a dodge), *out-of-scope* (the client signs that the unseen case is out), *assumption* (a stated behaviour, impact-if-wrong → RAID), or *defer / T&M*. A bare prose description of how the scenario *would* behave is **not** a demonstrated fact — record it as an **assumption** (impact-if-wrong), which closes it non-blocking but flags it unvalidated. The only state that stays red is a class **claimed-handled but neither exampled nor decided** — the exception-in-silence the gate exists to stop. Weight the **exception** class hardest before letting a module go green.

**5b · Instance items (`SCO-09`, Law 13) close per instance, and closed-world questions close on the record.** When the open item concerns a named instance (an integration, role, report, rule, tax regime), the answer must clear *that instance's* bar — and the **instance name goes into the decision-log entry verbatim**, so `keel-map` can update its row in `.keel/instance-inventory.md`. A closed-world question (*"are these ALL the integrations?"*) resolves to exactly one of: **confirmed** (with provenance — who confirmed, when), an **assumption** (impact-if-wrong → RAID-A: the unlisted instance is unpriced work), or an **exclusion/deferral** of the unconfirmed remainder. A closed-world question never closes on a shrug — it is the precise line between "the integrations we priced" and "the integrations we'll discover in build".

**6 · Adjudicate conflicts (Law 7).** When new material settles a conflict, record the resolution, **which source won, and why**. When it deepens or creates one, raise it. Never reconcile silently.

**7 · Capture what the round raised.** Discovery surfaces new gaps — expect the question set to *grow before it shrinks*. New questions get IDs, tags, owners, and a discipline; some will be blocking. This is healthy: better found now than in build.

**8 · Update the profile.** If an answer changes a profile axis (e.g. a language decision), update it in `.keel/coverage-map.md`'s profile block and note it — some dimensions will flip Required↔N-A on the next `keel-map` re-score.

**9 · Write `.keel/decision-log.md` and the updated `discovery/open-questions.md`. Then report the round** in the terminal:
- a **per-discipline resolution table** (closed / assumed / excluded / deferred / T&M / still-open this round);
- the **unworked disciplines** (filtered out in 1b): open/blocking counts + the suggested owner role for each;
- the **[BLOCK] remaining** — *computed from the file, not estimated*;
- the **gate status** (`🔴 N blocking → keel-generate gated` or `🟢 0 blocking → keel-generate unlocked`);
- the **single next discovery action** (highest-value question or session still open).

**9b · Push — check back in (`phase="map"`).** Sync the round's results and release the lock via the **begin → PUT → finish** flow — **never base64-encode the zip or read it into context (it stalls the agent)**. Zip `.keel discovery deliverables` (deliverables may be absent this early — fine):
```bash
zip -r .keel/_push.zip .keel discovery deliverables -x '.keel/_push.zip' 2>/dev/null || zip -r .keel/_push.zip .keel discovery
```
- `keel_push_begin(project_id, phase="map")` → `version` + `upload_url`
- `curl -sS -X PUT "<upload_url>" --data-binary @.keel/_push.zip -H "Content-Type: application/zip"`
- `keel_push_finish(project_id, version, phase="map")`

Then `rm -f .keel/_push.zip`. The `map` phase re-ingests `open-questions.md` (updated dispositions) and the coverage map without running the document gate. Report the new block count + open-questions count and that **the lock is released**. If a step fails, tell the user they can retry with `/keel-push` (phase `map`).

**10 · Loop.** Re-run `keel-map` to re-score against the enlarged evidence, then run `keel-clarify` again on the next round. Repeat until the gate is green. (Each skill re-pulls at its own start, so the lock released by this push is re-acquired automatically by the next run.)

## Outputs

- `.keel/decision-log.md` — **the audit trail.** For every resolved item: the **constitution dimension ID(s)** it concerns (e.g. `DAT-07`), the answer, its provenance, the disposition, the owner, the date. The dimension ID is what lets `keel-generate` route the decision into the correct Part F section (via the Renders-from crosswalk) and `keel-map` re-score the right dimension — carry it on every entry, never just a prose label.
- `discovery/open-questions.md` — updated: each question now CLOSED / ASSUMPTION / EXCLUSION / DEFER / T&M, or still **[BLOCK]**, grouped by discipline, each carrying its dimension ID(s) and origin.

## The gate (the one that matters)

`keel-generate` is unlocked only when **zero [BLOCK] questions remain**. Clarify reports this every round. Until then, generation is not permitted — a half-answered pack is exactly how scope creep gets in.

## Handoff

`keel-generate` reads `.keel/decision-log.md` (assumptions → RAID, exclusions → scope, defers/T&M → phasing/commercial) and the re-scored `.keel/coverage-map.md`. Re-run `keel-map` after every clarify round; the loop ends when [BLOCK] = 0.
