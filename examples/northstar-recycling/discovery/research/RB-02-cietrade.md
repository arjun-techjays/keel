# RB-02 — CieTrade integration surface   (keel-map research, 2026-05-27)

**Why it matters here.** ENG-04 · instance: CieTrade (Integrations). Blocks
both modules: vendor, PO, and receiving data come from CieTrade.

**What the research found** *(sourced; fixture URLs illustrative)*
- CieTrade exposes a REST API (v2) with OAuth2 client-credentials; documented
  rate limit 600 req/min per tenant; vendor-hosted sandbox available on
  request. (cietrade.com developer docs, accessed 2026-05-27)

**The decision space**
- Read-only pull vs webhook push — affects latency of PO/receiving data.
- Sandbox-first vs production-first integration testing.

**Questions for the lead** *(each with example answers)*
1. Read-only pull on a schedule — e.g. **every 15 minutes**, **hourly**, or **webhook push**?
2. Who owns the CieTrade side — e.g. **NSR IT**, **CieTrade support contract**?

**Suggested default assumption** — read-only pull every 15 minutes; NSR IT owns
the tenant. *Impact-if-wrong:* matching runs on stale receiving data; rework
of the sync layer.
