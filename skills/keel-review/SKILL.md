---
name: keel-review
description: "The last gate before freeze. Reads ALL SIX finished discovery documents adversarially — the way a client's procurement lead and lawyer would — hunting residual ambiguity, silent inclusions, untestable acceptance criteria, undefined terms, uncapped exposure, over-promising narrative, and owed/placeholder content that survived everything upstream. Walks every Part F section of every document so nothing is left un-probed. Cross-document consistency is assumed handled by keel-generate; review hunts meaning, not structure. Produces a severity-ranked Scope Risk Report — with a coverage ledger and a ready-to-paste fix per finding — and a freeze verdict (any High → FREEZE-BLOCKED). Triggers on: 'review the pack', 'red-team the scope', 'where could the client expand scope', 'is this safe to sign', 'final scope check before freeze'."
---

# Keel · Review

The adversary in the loop. Everything upstream tried to make the pack complete and precise; `keel-review` assumes that failed *somewhere* and goes looking for it — specifically for any wording a client could use to expand scope or dispute "done" after the price is fixed. It is the difference between *consistent* (which `keel-generate`'s sub-gates prove) and *unexploitable* (which only a hostile reading finds). Its job is to make the pack **definitive**: no decision implied, no expectation un-bound, no "done" arguable.

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

## Owed / placeholder content rule

`generate` may write thin sections that state what is still owed. In a **binding document (Doc 2, 3, or 6)**, any section still carrying *owed / TBD / to-be-confirmed / Partial* content is a **High** — you cannot freeze a fixed price on a placeholder. (Thinness in Doc 1 or Doc 5 narrative is usually Medium.) Name the owed item and point at the discovery activity that closes it.

## Output — `deliverables/scope-risk-report.md`

- **Findings:** per finding — an ID · severity · the location (doc + Part F section) · the **hostile reading** ("as a client I'd argue…") · a **route** (A or B, below) · and the **fix as a source edit** — the exact text to add *upstream*, never a hand-edit of the rendered doc.
- **Coverage ledger:** a table of all six documents × their Part F sections **by section ID** (`F1.1 … F6.6`), each marked *clean / finding(s) / not-probed*. This proves the review was exhaustive — a section ID missing from the ledger is an un-probed section.
- **Action plan:** the findings grouped by route, in the order to execute them (below).
- **Verdict** (the severity/coverage rules below).

Print a short terminal summary: finding counts by severity, the verdict, any not-probed sections, **and the action plan** — so the next step is never ambiguous.

## Feed findings back into the register (so the loop resolves them)

A review finding is just a **late-discovered open item** — and Keel already has one home for open items (`discovery/open-questions.md`) and one engine that drives them to a terminal state (`keel-clarify`). So `review` does **not** invent a parallel fix path; it **feeds the register**, exactly like `map` does. After writing the report, append every finding to `discovery/open-questions.md` as a new open question:

- give it an ID and tag it **`raised-by: keel-review, round N`** (so `map` preserves it on re-score and provenance is clear);
- carry its **route** (A or B), its location (doc + Part F section), and its **suggested disposition** — the ready-to-paste exclusion / definition / cap the report already wrote;
- mark Route-A findings (owed/Partial) and any High as **[BLOCK]** so the gate reflects them.

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
(`<kit>/checks/` sits beside the `constitution.md` you loaded; skip with a note if it isn't present.) It mechanically confirms the report exists, **the verdict matches the High count** (a FREEZE-CLEAR with any High is a hard failure), and **the coverage ledger references every active Part F section** (an un-probed section blocks FREEZE-CLEAR). A non-zero exit means your narrative and the machine disagree — fix the report (or finish the un-probed section) until they reconcile. Print the check output in the terminal summary. This is also where the `SCO-08` ledger is re-checked transitively: if the pack changed, re-run `keel-generate`'s check too — a freeze verdict is only as honest as the gates behind it.

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
