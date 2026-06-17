# The Discovery Constitution

*The completeness-and-precision standard that every discovery pack is built against and checked against. Written once, versioned, reused on every engagement. The `map`, `clarify`, `generate`, and `review` phases all consume this file.*

It has two teeth:

- **The Doctrine** (Part A) — the laws every artifact must obey. These fight *ambiguity*.
- **The Completeness Model** (Parts C–D) — the exhaustive dimension catalog, made conditional by a project profile (Part B). This fights *silence*.

---

## Part A — The Doctrine

Fifteen laws. The `review` phase enforces them; a pack cannot be frozen while any is violated.

1. **Silence is exclusion.** Anything not explicitly in scope is out of scope. The pack states this and the client acknowledges it in writing.
2. **Every requirement is testable.** If you cannot write a pass/fail check for it, it is not a requirement yet — rewrite it until you can.
3. **No weasel words.** *Robust, fast, large, scalable, user-friendly, seamless, as needed, etc., and so on* are replaced with a number, a threshold, or an enumeration. The precision linter flags every instance.
4. **Every assumption carries an impact-if-wrong** and lives in the RAID register. A fixed price is valid only while its assumptions hold.
5. **Every gap is dispositioned, never left open.** Each resolves to exactly one of: a documented assumption, an explicit exclusion, a deferred-to-phase item, or a T&M item.
6. **Everything is traceable.** Every fact traces to a source (file / page / call / who-said-it); every acceptance criterion traces to a requirement; every in-scope module traces to a delivery phase.
7. **Conflicts are surfaced, not resolved silently.** Contradictory sources become open questions. The curated (direct-drop) version is presumptively authoritative — but the conflict is still raised for confirmation.
8. **Nothing the client provided is silently dropped.** Unprocessed inputs (e.g. recorded calls not yet transcribed) are registered in the asset manifest as coverage risks, not ignored.
9. **Coverage is judged against the full corpus,** not the curated subset. Salience sets retrieval priority; it never sets the boundary of what gets audited.
10. **Applicability is explicit.** Every dimension is Required, Conditional, Recommended, or N-A *by rule*. An N-A is a recorded decision with a reason — never a skip.
11. **No scenario passes in silence.** For every workflow or process module, each scenario class — **happy path, exceptions, edge cases** — must be *either* demonstrated by a real example traced to a source artifact *or* explicitly dispositioned (N-A-with-reason, out-of-scope, or an assumption carrying impact-if-wrong). What is forbidden is a scenario class **claimed-handled but neither exampled nor dispositioned** — *"we handle exceptions"* with nothing behind it, the canonical silent-inclusion where the unseen exception becomes the unpriced work. A consciously recorded *"no edge case here, because X"* satisfies this law; silence does not. The teeth fall hardest on the **exception** class, where fixed-bid creep actually enters — a happy path is rarely the thing a client disputes after signature.
12. **The pack is self-contained.** Every rule, threshold, formula, and enumeration is spelled out in full at the point where it binds. A citation (*"per §4.4 of the RFP"*, *"as defined in the SOW"*) is provenance, never a substitute for content — a section that defers its substance to an external document is silence wearing a footnote. Source references are welcome as suffixes (*"Source: RFP §4.4"*); they are forbidden as bodies. The reader of the pack must never need the RFP open beside it.
13. **Named instances are enumerated, never summarized.** Wherever the evidence or a decision names instances of a class — integrations, roles, reports, business rules, tax regimes, document types — the pack carries one entry per named instance, each clearing its dimension's bar individually, and the closed-world question (*"are these ALL the X's?"*) has been explicitly answered or dispositioned. A class summarized in the plural (*"the required integrations"*) is a Partial, not a Covered.
14. **When in doubt, research.** A gap, a named system / standard / regulation, or a vague answer that the team cannot ground from the corpus is **researched before it is asked about or scored** — what does EDI 820 actually require, what does this provider's auth actually look like, what does this tax regime actually split? Skipping research is the exception that needs a one-line reason, never the default: more research is always acceptable; a generic question where a specific one was researchable is not. Research informs questions and briefs — it never closes a dimension by itself (closure stays with the lead, per Law 5).
15. **Silence hides in shapes the catalog cannot name.** The fixed catalog (Parts C–D) fights *known* silence — but every project has decision areas no catalog row anticipated: record relationships, liability boundaries, failure tails, handoff inaction, cross-boundary data-correctness ownership, temporal peaks, named domain rules. `map` therefore runs a fixed set of **domain-agnostic discovery lenses** (defined in Part E) over *this* project's evidence and profile and **derives** its project-specific decision areas as first-class **`PRJ-*` dimensions**. A `PRJ-*` dimension is scored, dispositioned, routed to a Part F home, freeze-gated, and rendered with **the same rigor as a catalog dimension** — the only difference is that it lives in the engagement's `.keel/project-dimensions.md`, never in this constitution (which stays the fixed, versioned, cross-engagement standard, so its catalog stays machine-checkable). A discovered area left unscored or unrouted is the same defect as a catalog Gap left unquestioned (Law 1). Lenses *generate*, never *enumerate* — they extend the precedent of Law 13 (which enumerates instances of a class) up one level, to the classes themselves the catalog never named.

---

## Part B — How Applicability Works

Each dimension in the catalog has an **Applies-when** rule expressed over the project profile. At the start of `map`, the profile is set, and every dimension resolves to a status:

| Status | Meaning | Effect on the freeze gate |
|---|---|---|
| **Required** | Must be covered. | A Required dimension left as a Gap **blocks** generate/freeze. |
| **Conditional** | Required *only if* its Applies-when rule is true for this profile; otherwise resolves to N-A. | Same as Required when active. |
| **Recommended** | Good practice for this profile; does *not* default in or out. | The project lead must make an explicit **include / exclude** decision. *Include* → must be covered like a Required item. *Exclude* → a one-line reason is logged. An **undecided** Recommended dimension **blocks** the gate — the gate checks that a *decision exists*, not that the item is covered. |
| **N-A** | Ruled out by the profile. | Recorded with its reason in the coverage map. Does not block. |

**"Covered" means** (the third column in every catalog table) is the bar each dimension must clear — the anti-vagueness teeth. A dimension that is *present but vague* counts as **Partial**, not Covered, and Partial on a Required dimension blocks just like a Gap.

**Per-instance bars score per instance (Law 13).** A dimension whose bar reads *"per X"* or *"each X"* (e.g. `ENG-04` per system, `SEC-01` per role, `PRD-09` each report) is Covered only when **every inventoried instance individually clears the bar** *and* the class is closed-world-confirmed (the lead has answered or dispositioned *"are these all the X's?"*). One vague instance, or an unanswered closed-world question, makes the whole dimension **Partial**. The instance inventory (`.keel/instance-inventory.md`, dimension `SCO-09`) is the machine-readable record this rule scores against.

**Reasons carry their grounds.** An N-A reason, an exclusion note, or any disposition's rationale must state the **profile fact or evidence it rests on** — *"N-A: Surface = Batch/Pipeline, no human-facing screens"* is a reason; *"N-A because not applicable"* is not, and scores as **undecided** (it blocks like a missing decision).

**Dispositioned counts as Resolved.** A Gap or Partial whose open question has been dispositioned — a documented assumption, an explicit exclusion, a deferred-to-phase item, or a T&M item (Laws 4–5) — is **Resolved** for progress purposes: it no longer counts against readiness, while staying visibly distinct from Covered (evidenced). The coverage map records it in the Score cell as e.g. `Partial — resolved (assumption RAID-A12)`. Progress is reported as **Resolved %** (covered + resolved, over applicable dimensions); Covered % remains the evidence-only statistic. An undispositioned Gap/Partial is the only thing that counts as unresolved.

**Who decides what.** Required and Conditional are settled by *rule* — the profile resolves them automatically. Recommended is deliberately left to the *human*: these are the judgement calls the project lead should consciously own. The system makes them un-skippable not by forcing them in, but by refusing to freeze until the lead has looked at each one and *chosen*. Optionality with a forced, recorded decision — never a silent default.

---

## Part C — The Project Profile

The small set of facts that drive every applicability rule. Set once per engagement; revisable as discovery reveals more.

| Axis | Options | Primarily drives |
|---|---|---|
| **Surface** | UI · API/Library · Internal tool · Batch/Pipeline · Agent/Automation | UX, API contracts |
| **End users** | External · Internal · Developers · None (M2M) | UX, personas, change mgmt |
| **Platforms** | Web · iOS · Android · Desktop · CLI · None | UX breadth, device matrix |
| **AI/ML** | None · Extraction · Predictive · Generative · Agentic | All AI dimensions |
| **Data sensitivity** | None · PII · PHI · Financial | Security, compliance |
| **Regulated** | None · GDPR · HIPAA · PCI · SOC2 · Sector-specific | Compliance, audit, pen-test |
| **Integrations** | None · Few · Many | Integration specs |
| **Migration** | Yes · No | Data migration scope |
| **Codebase** | Greenfield · Brownfield · Replacement | Migration, parity, interop |
| **Tenancy** | Single · Multi | AuthZ, data isolation |
| **Hosting** | Vendor-cloud · Client-infra · On-prem · Hybrid | Ops, environments, residency |
| **Latency** | Standard · Real-time | NFRs |
| **Languages** | Single · Multi · Multi+RTL | Content, i18n |
| **Post-launch ops** | Vendor · Client · Shared | Support, handover, training |
| **Commercial** | Fixed-bid · T&M · Hybrid | How tightly scope must freeze |
| **Phasing** | Full (Learn→Proof→Ship→Evolve) · Partial | Phase/plan dimensions |

> The tighter the commercial model (Fixed-bid) and the more Required dimensions in Gap, the more discovery is needed before a price can be committed.

---

## Part D — The Dimension Catalog

Disciplines: **0** Scope Hygiene · **1** Product · **2** UX/Design · **3** Engineering · **4** Data/ML · **5** Security/Compliance · **6** QA/Test · **7** Ops/Support · **8** Change/Adoption · **9** Commercial/Governance · **10** Delivery/Planning. RAID is cross-cutting (noted at the end).

Beyond these eleven disciplines, an engagement may carry **project-specific `PRJ-*` dimensions** discovered by the lenses (Law 15; the lens set lives in Part E). They are defined, scored, and routed in engagement state (`.keel/project-dimensions.md` + the coverage map), **not** in this catalog — so the catalog's per-discipline IDs and counts stay fixed and machine-checkable, while per-project completeness stays open-ended. A `PRJ-*` dimension resolves Required / Conditional / Recommended / N-A and Covered / Partial / Gap by the **same Part B rules** as a catalog dimension.

### 0 · Scope Hygiene — *Owner: Engagement lead / BA*

| ID | Dimension | Applies when | "Covered" means |
|---|---|---|---|
| SCO-01 | Scope statement | Always (Required) | One sentence defining the boundary of what is delivered. |
| SCO-02 | Module / capability breakdown | Always | The work decomposed into named modules, each independently sign-off-able. |
| SCO-03 | In-scope / out-of-scope per module | Always | Both lists explicit per module; "out" is enumerated, not implied. |
| SCO-04 | Global exclusions | Always | Cross-cutting things explicitly *not* included (so silence can't add them). |
| SCO-05 | Acceptance criteria | Always | A pass/fail check per module, measurable, traceable to requirements. |
| SCO-06 | Glossary of terms | Always | Every domain/ambiguous term defined once, used consistently. |
| SCO-07 | Prioritisation | Always | Each capability tagged Must/Should/Could/Won't for this scope. |
| SCO-08 | Scenario coverage | Per module with a process workflow (Required); N-A for modules with no workflow, with reason | Each scenario class — happy / exception / edge — is **either** demonstrated by a real example traced to a source artifact **or** explicitly dispositioned (N-A-with-reason / out-of-scope / assumption-with-impact). **Covered** = no class left in silence; **Partial** (blocks like a Gap) = a class is claimed-handled but neither exampled nor dispositioned (exceptions weighted hardest); **Gap** = the workflow itself is unevidenced. A consciously recorded *"no edge case, because X"* is Covered, not a gap (Law 11). The anti-silent-inclusion gate behind scope-readiness. |
| SCO-09 | Instance enumeration | Any active dimension's bar is per-instance — "per system", "per role", "each named" (Required); N-A with reason when no per-instance dimension is active | For each instance class named anywhere in the evidence (integrations, roles, reports, business rules, tax regimes, document types, …), an **inventory with one row per named instance** (`.keel/instance-inventory.md`), each row clearing its host dimension's bar or carrying an explicit disposition, **plus** the closed-world confirmation — *"are these ALL the X's?"* — answered with provenance or dispositioned. **Covered** = every instance specified-or-dispositioned and every class closed-world-confirmed; **Partial** (blocks like a Gap) = a vague plural, an instance with nothing behind it, or an unconfirmed closed-world; **Gap** = a named class with no inventory at all (Law 13). |

### 1 · Product — *Owner: Product / Engagement lead*

| ID | Dimension | Applies when | "Covered" means |
|---|---|---|---|
| PRD-01 | Problem & business driver | Always | The business problem in the client's terms, with the trigger to act now. |
| PRD-02 | Success metrics | Always | A North Star plus guardrail metrics, each measurable with a target. |
| PRD-03 | User segments / personas | End users ≠ None | The user classes served, and which are explicitly *not* served. |
| PRD-04 | Use cases / jobs-to-be-done | Always | Enumerated and prioritised; the primary flows named. |
| PRD-05 | Out-of-scope use cases | Always | Explicit list of use cases the system will *not* support. |
| PRD-06 | MVP / phase boundary | Phasing = Full or Partial | What "v1" includes vs. what is later; the line is unambiguous. |
| PRD-07 | Volume / usage assumptions | Always | Expected load, data sizes, concurrency — as numbers (feeds NFRs). |
| PRD-08 | Business-decision dependencies | Recommended | Decisions the *client* must make, with by-when dates. |
| PRD-09 | Reporting & analytics | End users ≠ None (Recommended); N-A for M2M/pipeline-only systems, with reason | Which reports, dashboards, and exports are in scope — each named — and which are explicitly not. |

### 2 · UX / Design — *Owner: Design lead*

> Resolves to **N-A** (whole discipline, with reason) when **Surface ≠ UI** — no human-facing interface is being built — *or* End users ∈ {None, Developers}. Otherwise **Required**. If an internal tool, pipeline, or migration ships *any* human-facing screens, set Surface = UI so this discipline activates; a data migration whose users only ever touch the destination system's own UI builds no interface and takes the N-A. (This is the API-library-vs-user-product distinction — keyed on whether *we* are building an interface, not on whether humans exist.)

| ID | Dimension | Applies when | "Covered" means |
|---|---|---|---|
| UXD-01 | Platforms & form-factor matrix | Surface = UI | Exact platforms/breakpoints in scope, and those excluded. |
| UXD-02 | Screen / flow inventory | Surface = UI | Every screen and flow listed; nothing "obvious" left implicit. |
| UXD-03 | State coverage | Surface = UI | For each flow: default, loading, empty, error, partial, success, offline, permission-denied, zero-data, overflow — all addressed. |
| UXD-04 | Design fidelity & deliverables | Surface = UI | Wireframe vs hi-fi vs prototype vs dev-ready spec — which, for what. |
| UXD-05 | Iterations / revisions included | Surface = UI | The number of design review rounds in scope (a classic creep zone). |
| UXD-06 | Design system | Surface = UI | Net-new vs reuse-client's vs build-one, and who owns it. |
| UXD-07 | Content / UI copy ownership | Surface = UI | Who writes UI text, error messages, notifications, emails. |
| UXD-08 | Accessibility standard | Surface = UI (Required if Regulated/public) | The WCAG level committed to, and what's tested against it. |
| UXD-09 | Localisation / i18n / RTL | Languages ≠ Single | Languages in scope, RTL handling, who supplies translations. |
| UXD-10 | Responsive behaviour | Platforms ∋ Web | Layout rules across breakpoints, stated not assumed. |
| UXD-11 | Browser / device support matrix | Surface = UI | The supported set, and the explicitly unsupported set. |
| UXD-12 | Brand guidelines & constraints | Surface = UI | Source of brand rules and any hard constraints they impose. |
| UXD-13 | Interaction / motion scope | Recommended (UI) | Micro-interactions/animation in scope vs out. |
| UXD-14 | Admin / back-office surfaces | Surface = UI | Which admin / configuration / management screens are in scope vs. assumed — the "obviously there's an admin panel" trap. |
| UXD-15 | Human-review / escalation console | Surface = UI and human-in-the-loop active | The operator surface where staff handle what the AI couldn't, review or override its decisions, see confidence, and optionally feed corrections back — what it does and who uses it. Required for any human-in-the-loop AI product. |

### 3 · Engineering / Architecture — *Owner: Architect / Tech lead*

| ID | Dimension | Applies when | "Covered" means |
|---|---|---|---|
| ENG-01 | Solution overview & context diagram | Always | High-level architecture and how it sits among existing systems. |
| ENG-02 | Component architecture | Always | Major components/services and how they interact end-to-end. |
| ENG-03 | AI vs deterministic boundary | AI ≠ None | The explicit line: what AI may decide vs. what stays rule-based vs. human-confirmed. |
| ENG-04 | Integration specifications | Integrations ≠ None | Per system: direction, protocol/API, auth, rate limits, sandbox availability, who owns the other side. |
| ENG-05 | API contract & versioning | Surface = API/Library, or exposes APIs | The contract definition, ownership, and versioning policy. |
| ENG-06 | Data architecture & dictionary | Always | Core entities, stores, the master field list, and data flow. |
| ENG-07 | Non-functional requirements | Always | Performance, scalability, availability, reliability — as measurable targets. |
| ENG-08 | Technical constraints | Recommended | Mandated stack, platform limits, volume ceilings (capture if any exist). |
| ENG-09 | Build vs buy | Recommended | Where third-party/SaaS is used vs built, with rationale. |
| ENG-10 | Third-party dependencies & licensing | If third-party deps | Each dependency, its license, and any cost/lock-in implications. |
| ENG-11 | Environments & deployment | Always | Environments, deployment model, and release approach. |
| ENG-12 | Known limitations accepted | Recommended | Tech debt / limitations the client accepts up front. |
| ENG-13 | Notifications & messaging | System sends email / SMS / push (Recommended); N-A otherwise, with reason | Channels, triggers, templates, provider, and who owns delivery. |

### 4 · Data / ML — *Owner: Data / ML lead*

| ID | Dimension | Applies when | "Covered" means |
|---|---|---|---|
| DAT-01 | Data sources, access & availability | AI ≠ None, or data-driven | Each source, who owns access, and when it's available (a RAID dependency). |
| DAT-02 | Data quality & cleaning responsibility | Client-supplied data | Quality assumptions and who owns cleaning/remediation. |
| DAT-03 | Data migration scope | Migration = Yes, or Codebase ∈ {Brownfield, Replacement} | What is migrated, what isn't, transformation rules, validation. |
| DAT-04 | Data residency / retention / PII | Data sensitivity ≠ None | Where data lives, how long, and PII handling rules. |
| DAT-05 | Labelling / annotation | Supervised ML / needs labels | Who labels, how much, to what guideline, at what cost. |
| DAT-06 | Golden / eval datasets | AI ≠ None | The dataset(s) accuracy is measured against, and who provides them. |
| DAT-07 | **AI accuracy thresholds** | AI ≠ None | The numeric bar that defines "good enough = done" per task. |
| DAT-08 | **AI evaluation methodology** | AI ≠ None | How accuracy is measured and who agrees the result. |
| DAT-09 | AI failure / low-confidence handling | AI ≠ None | What happens on no-match, low confidence, ambiguous or out-of-distribution input. |
| DAT-10 | Human-in-the-loop boundaries | AI ≠ None | Exactly when AI defers to a human, and for which actions. |
| DAT-11 | Model / vendor & change policy | AI ≠ None | Model/vendor choice and what happens when it changes. |
| DAT-12 | Drift monitoring & retraining | AI ≠ None and Phasing ∋ Evolve | Production accuracy monitoring, alerts, and retraining triggers. |
| DAT-13 | AI running cost / unit economics | AI ≠ None | Expected inference / token cost at projected volume, any cost ceiling, and who bears the ongoing run cost. |
| DAT-14 | Interaction / conversation logging & retention | AI ≠ None and End users ≠ None | What interaction data is captured (transcripts, prompts, model in/out, confidence), where it is stored, the retention period, and how deletion / erasure requests are handled. |
| DAT-15 | Cutover plan & freeze window | Migration = Yes | When the source freezes (and for how long), the cutover sequence, the window it runs in, and who owns the go/no-go decision. |
| DAT-16 | Rollback / abort criteria | Migration = Yes | The conditions under which the migration is aborted, the rollback procedure, and the explicit point-of-no-return. |
| DAT-17 | Migration reconciliation & validation | Migration = Yes | Source-vs-target counts/checksums per entity type, the acceptance threshold for discrepancies, and who signs off the reconciliation. |
| DAT-18 | Parallel-run / dual-write period | Migration = Yes | Whether old and new run together, for how long, with what sync rules — or the explicit big-bang decision with its rationale. |
| DAT-19 | Legacy decommission & retention | Migration = Yes | When the source becomes read-only / retired, and how legacy data is archived or retained (and for how long). |

### 5 · Security / Compliance — *Owner: Security lead*

| ID | Dimension | Applies when | "Covered" means |
|---|---|---|---|
| SEC-01 | AuthN / AuthZ model | End users ≠ None | How users authenticate and what each role may do. |
| SEC-02 | Encryption (transit / at rest) | Data sensitivity ≠ None | Encryption approach for data in transit and at rest. |
| SEC-03 | Tenancy / data isolation | Tenancy = Multi | How tenant data is isolated and access-controlled. |
| SEC-04 | Regulatory obligations & split | Regulated ≠ None | Each obligation and who (vendor vs client) is responsible for it. |
| SEC-05 | Audit trail / logging | Regulated ≠ None, or sensitive | What is logged, retained, and auditable. |
| SEC-06 | PII / PHI handling & consent | Data sensitivity ∈ {PII, PHI} | Handling, minimisation, and consent flows. |
| SEC-07 | Pen-test / security review | Recommended (Required if Regulated) | Scope, who runs it, and when. |
| SEC-08 | Responsible-AI guardrails | AI ≠ None | Restricted actions, prompt-injection/content-safety controls, and the rule that AI never finalises irreversible actions without the human step. |
| SEC-09 | SSO / identity integration | Client identity integration | Which provider, protocol, and provisioning model. |

### 6 · QA / Test — *Owner: QA lead*

| ID | Dimension | Applies when | "Covered" means |
|---|---|---|---|
| QAT-01 | Test strategy & levels | Always | Which test levels apply (unit/integration/E2E/perf/security/UAT). |
| QAT-02 | Test scenarios | Always | Scenarios enumerated and tied to acceptance criteria. |
| QAT-03 | Definition of Done | Always | Testable DoD per story and per phase. |
| QAT-04 | Test data | Always | Who supplies it, its shape, and PII handling. |
| QAT-05 | Test environments | Always | The environments used for each test level. |
| QAT-06 | Defect management | Always | Severity definitions, fix SLAs, and who triages. |
| QAT-07 | UAT | Client UAT in scope | Scope, who runs it, entry/exit criteria, duration, in-UAT fix expectations, sign-off. |
| QAT-08 | Non-functional testing | Per NFRs / UI / Regulated | Load, security, accessibility testing approach as applicable. |
| QAT-09 | AI evaluation testing | AI ≠ None | How accuracy/hallucination/OOD behaviour is tested against the golden set. |
| QAT-10 | Regression scope | Codebase ≠ Greenfield, or phased/repeated releases (Recommended); N-A for one-time runs, with reason | What regression covers and when it runs. |
| QAT-11 | Automation vs manual split | Recommended | What is automated vs manual, and why. |
| QAT-12 | Browser / device test matrix | Surface = UI | The tested set (ties to the UX support matrix). |

### 7 · Ops / Support / SRE — *Owner: DevOps / Support lead*

| ID | Dimension | Applies when | "Covered" means |
|---|---|---|---|
| OPS-01 | Hosting & infra ownership / cost | Post-launch ops ∈ {Vendor, Shared} | Who hosts, who pays, and the infra basis. |
| OPS-02 | Monitoring & alerting | Production deployment | What's monitored, alerting, and who owns it. |
| OPS-03 | Incident response & on-call | Production + ops responsibility | The on-call model and incident process. |
| OPS-04 | Support model post-handover | Post-launch support in scope | Who supports, hours, and SLA. |
| OPS-05 | **Warranty / bug-fix period** | Production or client handover (Required); N-A only for throwaway internal runs, with reason | The free-fix window after launch, its length, and what qualifies (a major creep zone). For a migration: the post-cutover data-fix window. |
| OPS-06 | Maintenance & updates | Ongoing maintenance in scope | What maintenance covers and at what cadence. |
| OPS-07 | Backup / DR | Production + data | Backup and disaster-recovery approach and ownership. |
| OPS-08 | Handover & knowledge transfer | Post-launch ops ∈ {Client, Shared} | What's handed over and how knowledge transfers. |
| OPS-09 | Documentation deliverables | Always | Which docs are delivered: technical / user / admin / runbook. |

### 8 · Change Management / Adoption — *Owner: Delivery lead*

> Resolves to **N-A** when End users ∈ {None, Developers}. Otherwise **Recommended**, escalating to **Required** when the product changes existing human workflows.

| ID | Dimension | Applies when | "Covered" means |
|---|---|---|---|
| CHG-01 | Training scope | Staff adoption needed | Sessions, materials, audience, and who delivers. |
| CHG-02 | Adoption support | Workflow-changing | Post-launch adoption support in scope vs out. |
| CHG-03 | Process / org change ownership | New workflows imposed | Who owns the business-process change (client vs vendor). |
| CHG-04 | Communications plan | Recommended | Stakeholder comms for rollout. |

### 9 · Commercial / Governance — *Owner: Engagement lead + Commercial*

| ID | Dimension | Applies when | "Covered" means |
|---|---|---|---|
| COM-01 | Commercial model linkage | Always | Which modules are fixed-bid vs T&M, and why. |
| COM-02 | Change-control process | Always | The defined process by which any post-approval change to requirements, integrations, rules, or assumptions is handled (the creep firewall). |
| COM-03 | IP ownership | Always | Who owns the delivered code, designs, and data. |
| COM-04 | Acceptance & payment linkage | Milestone-based | How acceptance ties to payment milestones. |
| COM-05 | Assumptions gating the price | Commercial = Fixed-bid/Hybrid | The assumptions under which the fixed price is valid (RAID). |
| COM-06 | Internal review gate (PSRC) | Always | The internal approval of solution fit, scope completeness, feasibility, effort, ROI before proceeding. |
| COM-07 | Client sign-off & exclusions ack | Always | The client signs the baseline *and* explicitly acknowledges what's excluded/deferred/T&M. |

### 10 · Delivery / Planning — *Owner: Delivery lead*

| ID | Dimension | Applies when | "Covered" means |
|---|---|---|---|
| DEL-01 | Phase breakdown | Phasing = Full/Partial | The engagement structured across phases with each phase's goal. |
| DEL-02 | Module-to-phase mapping | Phasing = Full/Partial | Which modules land in which phase, and why. |
| DEL-03 | Milestones & deliverables | Always | Concrete deliverables and decision points. |
| DEL-04 | Sequencing & dependencies | Always | Build order and the dependencies that constrain it. |
| DEL-05 | Timeline view | Always | Indicative schedule, caveated by RAID assumptions. |
| DEL-06 | Resource & cost plan | Recommended | Team shape, roles, effort per phase. |
| DEL-07 | Communication / governance cadence | Always | Status, escalation, and decision cadence and channels. |
| DEL-08 | Entry / exit criteria per phase | Phasing = Full/Partial | What must be true to start and to close each phase. |

### Cross-cutting · RAID — *Owner: Engagement lead*

RAID is not a discipline but the **home** for several dimensions above. Its four item-types carry stable IDs so the skills can reference them like any catalog dimension:

| ID | Item type | What it holds |
|---|---|---|
| RAID-A | Assumptions | Every assumption (Law 4), each with its impact-if-wrong. |
| RAID-D | Dependencies | Every dependency — data access, credentials, client availability — with an owner and a by-when. |
| RAID-R | Risks | Every risk, with likelihood / impact / mitigation / owner. |
| RAID-Q | Open questions | Every open question (Law 5), each tagged: must-close-before-estimate / proceed-with-assumption / too-uncertain→T&M / future-phase. |

RAID is the living record that keeps the rest honest.

---

## Part E — How the Skills Consume This

- **`map`** sets the profile, resolves every dimension to Required / Conditional / Recommended / N-A, and scores each active dimension Covered / Partial / Gap with evidence and provenance. It owns the **instance inventory** (`.keel/instance-inventory.md`, dimension `SCO-09`) — one row per named instance per class, minted from the evidence — and the **questions ledger** (`.keel/questions.md`, `RAID-Q`) — one row per question, the machine-readable twin of the prose register that the gate and the dashboards count blockers from. Before minting questions it **researches** (Law 14): every Required Gap/Partial and every unspecified named instance is decomposed and researched on the web — default yes, skip needs a one-line reason — producing **research briefs** (`discovery/research/`) so questions go out **instance-level, with example answers**, never as the dimension's generic template. After scoring the catalog it **runs the discovery lenses** (defined below) and mints each project-specific decided-area as a **`PRJ-*` dimension** into `.keel/project-dimensions.md` — each with a testable *"Covered means"* and an assigned Part F home — then scores, researches, and dispositions them exactly like catalog dimensions. Output: the **Coverage Map** + the **project-dimensions registry** (`PRJ-*`) + inventory + briefs + sharpened open questions.
- **`clarify`** turns every Required-or-Recommended Gap/Partial into a discovery action or a disposition (Law 5), looping until no Required dimension is open. It opens with a **discipline filter** — the person answering chooses which discipline(s) they are clarifying (by dimension-ID prefix); unselected questions remain open and blocking for their proper owner, never dispositioned by omission. A vague answer is recorded **and sharpened in the same round** (the follow-up quotes the answer and names the deficiency, superseding the original). When an answer names something the corpus can't ground, it researches it (Law 14) before pressing on. Closed-world questions (`SCO-09`) resolve to confirmation-with-provenance or a disposition.
- **`generate`** renders the six documents **against Part F's section structure**, writing only dimensions that are Required/Recommended-and-covered into their mapped sections, validates cross-document consistency, and carries traceability through (Law 6). The pack it writes is **self-contained** (Law 12) — every rule spelled out in full, external citations only as `Source:` suffixes. It emits the machine-readable **`SCO-08` scenario ledger** (`.keel/scenario-coverage.md`) and reconciles the **`SCO-09` instance inventory** — every specified instance rendered by name into its host dimension's section, every excluded instance acknowledged — both of which `check_generate` enforces deterministically (Laws 11–13).
- **`review`** enforces the Doctrine (Part A) adversarially — weasel words, untestable criteria, silent exclusions, unsurfaced conflicts, external-citation bodies (Law 12), unenumerated plurals (Law 13) — and blocks freeze on any high-severity violation. It performs **decision reconciliation**: every decision-log entry is located in the rendered pack and checked for drift (a number, enumeration, or disposition that changed in rendering is a factual slip, High). Its findings are **fed back into the open-questions register** (tagged `raised-by: keel-review`); a finding that tightens an existing question **supersedes** it (`supersedes:` / `superseded-by:`) so the vague original leaves the active set — there is exactly one disposition path, never a parallel one. It additionally runs an **adversarial gap-hunt** — walking the discovery lenses (below) against the rendered pack to surface a decision area that *no* dimension (catalog or `PRJ-*`) covers. Such a finding is **High / freeze-blocking only when it gates acceptance, price, or scope**; otherwise it is a tracked, non-blocking open question. It is represented as **`PRJ-GEN-*`** and fed back through the same register / supersession path.

### The discovery lenses (Law 15)

A fixed, domain-agnostic set `map` runs over every project's evidence + profile to *derive* its `PRJ-*` dimensions. Each lens asks a generative question; where it names a real decided-area no catalog dimension already resolves, `map` mints a `PRJ-*` with a testable *"Covered means"* bar. None names a domain — they are a reusable taxonomy of *where silence hides*.

- **L1 · Data lifecycle & semantics** — for every data object read / written / moved: is its full lifecycle decided — origin, field meaning, **relationships / associations** between objects, **free-text vs structured** handling, **dedup / merge against the target's existing data**, retention / end-of-life?
- **L2 · Responsibility & liability boundary** — for each business outcome, who is at fault when it fails, and is the line drawn between *system* failure and *business-process* failure? (fires when Commercial ∈ {Fixed-bid, Hybrid})
- **L3 · Failure tail / unhandled exception** — beyond the happy path and the *named* exceptions, what is the decided default for the inputs nobody scoped (reject / queue / manual / degrade)? (the tail SCO-08 does not reach: SCO-08 scores the scenarios that were named; L3 hunts the ones that were not)
- **L4 · Actor & handoff non-action** — at each handoff between actors, what happens when the receiving actor does *not* act — no decision, no SLA, no escalation?
- **L5 · Integration data-correctness ownership** — beyond protocol / auth (`ENG-04`), who owns the *correctness* of data crossing each boundary, and the remedy when the other side sends wrong or stale data?
- **L6 · Temporal / peak / cutover** — are the time-shaped requirements decided — peak windows, periodic cycles, data-freshness tolerances, any transition / cutover moment?
- **L7 · Domain-rule via research** — for each domain rule / standard / regime the evidence *names* but the catalog cannot resolve generically, has it been researched (Law 14) into an enumerated, sourced rule?

A lens that fires on an area a catalog dimension already covers mints nothing (that is a catalog Gap, not a new area). The operational procedure — how `map` runs the lenses, writes `.keel/project-dimensions.md`, and routes each `PRJ-*` to its Part F home — lives in the `keel-map` skill.

---

## Part F — The Pack Structure

The deliverable is **six documents**. Parts B–D define *what must be decided* (the completeness catalog); Part F defines *where each decision is written* (the rendering target). `generate` renders the resolved engagement into exactly these six documents, with these sections, in this order — it does not invent a structure per run. The dimensions of Part D map into the sections below; every Covered dimension lands in a section, and every section is populated from covered dimensions + the decision log (never invented).

Each table is **ID · Key section · What it should cover · Owner · Renders from**. Every section carries a stable **`F{doc}.{n}` ID** (e.g. `F2.11`) and a **Renders from** column listing the Part D / RAID dimension IDs whose resolved content fills it. That column **is the crosswalk** — the machine-checkable join between the completeness catalog (Part D) and the document target (Part F). Read forward (dimension → section) it tells `generate` where to write each Covered dimension; read backward (section → dimensions) it lets `review` join related facts across documents — e.g. the AI accuracy bar `DAT-07` appears in both `F2.11` (Scope acceptance) and `F3.3` (AI/ML), and they must agree. Add document-specific sections as an engagement needs them, but never drop a listed one silently (Law 1 applies to the pack's own structure: a missing section is an exclusion that must be deliberate). "Owner" is the role accountable for that section's content.

### Doc 1 · Executive Summary / Engagement Brief
*Owner: Engagement lead. The orientation document — often the only one a sponsor reads end-to-end. Keep it short and decision-oriented.*

| ID | Key section | What it should cover | Owner | Renders from |
|---|---|---|---|---|
| F1.1 | Engagement context & business driver | Why this engagement exists; the business problem or opportunity in the client's terms; the trigger for acting now. | Engagement lead | PRD-01 |
| F1.2 | Current-state summary | One-paragraph synthesis of how things work today and the cost of the status quo (time, error, risk). Detail lives in the Scope Document. | Engagement lead | PRD-01, SCO-02 |
| F1.3 | Future-state vision | The target AI-native outcome in plain language; what changes for the business and its users. | Engagement lead | PRD-04, ENG-01 |
| F1.4 | Recommended approach | The proposed path, including the commercial/shared-risk model and the Learn → Proof → Ship → Evolve framing. | Engagement lead | COM-01, DEL-01 |
| F1.5 | Scope at a glance | The modules in play and any headline exclusions, summarised. Points to the Scope Document for detail. | Engagement lead | SCO-01, SCO-02, SCO-04 |
| F1.6 | Commercial model note | How the engagement is priced at a high level (fixed-bid where ready, T&M where not). No numbers if the proposal is separate. | Engagement + Commercial | COM-01 |
| F1.7 | Key risks & assumptions (headline) | The 3–5 things that most affect feasibility, cost, or timeline. Full list lives in the RAID Register. | Engagement lead | RAID-R, RAID-A, COM-05 |
| F1.8 | Decision requested | Exactly what the client is being asked to approve at this milestone, and what unlocks next. | Engagement lead | COM-06, COM-07 |

### Doc 2 · Scope Document (including Requirements)
*Owner: BA / Engagement lead. The heart of the pack and the thing that gets frozen. Requirements here are at module / capability level — the detailed SRS comes later in build.*

| ID | Key section | What it should cover | Owner | Renders from |
|---|---|---|---|---|
| F2.1 | Scope statement | A clear sentence defining the boundary of what is being delivered; sets the frame for everything below. | BA / Engagement lead | SCO-01 |
| F2.2 | Module breakdown | The business decomposed into modules (e.g. Intake, Processing, Validation, Approval, System Updates, Exception Handling, Reporting, Admin, Integrations). Each gets its own sign-off. | BA / Engagement lead | SCO-02 |
| F2.3 | Per-module: Current state | How the process works today — actors, triggers, inputs/outputs, systems, manual steps, pain points, known exceptions. Carries the module's **happy-path scenario** — a real worked example traced to a source artifact, or its explicit disposition (Law 11). | BA | PRD-04, SCO-08 |
| F2.4 | Per-module: Future state | How the AI-enabled process will work — AI role, software automation role, human approval points, exception flow, system updates, audit trail. | BA | ENG-03, DAT-10 |
| F2.5 | Per-module: In scope / Out of scope | Functional capabilities, document/data types, workflows and integrations included; and explicitly what is excluded, deferred, or unconfirmed. | BA / Engagement lead | SCO-03, SCO-09 |
| F2.6 | Per-module: Functional requirements | Capability-level requirements (what the module must do), each prioritised. Detailed, testable specs are deferred to the SRS. | BA | PRD-04, SCO-07 |
| F2.7 | Per-module: Business rules | Approval rules, matching rules, validation rules, escalation rules — **each named rule spelled out in full** (Laws 12–13), never summarized in the plural or deferred to the source document. | BA | ENG-03, SCO-09 |
| F2.8 | Per-module: Exceptions | Missing data, duplicates, API failures, low AI confidence, mismatches, delayed approvals — and how each is handled. Carries the module's **exception and edge-case scenarios** — each a real worked example traced to a source artifact, or an explicit disposition (out / N-A-with-reason / assumption) so no class is left in silence (Law 11). | BA | DAT-09, SCO-08 |
| F2.9 | Per-module: Data fields | Key inputs/outputs and the fields the module reads or writes. | BA / Architect | ENG-06 |
| F2.10 | Per-module: Integrations | Systems the module touches and the direction of data flow — every named system listed individually (Law 13). | BA / Architect | ENG-04, SCO-09 |
| F2.11 | Per-module: Acceptance criteria | What must be true for the module to be considered complete and acceptable. | BA / Engagement lead | SCO-05, DAT-07 |
| F2.12 | AI vs deterministic responsibility split | Explicit dividing line: what AI may decide (probabilistic), what stays deterministic (rule-based), where a human must confirm. Governs every module. | Architect / BA | ENG-03, DAT-10 |
| F2.13 | User roles & permissions | The user classes and what each can do — every named role listed individually (Law 13). | BA | PRD-03, SEC-01, SCO-09 |
| F2.14 | Global out-of-scope | Cross-cutting exclusions that apply beyond a single module. | Engagement lead | SCO-04, PRD-05 |
| F2.15 | Assumptions reference | Pointer to the RAID Register; assumptions are owned there, not duplicated here. | Engagement lead | RAID-A |
| F2.16 | Glossary of terms | Every domain/ambiguous term defined once and used consistently across the pack. | BA / Engagement lead | SCO-06 |
| F2.17 | Success metrics | The North Star plus guardrail metrics, each measurable with a target — what "working" means for the business. | Product / Engagement lead | PRD-02 |
| F2.18 | Reporting & analytics scope | Which reports, dashboards, and exports are in scope (each named) and which are explicitly not. | BA | PRD-09, SCO-09 |
| F2.19 | UX — platforms, responsive & browser matrix | Exact platforms/breakpoints in scope and excluded; responsive rules; the supported/unsupported browser-device set. | Design lead | UXD-01, UXD-10, UXD-11 |
| F2.20 | UX — screen/flow inventory & state coverage | Every screen and flow listed; per flow the full state set (default, loading, empty, error, partial, success, permission-denied, zero-data, overflow). | Design lead | UXD-02, UXD-03 |
| F2.21 | UX — design fidelity, system, revisions & brand | Fidelity/deliverable per screen; design-system source & ownership; the number of revision rounds in scope; brand constraints; motion scope. | Design lead | UXD-04, UXD-05, UXD-06, UXD-12, UXD-13 |
| F2.22 | UX — content, accessibility & i18n | Who owns UI copy/errors/notifications; the committed WCAG level and what's tested; languages, RTL, and who supplies translations. | Design lead | UXD-07, UXD-08, UXD-09 |
| F2.23 | UX — admin & human-review surfaces | Which admin/configuration screens are in scope; the operator/human-review console for AI escalation, override, and confidence. | Design lead | UXD-14, UXD-15 |
| F2.24 | Project-specific scope areas | The catch-all home for any `PRJ-*` dimension (Law 15) the engagement's routing does not map onto a reused section — each rendered as its `PRJ-*` content, by name, spelled out in full (Law 12). Present-if-used: omitted with a one-line reason when no `PRJ-*` routes here. | BA / Engagement lead | (`PRJ-*` — see `.keel/project-dimensions.md`) |

> Sections F2.3–F2.11 are a **per-module block, repeated for each module** in the breakdown. F2.1–F2.2 and F2.12–F2.24 are document-global. *(F2.16–F2.23 were added by the stable-ID crosswalk pass to give Glossary, Success metrics, Reporting, and the whole UX/Design discipline a rendering home — see Part G. UX sections are N-A and omitted when Discipline 2 resolves N-A. F2.24 is the catch-all home for `PRJ-*` project-specific dimensions (Law 15); like the UX sections it is present-if-used — omitted with a one-line reason when no `PRJ-*` routes there.)*

### Doc 3 · Technical Architecture & Solution Design
*Owner: Architect / Tech lead. Answers HOW the solution works. Confirms technical feasibility behind the scope.*

| ID | Key section | What it should cover | Owner | Renders from |
|---|---|---|---|---|
| F3.1 | Solution overview & context diagram | High-level architecture and how the system sits among the client's existing systems; end-to-end flow across modules. | Architect | ENG-01 |
| F3.2 | Component architecture | The major components/services and how they interact; the sequence of a representative end-to-end transaction. | Architect | ENG-02 |
| F3.3 | AI / ML approach | Capability types (extraction, classification, summarisation, generation, retrieval), model/service choices, hosting, and the data-flow boundary. | Architect / ML lead | ENG-03, DAT-05, DAT-06, DAT-07, DAT-08, DAT-11, DAT-13 |
| F3.4 | Deterministic logic boundary | What is implemented as deterministic, testable software vs handed to AI; confidence thresholds and human-in-the-loop points. | Architect | ENG-03, DAT-09, DAT-10 |
| F3.5 | Data architecture & dictionary | Core entities, data stores, the master field list/schema, and how data moves through the system. | Architect / Data | ENG-06, DAT-01, DAT-02, DAT-03, DAT-14 |
| F3.6 | Integration specifications | Each external system: direction (read/write), protocol/API, authentication, rate limits and known constraints — one entry per named system (Law 13). (Break into its own doc only if integration is the dominant risk.) | Architect | ENG-04, ENG-05, ENG-13, SCO-09 |
| F3.7 | Non-functional requirements (NFRs) | Measurable targets for performance, scalability, availability, reliability, usability/accessibility — not adjectives. | Architect | ENG-07, PRD-07 |
| F3.8 | Security & compliance | AuthN/AuthZ, encryption in transit/at rest, SSO, PII handling, data residency, retention, audit trail, regulatory obligations. | Architect / Security | SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-09, DAT-04 |
| F3.9 | Environments & deployment | Deployment model (cloud/region/on-prem/hybrid), environments, and release approach. | Architect / DevOps | ENG-11, OPS-01, OPS-07 |
| F3.10 | Technical constraints | Mandated technologies, platform limits, volume ceilings, or client-imposed constraints that shape the design. | Architect | ENG-08, ENG-09, ENG-10, ENG-12 |
| F3.11 | Responsible AI & guardrails | Restricted actions, redaction, content-safety / prompt-injection controls, and the rule that AI never finalises irreversible actions without the defined human step. | Architect / ML lead | SEC-08, DAT-10 |
| F3.12 | Monitoring & drift (Evolve) | Production accuracy monitoring, alerting on degradation, retraining triggers. | Architect / ML lead | DAT-12, OPS-02, OPS-03 |

### Doc 4 · RAID Register — Risks, Assumptions, Issues, Dependencies
*Owner: Engagement lead. The living document most teams skip and most regret. These are the conditions under which the fixed price is valid.*

| ID | Key section | What it should cover | Owner | Renders from |
|---|---|---|---|---|
| F4.1 | Assumptions | Each assumption the estimate relies on, with impact-if-wrong. E.g. accuracy expectations, sample-data availability, third-party limitations. Failing assumptions trigger change control. | Engagement lead | RAID-A, COM-05 |
| F4.2 | Dependencies | What the vendor needs from the client or third parties and by when: system/credential access, API availability, sample data, stakeholder availability for clarifications and UAT. | Engagement lead | RAID-D, DAT-01, PRD-08 |
| F4.3 | Risks | Things that may go wrong, with likelihood, impact, mitigation, and owner. Includes technical, data, integration, and delivery risks. | Engagement lead | RAID-R |
| F4.4 | Open questions | Unresolved items, each classified using the classification scheme below. Drives whether a module can be estimated. | Engagement lead | RAID-Q |
| F4.5 | Open-question classification | Apply one per question: Must-close-before-estimate · Proceed-with-assumption · Minor-implementation-detail · Too-uncertain (exclude / T&M) · Future-phase. | Engagement lead | RAID-Q |
| F4.6 | Resolution log / status | Tracks each item to closure: status, owner, date needed, date resolved. Keeps the register live rather than a one-time snapshot. | Engagement lead | RAID-Q |

### Doc 5 · Implementation Plan & Phasing
*Owner: Delivery lead. Sequences the approved scope across the Learn / Proof / Ship / Evolve model.*

| ID | Key section | What it should cover | Owner | Renders from |
|---|---|---|---|---|
| F5.1 | Phase breakdown | The engagement structured as Learn → Proof → Ship → Evolve, with the goal of each phase. | Delivery lead | DEL-01, PRD-06 |
| F5.2 | Module-to-phase mapping | Which modules land in which phase, and why (value, risk, dependency order). | Delivery lead | DEL-02 |
| F5.3 | Milestones & deliverables | Concrete deliverables and decision points per phase. | Delivery lead | DEL-03 |
| F5.4 | Sequencing & dependencies | Build order and the inter-module/technical dependencies that constrain it. | Delivery lead / Architect | DEL-04 |
| F5.5 | Timeline view | Indicative schedule across phases; durations and key dates (caveated by RAID assumptions). | Delivery lead | DEL-05 |
| F5.6 | Resource & cost plan | Team shape, roles, and effort per phase, with the cost basis. Feeds the PSRC 'Effort & Timeline' review lens. | Delivery lead | DEL-06 |
| F5.7 | Communication plan | Cadence, channels, and stakeholders for status, escalation, and decisions across the engagement. | Delivery lead | DEL-07, CHG-04 |
| F5.8 | Quality & acceptance plan | How quality is assured and how acceptance is demonstrated per phase; ties to module acceptance criteria, UAT sign-off, and the payment milestones. | Delivery lead / QA | QAT-01, QAT-02, QAT-03, QAT-04, QAT-05, QAT-06, QAT-07, QAT-08, QAT-09, QAT-10, QAT-11, QAT-12, SCO-05, COM-04 |
| F5.9 | Entry / exit criteria per phase | What must be true to start and to close each phase — ties phases to acceptance. | Delivery lead | DEL-08 |
| F5.10 | Support, warranty & maintenance | The post-launch support model (who, hours, SLA), the warranty/bug-fix window (length + what qualifies), and ongoing maintenance scope and cadence. | Delivery lead / Ops | OPS-04, OPS-05, OPS-06 |
| F5.11 | Handover, documentation & adoption | What is handed over and how knowledge transfers; the documentation deliverables; training, adoption support, and who owns the business-process change. | Delivery lead | OPS-08, OPS-09, CHG-01, CHG-02, CHG-03 |
| F5.12 | Migration cutover & rollback | The cutover plan and freeze window, rollback/abort criteria and point-of-no-return, reconciliation/validation thresholds and sign-off, parallel-run or big-bang decision, and legacy decommission/retention. Omitted (with its dimensions N-A) when Migration = No. | Delivery lead / Data | DAT-15, DAT-16, DAT-17, DAT-18, DAT-19 |

> F5.10–F5.11 were added by the stable-ID crosswalk pass to home the Ops (support/warranty/maintenance/handover/docs) and Change (training/adoption/process-ownership) dimensions, which had no rendering target in the original six docs — see Part G.

### Doc 6 · Approval / Sign-off Page
*Owner: Client signatories + internal PSRC. Two gates: the PSRC (internal) approves the solution & scope to proceed, and the client signs off.*

| ID | Key section | What it should cover | Owner | Renders from |
|---|---|---|---|---|
| F6.1 | Scope-freeze statement | States that the documented modules, workflows, assumptions, integrations, business rules, exceptions, exclusions, and acceptance criteria are approved as the baseline for a fixed-bid proposal. | Engagement lead | COM-07 |
| F6.2 | What is being approved | Explicit list of what the signature covers (the contents of the pack as a baseline). | Engagement lead | SCO-01, SCO-02, COM-04 |
| F6.3 | Exclusions acknowledgement | Client acknowledges what is out of scope, deferred, or T&M-recommended, so nothing is assumed included by silence. | Engagement lead | SCO-04, PRD-05, COM-07 |
| F6.4 | Internal PSRC review & approval | The Project Solution Review Committee reviews scope & solution for Solution Fit, Scope Completeness, Architecture Soundness, Risk & Feasibility, Effort & Timeline, Value & ROI, and Client Impact. PSRC approval is the internal gate that authorises proceeding (Approve to Proceed → Execution Starts). | PSRC / Head of Command Center | COM-06 |
| F6.5 | Change-control note | Any new requirement, workflow, integration, report, rule, exception, data variation, third-party limitation, or changed assumption after approval may affect cost, timeline, and approach, and is handled via change control. | Engagement lead | COM-02 |
| F6.6 | Signatory table | Names, roles, organisations, signatures, and dates for the client and vendor approvers. Records both the internal PSRC approval and the client sign-off. | Client + Vendor | COM-03, COM-07 |

> **File mapping.** `generate` writes these as six files in `deliverables/`: `1-executive-summary.md`, `2-scope.md`, `3-technical-architecture.md`, `4-raid.md`, `5-implementation-plan.md`, `6-approval-and-signoff.md`. The RAID Register (Doc 4) is the home for every assumption, dependency, risk, and open question referenced from the other five — they point to it, not duplicate it (`F2.15` is the canonical example).

---

## Part G — The Crosswalk: Coverage Guarantee & Joins

The **Renders from** columns in Part F, taken together, are the canonical **dimension ↔ section crosswalk**. It is maintained in one place (Part F) and read two ways:

- **Forward (dimension → section), used by `generate`:** every Part D dimension scored **Covered** must be written into *at least one* Part F section that lists its ID. Inverting the Renders-from columns gives, for any dimension, its target section(s). `generate` places covered content there and nowhere else.
- **Backward (section → dimensions), used by `review`:** a section's listed dimension IDs are the facts that must actually appear in it, and IDs that appear in **more than one** section are cross-document **joins that must agree** — the critical ones:
  - `DAT-07` (AI accuracy bar) → `F2.11` (acceptance) **and** `F3.3` (AI/ML): the "done" bar must be identical in both.
  - `SCO-04` (global exclusions) → `F1.5`, `F2.14`, **and** `F6.3`: every exclusion stated in scope must be acknowledged at sign-off.
  - `COM-07` (sign-off & exclusions ack) → `F6.1`, `F6.3`, `F6.6`.
  - `ENG-03` (AI-vs-deterministic boundary) → `F2.4`, `F2.7`, `F2.12`, `F3.3`, `F3.4`.
  - `SCO-08` (scenario coverage) → `F2.3` (happy-path) **and** `F2.8` (exception + edge): each scenario class appears in its section as either a real worked example or an explicit disposition, split across the two — so a module is scenario-complete only when no class is left in silence, and `review` joins them to confirm the same workflow is the one being evidenced.
  - `SCO-09` (instance inventory) → `F2.5`, `F2.7`, `F2.10`, `F2.13`, `F2.18`, `F3.6`: every **specified** instance in `.keel/instance-inventory.md` appears **by name** in at least one target section of its host dimension, and every **excluded** instance is acknowledged in the exclusions and rolls up to `F6.3` — `check_generate` reconciles the ledger against the rendered prose deterministically (Law 13).

**Coverage guarantee (the rule that makes this airtight):** every Part D dimension resolves to **≥1** Part F section. A dimension that is **Required (or Recommended-included) and Covered but has no Part F home is itself a freeze blocker** — silence in the *structure* is the same defect as silence in the *scope* (Law 1). The crosswalk pass that introduced stable IDs also surfaced and closed the original homeless dimensions by adding sections `F2.16–F2.23` (Glossary, Success metrics, Reporting, and the UX/Design block) and `F5.10–F5.11` (Support/warranty/maintenance, Handover/docs/adoption). If a future profile activates a dimension with no section, `map` flags it and a section must be added before freeze — never rendered into silence. The same guarantee extends to **`PRJ-*` dimensions** (Law 15): every Covered `PRJ-*` must resolve to **≥1** Part F home — a reused section named in its `.keel/project-dimensions.md` *Renders into* column, or the catch-all `F2.24` — and a homeless Covered `PRJ-*` is a freeze blocker exactly like a homeless catalog dimension. Because `PRJ-*` live in engagement state, this join is resolved from the registry, not from this file's Renders-from columns.

*Version: v1.5 (draft for review). v1.1 added Part F (Pack Structure); v1.2 adds stable dimension/section IDs and Part G (the crosswalk + coverage guarantee); v1.3 adds Law 11 (no scenario passes in silence) and dimension `SCO-08`, homed in `F2.3`/`F2.8`. v1.4 adds Laws 12–14 (self-contained pack · instance enumeration · when-in-doubt-research), dimension `SCO-09` + the instance inventory ledger, the `RAID-Q` questions ledger (`.keel/questions.md` — the machine-readable register the gate and dashboards count from), the migration dimensions `DAT-15`–`DAT-19` homed in `F5.12`, the per-instance and reason-quality scoring rules and Resolved-progress accounting (Part B), the applicability re-keying of the over-broad Always/Recommended rows, and the research, discipline-filter, decision-reconciliation, and supersession duties in Part E. v1.5 adds **Law 15** (discovery lenses → project-specific `PRJ-*` dimensions), the lens set and the `map` / `review` lens duties in Part E, the catch-all section `F2.24`, the Part G coverage guarantee for `PRJ-*`, and the adversarial gap-hunt (`PRJ-GEN-*`) in `review` — so per-project completeness becomes generative without growing the fixed catalog (`PRJ-*` live in `.keel/project-dimensions.md`, never here). Every change to this file is itself change-controlled — it is the standard the whole system trusts.*
