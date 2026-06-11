"""REST checkout (JWT auth). Thin wrappers over checkout_core, which is shared
with the MCP tools (PAT auth)."""

from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile

from ..auth import User, get_current_user
from .. import checkout_core as core

router = APIRouter(prefix="/projects/{project_id}", tags=["checkout"])


def _result(r: dict) -> dict:
    if not r.get("ok"):
        detail = {k: v for k, v in r.items() if k not in ("ok", "status")}
        raise HTTPException(status_code=r.get("status", 400), detail=detail or "error")
    return r


@router.post("/pull")
def pull(project_id: str, user: User = Depends(get_current_user)):
    return _result(core.do_pull(user.id, project_id))


@router.post("/heartbeat")
def heartbeat(project_id: str, user: User = Depends(get_current_user)):
    return _result(core.do_heartbeat(user.id, project_id))


@router.post("/release")
def release(project_id: str, user: User = Depends(get_current_user)):
    return _result(core.do_release(user.id, project_id))


@router.post("/force-release")
def force_release(project_id: str, user: User = Depends(get_current_user)):
    return _result(core.do_force_release(user.id, project_id))


@router.delete("")
def delete_project(
    project_id: str,
    confirm: str = Body(..., embed=True),
    user: User = Depends(get_current_user),
):
    """Owner/admin only; `confirm` must equal the project name exactly."""
    return _result(core.do_delete_project(user.id, project_id, confirm))


@router.post("/push")
async def push(
    project_id: str,
    file: UploadFile = File(...),
    phase: str = "generate",
    user: User = Depends(get_current_user),
):
    content = await file.read()
    return _result(core.do_push(user.id, project_id, content, phase))
