"""Personal access token verification + a request-scoped current user.

Agents authenticate to the MCP server with a Keel PAT (Authorization: Bearer).
We store only the SHA-256 hash; verification re-hashes and looks it up.
"""

import hashlib
from contextvars import ContextVar
from datetime import datetime, timezone

from .db import admin

# Set per MCP request by the auth middleware; read by the MCP tools.
current_user: ContextVar[str | None] = ContextVar("current_user", default=None)


def verify_pat(raw: str | None) -> str | None:
    """Return the owning user_id for a valid, non-revoked token, else None."""
    if not raw:
        return None
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    sb = admin()
    rows = (
        sb.table("personal_access_tokens")
        .select("id,user_id,revoked_at")
        .eq("token_hash", token_hash)
        .limit(1)
        .execute()
        .data
    )
    if not rows or rows[0].get("revoked_at"):
        return None
    try:
        sb.table("personal_access_tokens").update(
            {"last_used_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", rows[0]["id"]).execute()
    except Exception:
        pass
    return rows[0]["user_id"]
