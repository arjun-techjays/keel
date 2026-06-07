"""Remote MCP server for BYO agents (Claude Code / Codex).

Agents authenticate with a Keel personal access token (Authorization: Bearer),
verified by PATAuthMiddleware which stashes the user in a contextvar. Every tool
acts as — and is attributed to — that user. Checkout logic is shared with REST
via checkout_core.
"""

import base64

from .db import admin
from .gates import run_constitution as _run_constitution
from .pat import current_user, verify_pat
from . import checkout_core as core

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("keel")


def _uid() -> str | None:
    return current_user.get()


# ---- read ------------------------------------------------------------------

@mcp.tool()
def keel_list_projects() -> list[dict]:
    """List engagements with gate and coverage status."""
    sb = admin()
    return (
        sb.table("projects")
        .select("id,name,client,freeze_status,coverage_pct,block_count,open_questions")
        .execute()
        .data
        or []
    )


@mcp.tool()
def keel_project_status(project_id: str) -> dict:
    """Counts + current lock holder for one project."""
    sb = admin()
    proj = sb.table("projects").select("*").eq("id", project_id).execute().data
    lock = sb.table("locks").select("holder_id,status,heartbeat_at").eq("project_id", project_id).execute().data
    return {"project": (proj or [None])[0], "lock": (lock or [None])[0]}


@mcp.tool()
def keel_list_questions(project_id: str, only_open: bool = True) -> list[dict]:
    """Open questions for the clarify phase."""
    sb = admin()
    rows = (
        sb.table("questions")
        .select("q_id,text,tag,disposition,disposition_label,assignee_id")
        .eq("project_id", project_id)
        .execute()
        .data
        or []
    )
    if only_open:
        rows = [r for r in rows if r["disposition"] in ("unanswered", "partial")]
    return rows


# ---- write (attributed to the PAT's user) ----------------------------------

@mcp.tool()
def keel_answer_question(project_id: str, q_id: str, answer: str) -> dict:
    """Record a real answer to an open question and close it."""
    uid = _uid()
    sb = admin()
    if not core.is_editor(sb, uid, project_id):
        return {"ok": False, "error": "You're not an editor of this project"}
    sb.table("questions").update(
        {"answer_text": answer, "disposition": "answered", "disposition_label": "Answered"}
    ).eq("project_id", project_id).eq("q_id", q_id).execute()
    sb.table("decision_log").insert(
        {"project_id": project_id, "ref_id": q_id, "kind": "answer", "summary": answer[:280], "actor_id": uid}
    ).execute()
    sb.table("activity").insert(
        {"project_id": project_id, "actor_id": uid, "action": "answer", "target": q_id}
    ).execute()
    return {"ok": True, "q_id": q_id, "disposition": "answered"}


@mcp.tool()
def keel_disposition_question(project_id: str, q_id: str, kind: str, note: str = "") -> dict:
    """Disposition an open question: assumption | exclusion | defer."""
    mapping = {
        "assumption": ("assumption", "Assumption"),
        "exclusion": ("excluded", "Excluded"),
        "defer": ("deferred", "Deferred · T&M"),
    }
    if kind not in mapping:
        return {"ok": False, "error": "kind must be assumption|exclusion|defer"}
    disp, label = mapping[kind]
    uid = _uid()
    sb = admin()
    if not core.is_editor(sb, uid, project_id):
        return {"ok": False, "error": "You're not an editor of this project"}
    sb.table("questions").update(
        {"disposition": disp, "disposition_label": label}
    ).eq("project_id", project_id).eq("q_id", q_id).execute()
    sb.table("decision_log").insert(
        {"project_id": project_id, "ref_id": q_id, "kind": kind, "summary": note[:280], "actor_id": uid}
    ).execute()
    sb.table("activity").insert(
        {"project_id": project_id, "actor_id": uid, "action": kind, "target": q_id}
    ).execute()
    return {"ok": True, "q_id": q_id, "disposition": disp}


@mcp.tool()
def keel_check_constitution() -> dict:
    """Run the constitution gate against the pinned standard."""
    return _run_constitution()


# ---- checkout (the agent drives this; web only observes) --------------------

@mcp.tool()
def keel_pull(project_id: str) -> dict:
    """Acquire the project lock for you and return the latest snapshot URL."""
    uid = _uid()
    if not uid:
        return {"ok": False, "error": "unauthenticated"}
    return core.do_pull(uid, project_id)


@mcp.tool()
def keel_push(project_id: str, zip_base64: str, phase: str = "generate") -> dict:
    """Push the engagement (a base64-encoded zip of .keel/ discovery/ deliverables/),
    run the gate, and ingest state. phase = 'generate' or 'review'. You must hold the lock."""
    uid = _uid()
    if not uid:
        return {"ok": False, "error": "unauthenticated"}
    try:
        content = base64.b64decode(zip_base64)
    except Exception as e:
        return {"ok": False, "error": f"invalid zip_base64: {e}"}
    return core.do_push(uid, project_id, content, phase)


@mcp.tool()
def keel_release(project_id: str) -> dict:
    """Release your lock on the project."""
    uid = _uid()
    if not uid:
        return {"ok": False, "error": "unauthenticated"}
    return core.do_release(uid, project_id)


# ---- resources -------------------------------------------------------------

@mcp.resource("keel://projects/{project_id}/coverage")
def coverage_resource(project_id: str) -> str:
    sb = admin()
    rows = (
        sb.table("dimensions").select("dim_id,discipline_id,name,score")
        .eq("project_id", project_id).execute().data or []
    )
    body = "\n".join(f"{r['dim_id']}\t{r['score']}\t{r['name']}" for r in rows)
    return "dim_id\tscore\tname\n" + body


@mcp.resource("keel://projects/{project_id}/questions")
def questions_resource(project_id: str) -> str:
    sb = admin()
    rows = (
        sb.table("questions").select("q_id,disposition,text")
        .eq("project_id", project_id).execute().data or []
    )
    return "\n".join(f"{r['q_id']}\t{r['disposition']}\t{r['text']}" for r in rows)


# ---- auth middleware + app -------------------------------------------------

class PATAuthMiddleware:
    """Require a valid Keel PAT on every /mcp request; expose the user via contextvar."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") != "http":
            return await self.app(scope, receive, send)
        headers = {k.decode().lower(): v.decode() for k, v in scope.get("headers", [])}
        authz = headers.get("authorization", "")
        token = authz[7:].strip() if authz.lower().startswith("bearer ") else ""
        uid = verify_pat(token)
        if not uid:
            await send({"type": "http.response.start", "status": 401,
                        "headers": [[b"content-type", b"application/json"]]})
            await send({"type": "http.response.body",
                        "body": b'{"error":"invalid or missing Keel token"}'})
            return
        ctx = current_user.set(uid)
        try:
            await self.app(scope, receive, send)
        finally:
            current_user.reset(ctx)


def mcp_http_app():
    return PATAuthMiddleware(mcp.streamable_http_app())
