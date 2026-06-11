---
name: keel-review
description: "The last gate before freeze. Reads ALL SIX finished discovery documents adversarially — the way a client's procurement lead and lawyer would — hunting residual ambiguity, silent inclusions, untestable acceptance criteria, undefined terms, uncapped exposure, over-promising narrative, and owed/placeholder content that survived everything upstream. Walks every Part F section of every document so nothing is left un-probed. Cross-document consistency is assumed handled by keel-generate; review hunts meaning, not structure. Produces a severity-ranked Scope Risk Report — with a coverage ledger and a ready-to-paste fix per finding — and a freeze verdict (any High → FREEZE-BLOCKED). Triggers on: 'review the pack', 'red-team the scope', 'where could the client expand scope', 'is this safe to sign', 'final scope check before freeze'."
---

# Keel · Review

The adversary in the loop. Everything upstream tried to make the pack complete and precise; `keel-review` assumes that failed *somewhere* and goes looking for it — specifically for any wording a client could use to expand scope or dispute "done" after the price is fixed. It is the difference between *consistent* (which `keel-generate`'s sub-gates prove) and *unexploitable* (which only a hostile reading finds). Its job is to make the pack **definitive**: no decision implied, no expectation un-bound, no "done" arguable.

## Precondition — a linked project

This folder must be **linked to an engagement** before review runs. Check for `.keel/project.json`. **If it is missing, STOP and run `/keel-connect` first** (one-time link).

This skill **manages checkout itself**: **before reading anything** it calls `keel_pull(project_id)` (id from `.keel/project.json`) to lock the project and download the latest pack you're about to red-team — on a **`409`** STOP and report the holder; on success lay down the snapshot if a `snapshot_url` is returned. At the end (the *Push* step below) it calls `keel_push(project_id, …, phase="review")` to run the authoritative server gate, ingest the findings, and release the lock. `/keel-pull` and `/keel-push` remain manual escape hatches (re-acquire after a `409`; push by hand if auto-push failed). If the binding is present, continue.

## The standard

Read `constitution.md` (project root, then kit root). Two parts matter here:
- **The Doctrine (Part A)** — review enforces it as an adversary: *silence-is-exclusion*, *every-criterion-testable*, *no-weasel-words*, *every-assumption-carries-impact*, *conflicts-surfaced*.
- **Part F (Pack Structure)** — the section map of each document; review walks it section by section so coverage is provable, not assumed.

## Where files live

- Reads: the **six pack documents** in `deliverables/` (`1-executive-summary.md` … `6-approval-and-signoff.md`), `.keel/decision-log.md`, `.keel/coverage-map.md`, `discovery/open-questions.md`.
- Writes: `deliverables/scope-risk-report.md` (the human-facing report) **and** `discovery/open-questions.md` (the findings, fed back into the register so they re-enter the loop — see *Feed findings back into the register* below).

## How to review — exhaustive, document by document

Do **not** spot-check. Walk **all six documents, every Part F section in each**, applying the generic lenses *and* the section-specific probes below. The report ends with a **coverage ledger** naming every document and confirming it was read end-to-end; a section you did not probe is a hole in the gate, so an un-probed section **blocks a FREEZE-CLEAR verdict** — you cannot certify what you did not read.

## The red-team lenses (apply to every section)

As the client's lawyer, ask:
- **Ambiguity** — does any statement admit a broader reading than intended?
- **Silent inclusion** — is there an adjacent thing a client would *assume* is included because it isn't excluded? *(the dangerous one — most creep enters here)*
- **Untestable / arguable criterion** — does a "done" definition hide a disputable qualifier ("answerable", "reasonable", "appropriate", "seamless")?
- **Undefined term** — "basic", "standard", "full", "as required", "etc.".
- **Uncapped exposure** — volume, iterations, revisions, support duration, the scope of "ongoing" — anything open-ended sitting under a fixed price.
- **Weak teeth** — does each price-gating assumption carry a deadline *and* a consequence? Does change-control require **written approval before work starts**?
- **External deferral (Law 12)** — does any statement's *substance* live in an external citation? *"Matching is handled per §4.4 of the RFP"* — as the client I'll argue §4.4 means whatever the RFP says, **not what you priced**. Every rule must be spelled out in the pack; an external reference is only valid as a `Source:` suffix. A binding section whose body defers to the RFP/SOW is a **High**.
- **Unenumerated plural (Law 13)** — challenge every plural: *"the required reports"* — which reports, exactly, and **who confirmed the list is complete**? A class rendered in the plural without its named instances (and its closed-world confirmation in the instance inventory) is creep wearing a summary; at least Medium, High when it gates acceptance or price.

## High-creep-zone probes (section-specific — where creep actually enters)

Run these targeted checks against the named Part F sections; a failure is at least Medium, usually High:

- **Scope (Doc 2):** every module has an **explicit out-of-scope** list, not just in-scope (silence per module = creep); every module's **acceptance criterion is pass/fail** with no disputable qualifier; the **AI-vs-deterministic split** is unambiguous (a client must not be able to argue "the AI should have handled that"); the **prioritisation** marks Won't/Could explicitly so they can't be pulled into the baseline; **global out-of-scope** is enumerated.
- **Scenario coverage — the `SCO-08` join (`F2.3` happy-path ⇄ `F2.8` exception + edge, Law 11):** every in-scope process module must, for each scenario class, carry **either a real example traced to a source artifact or an explicit disposition** (out / N-A-with-reason / assumption) — and `F2.3`/`F2.8` must concern the same workflow. The **High** is the *silent middle*: a module written scope-ready whose **exceptions are described in prose but neither demonstrated by a real example nor dispositioned** — that is the unpriced-work loophole, the single most common fixed-bid leak (the client will argue the unseen exception was always in scope). A consciously recorded *"no edge case, because X"* is fine and **not** a finding; a bare *"the system handles exceptions"* with nothing behind it is a **High**. Weight the exception class hardest.
- **Architecture (Doc 3):** **NFRs are numbers, not adjectives** (p95 latency, availability %, throughput); **integration specs name who owns the other side** and what happens if the client's system changes (uncapped exposure); the **Responsible-AI rule** (AI never finalises irreversible actions without the human step) is present.
- **AI definition-of-done — the `DAT-07` join (`F2.11` Scope acceptance ⇄ `F3.3` Architecture AI/ML ⇄ decision log):** every AI capability has a **numeric accuracy threshold + an evaluation method (`DAT-08`) + who agrees the result**, *and the acceptance bar in `F2.11` reads identically to the one in `F3.3`* (they share dimension `DAT-07`, so they must match verbatim). An AI capability whose "done" is undefined, or where the two sections disagree, is a **High** — it is the largest fixed-bid AI loophole.
- **RAID (Doc 4):** every **assumption** carries impact-if-wrong, and every *price-gating* one carries a **validation deadline + a consequence** (→ change control); every **dependency** has an owner and a *by-when* (a missing date means the vendor silently eats the slip); **zero must-close-before-estimate** questions remain open.
- **Implementation Plan (Doc 5):** **warranty / bug-fix window** has a length *and* a definition of what qualifies; **revision/iteration counts** are stated (design rounds, UAT fix rounds); "**maintenance / ongoing / support**" is duration-capped; **entry/exit criteria** are testable.
- **Approval (Doc 6):** the **exclusions acknowledgement mirrors the Scope exclusions exactly** (the client signs the "out" list); **change-control requires written pre-approval** and states cost/time impact; the **scope-freeze statement** binds the *enumerated* baseline; **silence-is-exclusion is stated and acknowledged in writing** (Law 1).

## Cross-document creep (read the docs against each other — by the Part G joins)

Use the constitution's Part G crosswalk: any dimension ID listed in **more than one** Part F section is a join that must agree. The critical ones:
- **Aspirational vs binding** — does **Future-state vision / Recommended approach (`F1.3` / `F1.4`)** promise any outcome the **Scope (Doc 2)** does not bind as a scoped module? Narrative over-promise is a High: the client will point at it.
- **`SCO-04` exclusions join** — every global exclusion in `F1.5` / `F2.14` is acknowledged verbatim in `F6.3` (and per-module exclusions in `F2.5` roll up there too).
- **`COM-07` sign-off join** — `F6.1`, `F6.3`, `F6.6` tell one consistent story about what is being frozen.
- **`SCO-08` scenario join** — for each module, `F2.3` (happy-path) and `F2.8` (exception/edge) concern the *same* workflow; a module whose `F2.8` leaves the exception class **blank — neither an example nor a disposition** — while `F2.3` claims a working process is a scenario-in-silence **High** (Law 11). An explicit "no exception, because X" is clean.
- **Decision requested (`F1.8`)** asks for approval of the *enumerated frozen baseline*, not a vague "approve the direction".

## Decision fidelity — reconcile the log against the pack (the factual-slip net)

Cross-document consistency proves the pack agrees with *itself*; this pass proves it agrees with **what was actually decided**. Walk **every entry in `.keel/decision-log.md`** and locate its rendered statement in the pack (the entry's dimension ID + the Part G crosswalk tell you which section(s) to look in). For each entry check three things:
- **Present** — the decision is rendered somewhere it binds (a decided-but-unrendered decision is silence, Law 1);
- **Faithful** — the rendered number, enumeration, or disposition **matches the log verbatim in substance** (a threshold that drifted from `≥94%` to `94%`, an exclusion that softened to a deferral, an enumeration that lost a member — each is a **factual slip, High**);
- **Consistent** — where the crosswalk renders one decision into several sections, all of them say the same thing.

The results go into the report as a mandatory **`## Decision reconciliation`** section: one table row per log entry — *decision / dimension ID · rendered location (F-section) · match / MISMATCH (what drifted)*. `check_review` fails the report if the decision log is non-empty and this section is missing, and warns when it has fewer rows than the log has entries — reconcile all of them, not a sample.

## Owed / placeholder content rule

`generate` may write thin sections that state what is still owed. In a **binding document (Doc 2, 3, or 6)**, any section still carrying *owed / TBD / to-be-confirmed / Partial* content is a **High** — you cannot freeze a fixed price on a placeholder. (Thinness in Doc 1 or Doc 5 narrative is usually Medium.) Name the owed item and point at the discovery activity that closes it.

## Output — `deliverables/scope-risk-report.md`

- **Findings:** per finding — an ID · severity · the location (doc + Part F section) · the **hostile reading** ("as a client I'd argue…") · a **route** (A or B, below) · and the **fix as a source edit** — the exact text to add *upstream*, never a hand-edit of the rendered doc.
- **Decision reconciliation:** the mandatory table from the decision-fidelity pass above — one row per decision-log entry, *decision / dimension ID · rendered location · match / MISMATCH*. `check_review` enforces its presence.
- **Coverage ledger:** a table of all six documents × their Part F sections **by section ID** (`F1.1 … F6.6`), each marked *clean / finding(s) / not-probed*. This proves the review was exhaustive — a section ID missing from the ledger is an un-probed section.
- **Action plan:** the findings grouped by route, in the order to execute them (below).
- **Verdict** (the severity/coverage rules below).

Print a short terminal summary: finding counts by severity, the verdict, any not-probed sections, **and the action plan** — so the next step is never ambiguous.

## Feed findings back into the register (so the loop resolves them)

A review finding is just a **late-discovered open item** — and Keel already has one home for open items (`discovery/open-questions.md`) and one engine that drives them to a terminal state (`keel-clarify`). So `review` does **not** invent a parallel fix path; it **feeds the register**, exactly like `map` does. After writing the report, append every finding to `discovery/open-questions.md` as a new open question:

- give it an ID and tag it **`raised-by: keel-review, round N`** (so `map` preserves it on re-score and provenance is clear);
- carry its **route** (A or B), its location (doc + Part F section), and its **suggested disposition** — the ready-to-paste exclusion / definition / cap the report already wrote;
- mark Route-A findings (owed/Partial) and any High as **[BLOCK]** so the gate reflects them;
- **supersede, never parallel.** When the finding *tightens an existing question* — open, or closed on a vague answer — the new question carries `supersedes: <Q-id>` and the original is marked `superseded-by: <new id>`, removing it from the active set. The lead must never be able to re-answer the vague original and defeat the sharpened finding: one gap, one active question, and it is the sharp one.

This makes `clarify` the single disposition path for *every* gap, whether `map` found it or `review` did — one register, one decision-log writer, full traceability. The `scope-risk-report.md` remains the human-readable adversarial narrative; `open-questions.md` is the machine-actionable feed.

## After the report — routing each finding to its fix (the action)

**The golden rule: never edit anything in `deliverables/`.** Those six files are *rendered* from `.keel/` state every `keel-generate` run — a hand-edit there is overwritten on the next render. **Every fix lands upstream via the register, then you re-generate.** Both routes now flow through `clarify`:

- **Route B — tighten a decision (the info exists; the wording is loose).** *Ambiguity / silent-inclusion / uncapped* findings (e.g. "ClickUp-like", "version history beyond basic"). The finding is already in `open-questions.md` with a suggested disposition (a new exclusion, an enumerated definition, a numeric cap). Resolve it through the normal loop:
  `/keel-clarify (accept or adjust the suggested disposition → decision-log) → /keel-generate`.
  Fast: no discovery needed, just a recorded decision.

- **Route A — needs discovery (the info doesn't exist yet).** *Owed / Partial* findings (missing acceptance criteria, screen inventory, field list). Not a wording change — run the real work, then let the loop re-render:
  `run DA-x → drop results in discovery/answers/ → /keel-clarify → /keel-map (re-score) → /keel-generate`.
  The finding names the activity that closes it. These are usually the pack's own freeze prerequisites.

**Who does what:** Route-B dispositions are decisions the lead can make on the spot in `keel-clarify` (the suggested wording is already written — accept or adjust). Route-A items require the project lead to actually run the sessions; the agent can't manufacture the missing design detail (same principle as `keel-clarify` everywhere). The report's action plan lists Route-B first (fast, do-now) and Route-A second (the real-world work that gates freeze).

## Severity & the freeze verdict

- **High** — a loophole that could materially expand scope or dispute "done" (incl. an undefined AI accuracy bar, owed content in a binding doc, narrative over-promise, an uncapped "ongoing", or a workflow scenario class — especially exceptions — claimed-handled but neither exampled nor dispositioned, Law 11). **Any High → 🔴 FREEZE-BLOCKED.**
- **Medium** — tighten before sign-off; non-blocking.
- **Low** — wording.
- **Coverage** — any Part F section *not probed* also blocks 🟢 FREEZE-CLEAR (incomplete review ≠ clean review).

The verdict (0 High **and** full coverage → 🟢 FREEZE-CLEAR) **is** freeze prerequisite #1 listed in `deliverables/6-approval-and-signoff.md`.

## Self-verify mechanically — run the check, don't certify on assertion

After writing `scope-risk-report.md`, run the bundled gate and reconcile it with your own verdict:
```bash
python3 <kit>/checks/check_review.py <engagement-dir> <constitution.md>
```
(`<kit>/checks/` sits beside the `constitution.md` you loaded; skip with a note if it isn't present.) It mechanically confirms the report exists, **the verdict matches the High count** (a FREEZE-CLEAR with any High is a hard failure), **the coverage ledger references every active Part F section** (an un-probed section blocks FREEZE-CLEAR), and — when the decision log is non-empty — **the `## Decision reconciliation` section is present** with a row per log entry (warn on shortfall). A non-zero exit means your narrative and the machine disagree — fix the report (or finish the un-probed section) until they reconcile. Print the check output in the terminal summary. This is also where the `SCO-08` ledger is re-checked transitively: if the pack changed, re-run `keel-generate`'s check too — a freeze verdict is only as honest as the gates behind it.

## Push — check back in (`phase="review"`)

Once `scope-risk-report.md` is written, the findings are appended to `open-questions.md`, and the bundled check reconciles, push the **review** phase so the server runs the authoritative `check_review`, ingests the findings (they appear on the dashboard's Review tab), and releases the lock. Use the **begin → PUT → finish** flow — **never base64-encode the zip or read it into context; that stalls the agent**:
```bash
zip -r .keel/_push.zip .keel discovery deliverables -x '.keel/_push.zip'
```
- `keel_push_begin(project_id, phase="review")` → `version` + `upload_url`
- `curl -sS -X PUT "<upload_url>" --data-binary @.keel/_push.zip -H "Content-Type: application/zip"`
- `keel_push_finish(project_id, version, phase="review")`

Then `rm -f .keel/_push.zip`. Report the returned `gate` verdict **verbatim**, the snapshot `version`, the ingested finding counts, and that **the lock is released**. If you red-teamed a pack you also just generated this session, push **generate first, then review** (each finish releases the lock, so re-pull between them) — or simply let `keel-generate`'s own auto-push run before this skill. If a step fails, tell the user they can retry by hand with `/keel-push` (phase `review`).

## Loop

Findings go into the **register**, get **dispositioned by clarify**, then re-render — never a hand-edit of `deliverables/`:

```
keel-review ─► scope-risk-report.md   (human-facing narrative)
            └► open-questions.md       (findings as new open items, tagged raised-by: keel-review)
                     │
                     ▼
              keel-clarify  (disposition each → decision-log)
                     │   └─ Route A items also need: run DA-x → discovery/answers/ → keel-map (re-score)
                     ▼
              keel-generate  (re-render the 6 docs)
                     │
              re-run keel-review ◄──┘
```

Repeat until **0 High and full coverage**. Each re-generate re-asserts `keel-generate`'s structure + cross-document sub-gates, so a fix can't quietly break consistency. Then, with every Recommended dimension decided and the DPA signed, the pack is frozen and goes to sign-off. (After freeze, any change is change-control, not a loop iteration.)

## This closes the kit

`keel-map` → `keel-clarify` → `keel-generate` → `keel-review`, over the constitution, gated at every stage. A frozen, signed pack — every section probed, every "done" testable, every exclusion acknowledged — is the defensible baseline scope creep has nowhere to enter.
