"""Checkout logic, parameterized by user_id so both the REST router (JWT auth)
and the MCP tools (PAT auth) can call it. Functions return plain dicts:
{"ok": True, ...} or {"ok": False, "status": <int>, "error": <str>, ...}."""

import io
import os
import tempfile
import zipfile
from datetime import datetime, timedelta, timezone

from .config import settings
from .db import admin
from .gates import run_generate, run_review
from .ingest import ingest_generate, ingest_review


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _ttl() -> timedelta:
    return timedelta(minutes=settings.lease_ttl_minutes)


def _get_lock(sb, project_id: str) -> dict | None:
    rows = sb.table("locks").select("*").eq("project_id", project_id).execute().data
    return rows[0] if rows else None


def _is_stale(lock: dict) -> bool:
    return _now() - datetime.fromisoformat(lock["heartbeat_at"]) > _ttl()


def _log(sb, project_id, user_id, action, target=None, meta=None):
    sb.table("activity").insert(
        {"project_id": project_id, "actor_id": user_id, "action": action, "target": target, "meta": meta}
    ).execute()


def is_editor(sb, user_id: str, project_id: str) -> bool:
    """View is open to all; editing requires membership, ownership, or admin."""
    pr = sb.table("profiles").select("role").eq("id", user_id).limit(1).execute().data
    if pr and pr[0].get("role") == "admin":
        return True
    m = (
        sb.table("project_members").select("user_id")
        .eq("project_id", project_id).eq("user_id", user_id).limit(1).execute().data
    )
    if m:
        return True
    p = sb.table("projects").select("created_by").eq("id", project_id).limit(1).execute().data
    return bool(p and p[0].get("created_by") == user_id)


def _engagement_root(extracted: str) -> str:
    candidates = [extracted] + [os.path.join(extracted, n) for n in os.listdir(extracted)]
    for cand in candidates:
        if os.path.isdir(cand) and (
            os.path.isdir(os.path.join(cand, "deliverables"))
            or os.path.isdir(os.path.join(cand, ".keel"))
        ):
            return cand
    return extracted


def do_pull(user_id: str, project_id: str) -> dict:
    sb = admin()
    if not is_editor(sb, user_id, project_id):
        return {"ok": False, "status": 403, "error": "You're not an editor of this project"}
    lock = _get_lock(sb, project_id)
    if lock and lock["status"] == "held" and lock["holder_id"] != user_id and not _is_stale(lock):
        return {"ok": False, "status": 409, "error": "locked", "holder_id": lock["holder_id"]}
    now = _now()
    sb.table("locks").upsert(
        {"project_id": project_id, "holder_id": user_id, "status": "held",
         "acquired_at": now.isoformat(), "heartbeat_at": now.isoformat()}
    ).execute()
    snaps = (
        sb.table("snapshots").select("storage_path,version")
        .eq("project_id", project_id).order("version", desc=True).limit(1).execute().data
    )
    url = None
    if snaps:
        signed = sb.storage.from_("snapshots").create_signed_url(snaps[0]["storage_path"], 3600)
        url = signed.get("signedURL") or signed.get("signedUrl")
    _log(sb, project_id, user_id, "pull")
    return {
        "ok": True,
        "lease_expires": (now + _ttl()).isoformat(),
        "snapshot_url": url,
        "snapshot_version": snaps[0]["version"] if snaps else 0,
    }


def do_heartbeat(user_id: str, project_id: str) -> dict:
    sb = admin()
    lock = _get_lock(sb, project_id)
    if not lock or lock["holder_id"] != user_id or lock["status"] != "held":
        return {"ok": False, "status": 409, "error": "You do not hold this lock"}
    now = _now()
    sb.table("locks").update({"heartbeat_at": now.isoformat()}).eq("project_id", project_id).execute()
    return {"ok": True, "lease_expires": (now + _ttl()).isoformat()}


def do_release(user_id: str, project_id: str) -> dict:
    sb = admin()
    lock = _get_lock(sb, project_id)
    if not lock or lock["status"] != "held":
        return {"ok": True}
    if lock["holder_id"] != user_id:
        return {"ok": False, "status": 403, "error": "Only the holder can release this lock"}
    sb.table("locks").update({"status": "released"}).eq("project_id", project_id).execute()
    _log(sb, project_id, user_id, "release")
    return {"ok": True}


def do_force_release(admin_user_id: str, project_id: str) -> dict:
    sb = admin()
    prof = sb.table("profiles").select("role").eq("id", admin_user_id).limit(1).execute().data
    if not prof or prof[0].get("role") != "admin":
        return {"ok": False, "status": 403, "error": "Admins only"}
    sb.table("locks").update({"status": "released"}).eq("project_id", project_id).execute()
    _log(sb, project_id, admin_user_id, "force_release")
    return {"ok": True}


def do_push(user_id: str, project_id: str, content: bytes, phase: str = "generate") -> dict:
    sb = admin()
    if not is_editor(sb, user_id, project_id):
        return {"ok": False, "status": 403, "error": "You're not an editor of this project"}
    lock = _get_lock(sb, project_id)
    if not lock or lock["holder_id"] != user_id or lock["status"] != "held":
        return {"ok": False, "status": 409, "error": "You do not hold this lock"}

    last = (
        sb.table("snapshots").select("version")
        .eq("project_id", project_id).order("version", desc=True).limit(1).execute().data
    )
    version = (last[0]["version"] + 1) if last else 1
    path = f"{project_id}/v{version}.zip"
    sb.storage.from_("snapshots").upload(path, content, {"content-type": "application/zip", "upsert": "true"})

    render_row = None
    with tempfile.TemporaryDirectory() as tmp:
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            zf.extractall(tmp)
        root = _engagement_root(tmp)
        if phase == "review":
            gate = run_review(root)
            ingested = ingest_review(sb, project_id, root)
        elif phase == "map":
            # Post-map sync: ingest coverage + questions only. No document pack
            # exists yet, so the generate gate would always fail here — skip it.
            ingested = ingest_generate(sb, project_id, root)
            gate = {"ok": True, "phase": "map",
                    "note": "coverage + open questions synced; no document gate run for map"}
        else:
            gate = run_generate(root)
            ingested = ingest_generate(sb, project_id, root)
            # A generate push that actually rendered the pack records a render row;
            # the dashboard's Pack tab keys off this to know the pack exists.
            if os.path.isdir(os.path.join(root, "deliverables")):
                render_row = {"project_id": project_id, "version": version,
                              "storage_path": path, "gate_result": gate}

    sb.table("snapshots").insert(
        {"project_id": project_id, "version": version, "storage_path": path,
         "created_by": user_id, "gate_result": gate}
    ).execute()
    if render_row:
        sb.table("renders").insert(render_row).execute()
    sb.table("projects").update({"freeze_status": "draft"}).eq("id", project_id).execute()
    _log(sb, project_id, user_id, "push", meta={"version": version, "phase": phase, "gate_ok": gate["ok"]})
    sb.table("locks").update({"status": "released"}).eq("project_id", project_id).execute()

    return {"ok": True, "version": version, "phase": phase, "gate": gate, "ingested": ingested}
