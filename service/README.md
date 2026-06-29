# Keel Service

FastAPI service that backs the Keel app: the **checkout** flow (pull/push/lock),
the **gate runner** (reuses the canonical `checks/` Python — no reimplementation),
and the **remote MCP server** for BYO agents. Supabase is the datastore/auth/storage;
this service holds the logic that needs Python or persistence.

## Why a service (not Supabase Edge Functions)

The gate engine (`check_generate.py`, `check_review.py`, `check_constitution.py`) is
stdlib Python and is the *authority* — CI and the local skills run the same scripts.
Edge Functions are Deno/TS, which would fork the freeze logic. This service runs the
real Python so there's exactly one implementation.

## Layout

```
service/app/
  config.py     env settings (Supabase keys, pinned checks/constitution paths)
  db.py         service-role Supabase client (bypasses RLS — server only)
  auth.py       verify Supabase JWT (HS256) → current user
  gates.py      subprocess the checks/ scripts
  render.py     enriched markdown (+ mermaid/d2 diagrams) → branded .docx (standalone + CLI)
  routers/checkout.py   pull · heartbeat · release · push · render-docx
  main.py       app + /health + /constitution/check
```

## Run locally

```bash
cd service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in Supabase URL + service key + JWT secret
# point at the repo's checks/ + constitution.md for local dev:
export CHECKS_DIR=../checks CONSTITUTION_PATH=../constitution.md
uvicorn app.main:app --reload   # http://localhost:8000/health
```

## Deploy (Railway)

Railway builds `service/Dockerfile` with the **repo root** as context (so the pinned
`checks/` and `constitution.md` are bundled). Set the env vars from `.env.example`
in the Railway dashboard. `railway.json` (repo root) wires the Dockerfile + healthcheck.
Portable container → move to Cloud Run / Fly / self-host at production with no code change.

## Auth

Supabase issues the JWT on Google login (domain-restricted). Both the web app and this
service verify it. The service uses the **service_role** key for DB/storage writes, so it
is the sole authority for gates and locks; the frontend reads Supabase directly under RLS.

## Endpoints (current)

| Method | Path | Purpose |
|---|---|---|
| `GET`  | `/health` | liveness |
| `GET`  | `/constitution/check` | run the constitution gate on the pinned standard |
| `POST` | `/projects/{id}/pull` | acquire/verify lock → signed snapshot URL + lease |
| `POST` | `/projects/{id}/heartbeat` | renew the lease (holder only) |
| `POST` | `/projects/{id}/release` | manual unlock (holder only) |
| `POST` | `/projects/{id}/push` | store snapshot vN+1 → run gate → update state → release |
| `POST` | `/projects/{id}/render-docx` | render the latest pack's deliverables → branded .docx bundle → signed download URL |

Next: structured state ingestion from the pushed pack, the MCP server, KPI wiring,
and a `pg_cron` lease-expiry sweep.

## Render pipeline (enriched markdown → branded .docx)

`app/render.py` turns enriched deliverable markdown (with ` ```mermaid ` / ` ```d2 `
diagrams) into branded Word `.docx`. It is **standalone** (stdlib + `python-docx`, no
Supabase/config imports), so it runs as a CLI and is reused by the `render-docx` route.

What it does, per deliverable (the on-disk source markdown is never modified — all of
the cleanup below happens only on a rendered copy; the gate matches sections by ID OR
title, so stripping IDs at render time is safe):

1. Split off the YAML **frontmatter** (`title`, `subtitle`, `project`, `version`, `date`
   — `status` is dropped) for the cover.
2. **Clean headings + body for display:** strip the internal `F{doc}.{n}` / `§n` / `Doc N`
   heading prefixes and **promote every heading one level** (`##`→`#`, `###`→`##`) so
   sections become Heading 1 (Word auto-numbers `1`, `1.1`, `2` …); **also strip inline
   `F3.x` / `§n` cross-references out of body prose** (parenthetical refs drop; bare refs
   become the section's name) — the hard rule is no internal IDs visible in the body.
   Dimension IDs (`ENG-04`, `DAT-07`) and `*Source: …*` lines are left untouched.
3. Extract fenced `mermaid` / `d2` blocks; render each to **PNG at 3× scale** with a
   **local** renderer — `mmdc` for mermaid, `d2`→SVG→`rsvg-convert` for d2. **Privacy:
   source is never sent to any public service; zero outbound network calls.**
4. Replace each block with the image — **inline, scaled to fit the page content box
   (width and height), text flows after it; no rotation, no forced one-figure-per-page**
   — and one uniformly **Caption-styled** `Figure N — <caption>` line. Caption source
   (precedence): fence attribute `` ```mermaid caption="…" ``, in-diagram directive
   (`%% caption: …` / `# caption: …`), nearest preceding heading, then `Figure N`.
5. Readability heuristic: a figure over ~15 nodes or wider than the page content gets a
   **mermaid.live "view larger" link** (mermaid) or a **high-res SVG attachment link**
   (dense d2). The mermaid.live payload is byte-identical to the live editor's own `pako`
   serde (verified); the source rides in the URL `#fragment` — never sent to a server.
6. Convert ` ```card ` blocks (`value` / `label` / `note`) to inert markers, and append a
   **"Figure sources"** appendix (every diagram's source) so the doc is self-contained.
7. Convert to `.docx` via `pandoc --reference-doc=<branding> --toc`.
8. **Editorial post-process** with `python-docx` — the look pandoc + the reference doc
   can't do alone (design-system.md), mirroring the approved type specimen:
   - **Tables:** per-cell near-black `#15171A` header with **white IBM Plex Mono** text
     (the approach that works — not a table-style firstRow band), zebra body rows
     (`#FBF9F4` / `#F2EEE4`), hairline `#E6E1D6` borders, generous cell padding, space
     after each table, and right-aligned all-numeric columns.
   - **Stat cards:** each ` ```card ` becomes a borderless single-cell **`#F2EEE4`** box —
     big Oranienbaum value in brand purple `#454BC4`, mono `#5A5A5E` label, Roboto note.
   - **Front matter:** a designed **cover** (the **`techjays-cover.jpg` hero** as a
     full-bleed page background with the **`techjays-logo.png` overlaid top-left** in the
     light field, then a mono eyebrow, large Oranienbaum title, project · version · date —
     no status line, running header suppressed), then the **opening note** (the leading
     abstract before the first heading) lifted onto **its own page styled `Pull Quote`**,
     then a page break so the **TOC and Section 1 each start on a new page**. Final order:
     **Cover → Note → TOC → Section 1** (which numbers from `1` via the reference doc).

Diagrams render **inline at content width, caption below only**; **no landscape**. If a
renderer/pandoc is missing the render **degrades gracefully** (source fence + appendix,
no `.docx`) unless `--strict` is passed.

### CLI

```bash
cd service
python -m app.render <deliverables_dir> --reference-doc <ref.docx> --out <out_dir>
# e.g. against the sample fixture:
python -m app.render ../examples/northstar-recycling/deliverables \
  --reference-doc ../assets/branding/techjays-reference.docx --out ./_out
```

The cover hero / logo default to `techjays-cover.jpg` / `techjays-logo.png` next to
`--reference-doc`; override with `--cover-image <path>` / `--logo <path>`, or skip the
whole cover with `--no-cover`.

### Local tool install (needed for actual diagram + .docx rendering)

```bash
# macOS (Homebrew)
brew install pandoc d2 librsvg                 # librsvg → rsvg-convert (d2 SVG→PNG)
npm install -g @mermaid-js/mermaid-cli         # provides `mmdc` (Chrome/Chromium via Puppeteer)

# Debian/Ubuntu
apt-get install -y pandoc nodejs npm chromium librsvg2-bin
npm install -g @mermaid-js/mermaid-cli
curl -fsSL https://d2lang.com/install.sh | sh -s --
# In containers (root), set KEEL_MMDC_NO_SANDBOX=1 and point Puppeteer at the system
# Chromium: PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium (the Dockerfile does this).
```

d2 PNGs are produced as **d2 → native SVG → rsvg-convert → PNG** (browserless) — d2's
own `.png` export pulls a Playwright Chromium and breaks as root in a container.

Overrides (all optional): `KEEL_MMDC_BIN`, `KEEL_D2_BIN`, `KEEL_RSVG_BIN`,
`KEEL_PANDOC_BIN`, `KEEL_MMDC_NO_SANDBOX`, `REFERENCE_DOC_PATH`.

### Tests

```bash
cd service
pip install -r requirements-dev.txt
pytest tests/test_render.py            # binary-dependent tests skip when mmdc/d2/pandoc absent
```

### Deploy

The `Dockerfile` installs `pandoc`, `mermaid-cli` (+ system Chromium for Puppeteer),
the `d2` binary, and `librsvg2-bin`. It also bundles repo-root `assets/branding/` (the
reference `.docx`, the embedded Set B fonts, and the `techjays-cover.jpg` hero) and points
`REFERENCE_DOC_PATH` at it; the render route finds the cover hero beside the reference
doc. If `assets/branding/` is ever absent at build time, comment out that `COPY` — the
route still produces valid, unbranded output.
