# Keel Document Design System — Editorial

*The visual standard for rendered deliverables. Goal: documents that read as **hand-crafted editorial design**, not generic Word output. `enrichment-spec.md` says what each document contains; this says how it looks. Reference qualities (from the design samples): generous whitespace · strong type hierarchy · restrained palette + soft tints · tinted paper · mono for data/labels · callout/stat cards · thin rules · eyebrow labels · captions below figures.*

*Version: v0.1 (draft for review).*

---

## 0. The pivotal decision — render target

The editorial effects this system needs — **a tinted paper background, a full-page cover graphic, mono tables with a dark header + white text, callout/stat cards, precise columns and spacing** — are clean in **HTML/CSS → PDF** or **Typst**, and fragile-to-impossible in pandoc-`.docx` (the white-on-dark table header already failed to render; a tinted paper background doesn't print reliably from Word).

**Recommendation:** the polished client deliverable is a **PDF rendered from HTML/CSS** (the medium of UI/UX work, and it matches the team's React/CSS stack); the **`.docx` stays as an editable secondary** (clean, but not magazine-grade). Content edits happen **upstream in the markdown** then re-render — so editability is preserved (markdown is easy; the render is automated) while the PDF actually hits the bar.

> **Decision (chosen): B — `.docx` only, pushed as far as Word allows.** The effects marked ⚑ (tinted paper, stat cards) become approximations within Word's limits — the type specimen validates how far each one actually goes. Edits stay upstream in markdown; the render is automated, so there is no manual conversion.

---

## 1. Brand assets (from the original — now in `assets/branding/`)

| Asset | File | Use |
|---|---|---|
| Header band | `techjays-header-trimmed.png` | logo + gradient rule, padding trimmed so the logo sits flush to the left margin |
| Cover hero | `techjays-cover.jpg` | full-page cover background (light-blue field + isometric motifs, navy base) |
| Logo mark | `techjays-logo.png` | standalone mark where needed |

## 2. Typography (proposed — confirm)

| Role | Family | Notes |
|---|---|---|
| Display / titles / section numbers | **Oranienbaum** | cover title, big headings |
| Body | **Roboto** | editorial body |
| Data · tables · labels · captions · code | **IBM Plex Mono** | the "mono data" look |

All **embedded** — **chosen: Set B**. *Alternates considered:* Bricolage Grotesque (display) · Newsreader (body). Type scale (docx): Display ~32 · H1 22 · H2 15 · H3 12 · Body 10.5/1.5 · Caption & label 8.5 mono (tracked +2%). **Hierarchy by size + family, not weight** (max semibold).

## 3. Color

| Token | Value | Use |
|---|---|---|
| Paper | `#FBF9F4` (warm off-white) | page tint ⚑ |
| Ink (headings) | `#1C1C1E` | headings, section titles, table data |
| Body ink | `#34343A` | body prose (softened) |
| Ink-muted | `#5A5A5E` | captions, labels, footer |
| Brand purple | `#454BC4` | section numbers, links, rules |
| Periwinkle accent | `#6872FF` | gradient rule, sparing accents |
| Card / zebra grey | `#F2EEE4` | stat/callout cards, table alt-rows |
| Highlight cell | `#ECECFB` (lavender) | one emphasized table cell |
| Table header | `#15171A` (near-black) | header fill, **white mono text** |
| Hairline | `#E6E1D6` | rules, table borders |

Restraint: **one accent + tints**. The cover's navy lives on the cover only.

## 4. Spacing

4pt base. Generous editorial margins. **Space after every block** — paragraph 8pt; **after tables and figures 16–20pt** (fixes the no-space-after-table issue); section breaks larger. Consistent baseline rhythm.

## 5. Components

- **Cover (full page):** `techjays-cover.jpg` background · eyebrow label (doc type, mono) · large Bricolage title · project · version · date · logo. No status line.
- **Running header:** the `techjays-header.png` band. **Footer:** page number + doc title on a hairline.
- **Section header:** large mono number (`01`, `02`…) + Bricolage title + hairline; sub-sections nest (`1.1`, `1.2`).
- **Tables:** IBM Plex Mono; **dark `#15171A` header row with white text**; subtle zebra/tinted alt rows; generous cell padding; **space after**; highlight cells in lavender; right-aligned numerics.
- **Figures:** sit on a faint tinted panel; **caption BELOW only** — `Figure N — <caption>` (mono, muted) + a `View larger` link; **no title above the image**.
- **Callout / stat cards:** lavender tinted boxes for key numbers (acceptance bars, NFR targets, success metrics) and highlights — the "stat card" from your samples. ⚑
- **Notes / proposed marker:** discreet inline `*(proposed; subject to change)*`; longer notes as a thin left-rule callout.
- **Cross-doc pointer:** a styled callout — e.g. *"Functional requirements are specified in the Scope Document (§X); summarized here."*

## 6. Content depth (point 3)

- **Drill into named sub-sections** within each major section (the reference's `3.2.1–3.2.6` model) — not one flat block per section.
- **Functional-scope summary in the Technical Architecture doc:** the detailed FRs live in the Scope Document, so Tech Arch carries a short **Functional scope** section that states the capabilities at a glance and **points to the Scope doc** — the architecture doc shouldn't read as if the "what" is missing.
- Tables and cards carry the detail; prose explains the why; every figure earns its place.

## 7. Diagram styling

Theme diagrams to the palette — **IBM Plex Mono labels**, brand-purple accents, hairline edges, on the paper tint; **caption below**; decompose to ≤~15 nodes (overview + drill-downs).
