"""Remote MCP server for BYO agents (Claude Code / Codex).

Exposes Keel as MCP tools + resources backed by the same Supabase state and the
same Python gate engine the REST service uses — so an agent can drive a project
without the web app. Heavy file transfer (pull/push of the snapshot bundle) stays
on the REST endpoints via signed URLs; MCP covers read, answer, and the gate.

Auth: the streamable-HTTP transport carries the user's bearer token; per-user
attribution for decision_log is wired to that token at deploy time.
"""

from mcp.server.fastmcp import FastMCP

from .db import admin
from .gates import run_constitution as _run_constitution

mcp = FastMCP("keel")


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
    lock = (
        sb.table("locks")
        .select("holder_id,status,heartbeat_at")
        .eq("project_id", project_id)
        .execute()
        .data
    )
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


@mcp.tool()
def keel_answer_question(project_id: str, q_id: str, answer: str) -> dict:
    """Record a real answer to an open question and close it."""
    sb = admin()
    sb.table("questions").update(
        {"answer_text": answer, "disposition": "answered", "disposition_label": "Answered"}
    ).eq("project_id", project_id).eq("q_id", q_id).execute()
    sb.table("decision_log").insert(
        {"project_id": project_id, "ref_id": q_id, "kind": "answer", "summary": answer[:280]}
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
    sb = admin()
    sb.table("questions").update(
        {"disposition": disp, "disposition_label": label}
    ).eq("project_id", project_id).eq("q_id", q_id).execute()
    sb.table("decision_log").insert(
        {"project_id": project_id, "ref_id": q_id, "kind": kind, "summary": note[:280]}
    ).execute()
    return {"ok": True, "q_id": q_id, "disposition": disp}


@mcp.tool()
def keel_check_constitution() -> dict:
    """Run the constitution gate against the pinned standard."""
    return _run_constitution()


@mcp.resource("keel://projects/{project_id}/coverage")
def coverage_resource(project_id: str) -> str:
    sb = admin()
    rows = (
        sb.table("dimensions")
        .select("dim_id,discipline_id,name,score")
        .eq("project_id", project_id)
        .execute()
        .data
        or []
    )
    body = "\n".join(f"{r['dim_id']}\t{r['score']}\t{r['name']}" for r in rows)
    return "dim_id\tscore\tname\n" + body


@mcp.resource("keel://projects/{project_id}/questions")
def questions_resource(project_id: str) -> str:
    sb = admin()
    rows = (
        sb.table("questions")
        .select("q_id,disposition,text")
        .eq("project_id", project_id)
        .execute()
        .data
        or []
    )
    return "\n".join(f"{r['q_id']}\t{r['disposition']}\t{r['text']}" for r in rows)
