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
  routers/checkout.py   pull · heartbeat · release · push (runs the gate)
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

Next: structured state ingestion from the pushed pack, the MCP server, KPI wiring,
and a `pg_cron` lease-expiry sweep.
