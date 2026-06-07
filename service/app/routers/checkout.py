"""Git-like checkout for a project: pull (lock + snapshot) → work → push (gate).

Whole-project lock with a lease. Lazy reclaim: a stale lease becomes
'reclaimable' rather than being reassigned; the next puller (or the original
holder, if uncontended) wins it.
"""

import io
import os
import tempfile
import zipfile
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..auth import User, get_current_user
from ..config import settings
from ..db import admin
from ..gates import run_generate, run_review
from ..ingest import ingest_generate, ingest_review

router = APIRouter(prefix="/projects/{project_id}", tags=["checkout"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _ttl() -> timedelta:
    return timedelta(minutes=settings.lease_ttl_minutes)


def _is_stale(lock: dict) -> bool:
    hb = datetime.fromisoformat(lock["heartbeat_at"])
    return _now() - hb > _ttl()


def _get_lock(sb, project_id: str) -> dict | None:
    rows = sb.table("locks").select("*").eq("project_id", project_id).execute().data
    return rows[0] if rows else None


def _log(sb, project_id: str, user: User, action: str, target=None, meta=None):
    sb.table("activity").insert(
        {"project_id": project_id, "actor_id": user.id, "action": action,
         "target": target, "meta": meta}
    ).execute()


@router.post("/pull")
def pull(project_id: str, user: User = Depends(get_current_user)):
    sb = admin()
    lock = _get_lock(sb, project_id)
    if lock and lock["status"] == "held" and lock["holder_id"] != user.id and not _is_stale(lock):
        raise HTTPException(
            status_code=409,
            detail={"reason": "locked", "holder_id": lock["holder_id"], "since": lock["acquired_at"]},
        )

    now = _now()
    sb.table("locks").upsert(
        {"project_id": project_id, "holder_id": user.id, "status": "held",
         "acquired_at": now.isoformat(), "heartbeat_at": now.isoformat()},
    ).execute()

    snaps = (
        sb.table("snapshots").select("storage_path,version")
        .eq("project_id", project_id).order("version", desc=True).limit(1).execute().data
    )
    snapshot_url = None
    if snaps:
        signed = sb.storage.from_("snapshots").create_signed_url(snaps[0]["storage_path"], 3600)
        snapshot_url = signed.get("signedURL") or signed.get("signedUrl")

    _log(sb, project_id, user, "pull")
    return {
        "locked": True,
        "lease_expires": (now + _ttl()).isoformat(),
        "snapshot_url": snapshot_url,
        "snapshot_version": snaps[0]["version"] if snaps else 0,
    }


@router.post("/heartbeat")
def heartbeat(project_id: str, user: User = Depends(get_current_user)):
    sb = admin()
    lock = _get_lock(sb, project_id)
    if not lock or lock["holder_id"] != user.id or lock["status"] != "held":
        raise HTTPException(status_code=409, detail="You do not hold this lock")
    now = _now()
    sb.table("locks").update({"heartbeat_at": now.isoformat()}).eq("project_id", project_id).execute()
    return {"lease_expires": (now + _ttl()).isoformat()}


@router.post("/release")
def release(project_id: str, user: User = Depends(get_current_user)):
    sb = admin()
    lock = _get_lock(sb, project_id)
    if not lock or lock["status"] != "held":
        return {"released": True}
    if lock["holder_id"] != user.id:
        raise HTTPException(status_code=403, detail="Only the holder can release this lock")
    sb.table("locks").update({"status": "released"}).eq("project_id", project_id).execute()
    _log(sb, project_id, user, "release")
    return {"released": True}


@router.post("/push")
async def push(
    project_id: str,
    file: UploadFile = File(...),
    phase: str = "generate",
    user: User = Depends(get_current_user),
):
    sb = admin()
    lock = _get_lock(sb, project_id)
    if not lock or lock["holder_id"] != user.id or lock["status"] != "held":
        raise HTTPException(status_code=409, detail="You do not hold this lock")

    content = await file.read()

    last = (
        sb.table("snapshots").select("version")
        .eq("project_id", project_id).order("version", desc=True).limit(1).execute().data
    )
    version = (last[0]["version"] + 1) if last else 1
    path = f"{project_id}/v{version}.zip"
    sb.storage.from_("snapshots").upload(
        path, content, {"content-type": "application/zip", "upsert": "true"}
    )

    # Materialize the pushed bundle, run the canonical gate, and ingest state.
    with tempfile.TemporaryDirectory() as tmp:
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            zf.extractall(tmp)
        root = _engagement_root(tmp)
        if phase == "review":
            gate = run_review(root)
            ingested = ingest_review(sb, project_id, root)
        else:
            gate = run_generate(root)
            ingested = ingest_generate(sb, project_id, root)

    sb.table("snapshots").insert(
        {"project_id": project_id, "version": version, "storage_path": path,
         "created_by": user.id, "gate_result": gate}
    ).execute()

    # freeze_status reflects signability: a push never freezes (sign-off does);
    # a [BLOCK] keeps it a draft. The verdict/coverage live in review_runs /
    # projects via ingestion above.
    sb.table("projects").update({"freeze_status": "draft"}).eq("id", project_id).execute()

    _log(sb, project_id, user, "push",
         meta={"version": version, "phase": phase, "gate_ok": gate["ok"]})
    sb.table("locks").update({"status": "released"}).eq("project_id", project_id).execute()

    return {"version": version, "phase": phase, "gate": gate,
            "ingested": ingested, "freeze_status": "draft"}


def _engagement_root(extracted: str) -> str:
    """A pushed zip may wrap the engagement in a single top-level folder.
    Return the dir that actually contains deliverables/ or .keel/."""
    candidates = [extracted] + [
        os.path.join(extracted, name) for name in os.listdir(extracted)
    ]
    for cand in candidates:
        if os.path.isdir(cand) and (
            os.path.isdir(os.path.join(cand, "deliverables"))
            or os.path.isdir(os.path.join(cand, ".keel"))
        ):
            return cand
    return extracted
