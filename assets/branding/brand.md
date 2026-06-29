# techjays Brand Tokens & Pandoc Rendering

Brand assets for rendering Keel's enriched markdown deliverables to a branded
Word `.docx` via Pandoc's `--reference-doc`, plus the tokens `render.py` needs to
assemble the designed cover and the table/card post-processing.

**Approved look: Set B editorial** (per `design-system.md` §2/§3). The pipeline
reference doc `techjays-reference.docx` carries this as Word styles + embedded
fonts + document properties. The dark table header, zebra rows, and stat cards
are applied by **`render.py`'s post-process**, not by the reference styles.

---

## Color palette (hex)

| Token | Hex | Use |
|-------|-----|-----|
| Paper | `#FBF9F4` | page tint (`w:background`, screen-only — prints white) |
| Ink | `#1C1C1E` | headings, Title, Subtitle |
| Body | `#34343A` | body text (softened, not pure black) |
| Ink-muted | `#5A5A5E` | captions, labels, footer, H5/H6, secondary |
| Brand purple | `#454BC4` | section numbers, links, accents |
| Periwinkle accent | `#6872FF` | blockquote rule, sparing accents (not text-on-white) |
| Card / highlight | `#F2EEE4` | stat-card + table-row grey (applied by render.py) |
| Table header | `#15171A` | dark header fill + **white text** (applied by render.py) |
| Hairline | `#E6E1D6` | table borders, rules |

`#F2EEE4` is the single grey shared by table zebra rows and stat cards (the
lavender `#ECECFB` was dropped from cards; it remains only as an optional
highlight-cell tint if render.py wants one).

---

## Typography — all embedded

| Role | Family | Used by styles |
|------|--------|----------------|
| Display / headings | **Oranienbaum** | Title, Subtitle, Heading 1–6, TOC Heading |
| Body | **Roboto** | Normal, Body Text, Author, Date, Definition, TOC entries, blockquote |
| Mono — data/labels/captions/code | **IBM Plex Mono** | Table, Table Grid, Compact (table-cell text), Caption, Image/Table Caption, Source Code, Verbatim Char, **section numbers** |

Hierarchy by **size + family, not weight** (no bold). Type scale (pt): Title 30 ·
H1 22 · H2 15 · H3 12 · H4 11.5 · body 10.5/1.5 · captions 8.5–9 mono.
**Section numbers** (the auto-numbered `1`, `1.1`, `1.1.1`) render in **IBM Plex
Mono, brand purple `#454BC4`** via the numbering level rPr, while the heading
title is Oranienbaum `#1C1C1E` — the "mono number + display title" treatment.

### Embedded font files (source TTFs)
- `assets/branding/fonts/Oranienbaum-Regular.ttf` — family `Oranienbaum`
- `assets/branding/fonts/Roboto-Regular.ttf` — family `Roboto`
- `assets/branding/fonts/IBMPlexMono-Regular.ttf` — family `IBM Plex Mono`

(Also present, from the type specimen, but **not** used by the pipeline doc:
`Roboto-Medium.ttf`, `IBMPlexMono-SemiBold.ttf`, `BricolageGrotesque-SemiBold.ttf`,
`Newsreader-Regular.ttf`.)

Inside the `.docx` the three are embedded as obfuscated `word/fonts/font1–3.odttf`
(GUID-XOR per ECMA-376) with `embedTrueTypeFonts` + `saveSubsetFonts=0`.
**Verified** on reopen by de-obfuscating each with its `fontKey` and reloading as
a valid TTF (family names match).

---

## Brand image assets

| Asset | File | Use |
|-------|------|-----|
| Header band (trimmed) | `techjays-header-trimmed.png` | running header — logo + gradient rule, padding cropped so the **logo's left edge is flush to the content left margin** and the gradient reaches the right margin |
| Header band (original) | `techjays-header.png` | source band (has transparent padding; use the trimmed copy) |
| Cover hero | `techjays-cover.jpg` | full-page cover background |
| Logo mark | `techjays-logo.png` | standalone mark |

The trimmed band is placed in the reference doc's running header at full content
width (6.5 in on Letter, 1 in margins), zero indent.

---

## Page setup

- US **Letter** 8.5 × 11 in, **1 in** margins, header/footer distance 0.5 in.
- **Header:** `techjays-header-trimmed.png` band, flush left, tight vertical padding.
- **Footer:** `Page X of Y`, centered, Roboto 9 pt muted (Word `PAGE`/`NUMPAGES` fields).
- **Paper tint** `#FBF9F4` via `w:background` + `<w:displayBackgroundShape/>`
  (renders on screen; Word does **not** print background colors by default).
- Generous spacing: body space-after 10 pt / line 1.5; headings 12–22 pt before;
  table cell padding 130 (top/bottom) × 160 (left/right) twips.

---

## Heading numbering & TOC

- **Multilevel auto-numbering** linked to Heading 1/2/3 (`numId=1`,
  `multiLevelType=multilevel`): `1`, `1.1`, `1.1.1`. Numbers render mono purple
  (see Typography). Heading 4–6 unnumbered. Headings arrive as plain titles; Word
  applies the numbers.
- **TOC**: `TOC Heading` (Oranienbaum) + `TOC 1/2/3` (Roboto) with a right tab at
  6.5 in + **dot leader** (page numbers right-aligned). Live Word field — refreshes on open/`F9`.
- **`TOC Heading` is unnumbered** — based on `Normal` (not Heading 1) with an
  explicit `numId=0`, so it does NOT take a section number. The first real
  content Heading 1 is **"1"**.

---

## Pull Quote (opening note on its own page)

`Pull Quote` paragraph style — for a document-opening note rendered as a quote on
a dedicated page (render.py applies it). Spec: **Oranienbaum 15 pt**, muted ink
**`#5A5A5E`**, line spacing **1.6**, left/right indent 0.45/0.3 in, thin
**`#454BC4`** left rule. Distinct from `Block Text` (the modest in-body
blockquote), which stays Roboto 10.5 pt with a periwinkle bar.

---

## Tables — base style only (render.py finishes them)

The reference `Table` / `Table Grid` styles are intentionally minimal: **IBM Plex
Mono**, clean hairline (`#E6E1D6`) borders, generous cell padding, small
space-after. **No firstRow band** (the white-on-dark header band failed when
driven by a table style). `render.py` post-process applies the **dark `#15171A`
header row with white text**, **`#F2EEE4` zebra rows**, right-aligned numerics,
and clear space-after. Pandoc styles table-cell text with the **Compact** style,
which is set to IBM Plex Mono so cells render mono.

---

## Render command (Pandoc)

```bash
pandoc <in.md> --reference-doc=assets/branding/techjays-reference.docx --toc -o <out.docx>
```

Pandoc copies styles, page geometry, running header/footer, embedded fonts, and
the numbering definition from the reference doc; it ignores the reference doc's
body. Then `render.py` post-processes tables and inserts stat cards + the cover.

---

## Cover page tokens (for `render.py`)

The cover is assembled by `render.py` from each file's YAML frontmatter (not body
prose). Design (per `design-system.md` §5):

- **Background:** `assets/branding/techjays-cover.jpg` (full page).
- **Eyebrow / doc type:** frontmatter `subtitle` (or a doc-type label) — **IBM Plex Mono**, `#454BC4`, tracked, uppercase.
- **Title:** frontmatter `title` — large **Oranienbaum**, `#1C1C1E` (on the light cover field).
- **Project / version / date:** frontmatter `project`, `version`, `date` — IBM Plex Mono `#5A5A5E`.
- **Logo:** `techjays-logo.png`.
- **NO status line / no internal terms** (never read `status`).

Frontmatter consumed: `title`, `subtitle`, `project`, `version`, `date`.

---

## Styles present (verified on reopen)

`Title, Subtitle, Author, Date, Heading 1–6, Normal, Body Text, First Paragraph,
Compact, Block Text, Pull Quote, Source Code, Verbatim Char, Caption, Image Caption,
Table Caption, Table, Table Grid, TOC Heading, TOC 1–3, Hyperlink, Header,
Footer, Definition, Definition Term, Footnote Text, Footnote Reference.`

---

## Build method & limitations

**Pandoc is not installed** in the build environment → the reference doc is built
with **python-docx** (styles, header/footer, tables, numbering links, paper-tint
background) plus a **direct OOXML zip post-pass** (font embedding, numbering part
with mono-purple level rPr, `displayBackgroundShape`). fontTools instanced the
Roboto/Oranienbaum/Plex statics.

Validated by reopening: all style names, fonts, colors, heading `numPr`, mono
section-number rPr, TOC dot leaders, table mono + hairline borders + **no
firstRow band**, paper tint, header band flush (width 6.5 in, indent 0), footer
fields; every XML part passes `xmllint`; embedded fonts verified by
de-obfuscation.

**Not verified (no Word / LibreOffice / pandoc in env):** visual fidelity in
Word, that Word activates embedded fonts on open, exact pagination, and TOC/field
auto-update (fields populate on open/`F9`). Paper tint is screen-only by Word
design (prints white unless the user enables "print background colors").
