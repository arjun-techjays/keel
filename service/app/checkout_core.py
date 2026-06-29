"""Checkout logic, parameterized by user_id so both the REST router (JWT auth)
and the MCP tools (PAT auth) can call it. Functions return plain dicts:
{"ok": True, ...} or {"ok": False, "status": <int>, "error": <str>, ...}."""

import io
import os
import tempfile
import zipfile
from datetime import datetime, timedelta, timezone

import httpx

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


def do_delete_project(user_id: str, project_id: str, confirm: str) -> dict:
    """Hard-delete a project: storage objects first, then the project row (every
    dependent table cascades). Allowed only for the project owner (created_by)
    or an admin, and only when `confirm` matches the project name exactly —
    the type-to-confirm check is enforced HERE, not just in the UI."""
    sb = admin()
    proj = (
        sb.table("projects").select("id,name,created_by")
        .eq("id", project_id).limit(1).execute().data
    )
    if not proj:
        return {"ok": False, "status": 404, "error": "Project not found"}
    name = proj[0]["name"]

    prof = sb.table("profiles").select("role").eq("id", user_id).limit(1).execute().data
    is_admin = bool(prof and prof[0].get("role") == "admin")
    if not is_admin and proj[0].get("created_by") != user_id:
        return {"ok": False, "status": 403,
                "error": "Only the project owner or an admin can delete a project"}

    if (confirm or "").strip() != name:
        return {"ok": False, "status": 400,
                "error": "Confirmation text does not match the project name"}

    # Storage cleanup — gather paths BEFORE the rows cascade away. Best-effort:
    # an orphaned object is recoverable noise; a half-deleted project is not.
    snap_paths = [
        r["storage_path"]
        for r in (sb.table("snapshots").select("storage_path")
                  .eq("project_id", project_id).execute().data or [])
        if r.get("storage_path")
    ]
    snap_paths += [
        r["storage_path"]
        for r in (sb.table("renders").select("storage_path")
                  .eq("project_id", project_id).execute().data or [])
        if r.get("storage_path")
    ]
    # do_render_docx stores branded .docx zips at {project_id}/renders/… without a
    # tracked row, so sweep that storage prefix directly or they orphan on delete.
    try:
        listed = sb.storage.from_("snapshots").list(f"{project_id}/renders") or []
        snap_paths += [f"{project_id}/renders/{o['name']}"
                       for o in listed if o.get("name")]
    except Exception:
        pass  # best-effort; orphaned objects are recoverable noise
    upload_paths = [
        r["answer_file_path"]
        for r in (sb.table("questions").select("answer_file_path")
                  .eq("project_id", project_id).execute().data or [])
        if r.get("answer_file_path")
    ]
    for bucket, paths in (("snapshots", snap_paths), ("uploads", upload_paths)):
        if paths:
            try:
                sb.storage.from_(bucket).remove(sorted(set(paths)))
            except Exception:
                pass  # orphaned objects only; the rows below still go

    sb.table("projects").delete().eq("id", project_id).execute()

    # The project's activity rows cascade with it — record a tombstone without
    # the FK so the deletion itself stays auditable.
    try:
        sb.table("activity").insert({
            "actor_id": user_id, "action": "delete_project", "target": name,
            "meta": {"project_id": project_id, "by_admin": is_admin},
        }).execute()
    except Exception:
        pass
    return {"ok": True, "deleted": name}


def _storage_headers() -> dict:
    key = settings.supabase_service_key
    return {"apikey": key, "Authorization": f"Bearer {key}"}


# The six-document pack (constitution Part F), by position.
DELIVERABLE_FILES = {
    1: "1-executive-summary.md", 2: "2-scope.md", 3: "3-technical-architecture.md",
    4: "4-raid.md", 5: "5-implementation-plan.md", 6: "6-approval-and-signoff.md",
}


def get_deliverable(project_id: str, n: int) -> str | None:
    """Return the markdown of deliverable #n from the latest snapshot, or None if
    there is no snapshot / the doc isn't in it (e.g. only a map was pushed). The
    snapshot is the source of truth — nothing is mirrored into the DB."""
    fname = DELIVERABLE_FILES.get(int(n))
    if not fname:
        return None
    sb = admin()
    # Prefer the latest *render's* snapshot (the last actual generate), so a later
    # map/clarify sync — which has no deliverables/ — doesn't blank the Pack tab.
    # Fall back to the latest snapshot if no render has been recorded.
    rnd = (
        sb.table("renders").select("storage_path")
        .eq("project_id", project_id).order("version", desc=True).limit(1).execute().data
    )
    path = rnd[0]["storage_path"] if rnd else None
    if not path:
        snaps = (
            sb.table("snapshots").select("storage_path")
            .eq("project_id", project_id).order("version", desc=True).limit(1).execute().data
        )
        path = snaps[0]["storage_path"] if snaps else None
    if not path:
        return None
    try:
        r = httpx.get(
            f"{settings.supabase_url}/storage/v1/object/snapshots/{path}",
            headers=_storage_headers(), timeout=60,
        )
        r.raise_for_status()
        with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
            for name in zf.namelist():
                if name.endswith(f"deliverables/{fname}") or name.rsplit("/", 1)[-1] == fname:
                    return zf.read(name).decode("utf-8", "replace")
    except Exception:
        return None
    return None


def do_render_docx(user_id: str, project_id: str) -> dict:
    """Render the latest pushed pack's deliverables to branded .docx, bundle them
    (+ any SVG attachments) into a zip, store it as a downloadable render artifact,
    and return a signed URL — the same store-then-sign pattern as do_pull.

    Read-only with respect to the pack (additive): it consumes the latest *render's*
    snapshot — the last actual generate that produced a deliverables/ pack — and never
    mutates it. Editor-gated, since it writes the artifact to storage and runs compute.

    The render itself is environment-agnostic (app/render.py); this wrapper only does
    the Supabase fetch/store. It needs pandoc + the local diagram renderers (mmdc/d2)
    present in the container — see the Dockerfile. If none of the deliverables produce
    a .docx (e.g. pandoc missing), it fails loudly with the renderer warnings rather
    than storing an empty bundle."""
    sb = admin()
    if not is_editor(sb, user_id, project_id):
        return {"ok": False, "status": 403, "error": "You're not an editor of this project"}

    rnd = (
        sb.table("renders").select("version,storage_path")
        .eq("project_id", project_id).order("version", desc=True).limit(1).execute().data
    )
    if not rnd:
        return {"ok": False, "status": 404, "error": "No generated pack to render yet"}
    version = rnd[0]["version"]
    snap_path = rnd[0]["storage_path"]

    try:
        r = httpx.get(
            f"{settings.supabase_url}/storage/v1/object/snapshots/{snap_path}",
            headers=_storage_headers(), timeout=120,
        )
        r.raise_for_status()
        content = r.content
    except Exception as e:
        return {"ok": False, "status": 502, "error": f"could not fetch snapshot v{version}: {e}"}

    from . import render as render_mod  # local renderer module (stdlib + lazy python-docx)

    ref = settings.reference_doc_path or None
    if ref and not os.path.exists(ref):
        ref = None  # branding reference not bundled yet → unbranded, still valid
    cover_image = logo = None
    if ref:  # the cover hero + logo sit beside the reference doc (assets/branding/)
        hero = os.path.join(os.path.dirname(ref), "techjays-cover.jpg")
        cover_image = hero if os.path.exists(hero) else None
        mark = os.path.join(os.path.dirname(ref), "techjays-logo.png")
        logo = mark if os.path.exists(mark) else None

    warnings: list[str] = []
    with tempfile.TemporaryDirectory() as tmp:
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            zf.extractall(tmp)
        root = _engagement_root(tmp)
        deliverables = os.path.join(root, "deliverables")
        if not os.path.isdir(deliverables):
            return {"ok": False, "status": 422, "error": "snapshot v%d has no deliverables/ to render" % version}

        out_dir = os.path.join(tmp, "_render")
        results = []
        for fname in DELIVERABLE_FILES.values():  # the six docs, in canonical order
            src = os.path.join(deliverables, fname)
            if not os.path.exists(src):
                continue
            try:
                res = render_mod.render_markdown_file(src, out_dir, reference_doc=ref,
                                                     cover_image_path=cover_image, logo_path=logo)
            except render_mod.RenderError as e:
                return {"ok": False, "status": 500, "error": f"render failed on {fname}: {e}"}
            warnings.extend(res.warnings)
            results.append(res)

        docx_paths = [res.docx for res in results if res.docx and os.path.exists(res.docx)]
        if not docx_paths:
            return {"ok": False, "status": 500,
                    "error": "no .docx produced — pandoc or a diagram renderer is likely missing",
                    "warnings": warnings}

        bundle = io.BytesIO()
        with zipfile.ZipFile(bundle, "w", zipfile.ZIP_DEFLATED) as zf:
            for path in docx_paths:
                zf.write(path, arcname=os.path.basename(path))
            att = os.path.join(out_dir, "attachments")
            if os.path.isdir(att):
                for f in sorted(os.listdir(att)):
                    zf.write(os.path.join(att, f), arcname=f"attachments/{f}")
        bundle_bytes = bundle.getvalue()
        figures = sum(len(res.figures) for res in results)

    # Store under a distinct renders/ namespace in the snapshots bucket (re-render
    # overwrites via upsert). NOTE: these artifacts are not removed by
    # do_delete_project's storage sweep (which keys off snapshots/renders ROWS) — a
    # follow-up should extend that sweep to the `{id}/renders/` prefix or add a
    # render_artifacts table. Storage-orphan only; never a half-deleted project.
    artifact_path = f"{project_id}/renders/v{version}-docx.zip"
    sb.storage.from_("snapshots").upload(
        artifact_path, bundle_bytes, {"content-type": "application/zip", "upsert": "true"}
    )
    signed = sb.storage.from_("snapshots").create_signed_url(artifact_path, 3600)
    url = signed.get("signedURL") or signed.get("signedUrl")
    _log(sb, project_id, user_id, "render_docx", target=artifact_path,
         meta={"version": version, "docx": len(docx_paths), "figures": figures})
    return {
        "ok": True, "version": version, "docx_count": len(docx_paths), "figures": figures,
        "download_url": url, "storage_path": artifact_path, "warnings": warnings,
    }


def _next_version(sb, project_id: str) -> int:
    last = (
        sb.table("snapshots").select("version")
        .eq("project_id", project_id).order("version", desc=True).limit(1).execute().data
    )
    return (last[0]["version"] + 1) if last else 1


def _push_precondition(sb, user_id: str, project_id: str) -> dict | None:
    """Shared editor + lock guard for every push entry point. None = ok."""
    if not is_editor(sb, user_id, project_id):
        return {"ok": False, "status": 403, "error": "You're not an editor of this project"}
    lock = _get_lock(sb, project_id)
    if not lock or lock["holder_id"] != user_id or lock["status"] != "held":
        return {"ok": False, "status": 409, "error": "You do not hold this lock"}
    return None


def _finalize_push(sb, user_id, project_id, content, phase, version, path) -> dict:
    """Extract → gate → ingest → record snapshot → release lock. Shared by the legacy
    single-call push and the presigned-upload finish, so both behave identically."""
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


def do_push(user_id: str, project_id: str, content: bytes, phase: str = "generate") -> dict:
    """Legacy single-call push: the whole zip arrives in `content` (base64 over MCP,
    or multipart over REST). Fine for the web app and programmatic clients; agents
    should prefer begin → upload → finish so the binary never passes through the
    model's token stream (a large base64 tool-argument stalls the agent)."""
    sb = admin()
    err = _push_precondition(sb, user_id, project_id)
    if err:
        return err
    version = _next_version(sb, project_id)
    path = f"{project_id}/v{version}.zip"
    sb.storage.from_("snapshots").upload(path, content, {"content-type": "application/zip", "upsert": "true"})
    return _finalize_push(sb, user_id, project_id, content, phase, version, path)


def do_push_begin(user_id: str, project_id: str, phase: str = "generate") -> dict:
    """Reserve the next snapshot version and return a presigned URL the client PUTs the
    zip to directly. This keeps the binary entirely out of the agent/model: the model
    only handles a short URL, and `curl` streams the file straight to storage."""
    sb = admin()
    err = _push_precondition(sb, user_id, project_id)
    if err:
        return err
    version = _next_version(sb, project_id)
    path = f"{project_id}/v{version}.zip"
    try:
        r = httpx.post(
            f"{settings.supabase_url}/storage/v1/object/upload/sign/snapshots/{path}",
            headers=_storage_headers(), timeout=30,
        )
        r.raise_for_status()
        rel = r.json()["url"]  # /object/upload/sign/snapshots/<path>?token=...
    except Exception as e:  # pragma: no cover
        return {"ok": False, "status": 502, "error": f"could not create upload url: {e}"}
    upload_url = f"{settings.supabase_url}/storage/v1{rel}" if rel.startswith("/") else rel
    return {
        "ok": True, "version": version, "path": path, "phase": phase,
        "upload_url": upload_url,
        "next": ("PUT the engagement zip to upload_url, then call keel_push_finish "
                 f"with version={version} and phase='{phase}'. "
                 "curl -sS -X PUT '<upload_url>' --data-binary @.keel/_push.zip "
                 "-H 'Content-Type: application/zip'"),
    }


def do_push_finish(user_id: str, project_id: str, version: int, phase: str = "generate") -> dict:
    """Complete a push begun with do_push_begin (after the client PUT the zip to the
    presigned URL): download the uploaded zip, run the real gate, ingest, record the
    snapshot, and release the lock."""
    sb = admin()
    err = _push_precondition(sb, user_id, project_id)
    if err:
        return err
    try:
        version = int(version)
    except (TypeError, ValueError):
        return {"ok": False, "status": 400, "error": "version must be an integer from keel_push_begin"}
    path = f"{project_id}/v{version}.zip"
    try:
        r = httpx.get(
            f"{settings.supabase_url}/storage/v1/object/snapshots/{path}",
            headers=_storage_headers(), timeout=120,
        )
        r.raise_for_status()
        content = r.content
    except Exception as e:
        return {"ok": False, "status": 400,
                "error": f"no uploaded snapshot at v{version} — did the upload PUT succeed? ({e})"}
    return _finalize_push(sb, user_id, project_id, content, phase, version, path)
