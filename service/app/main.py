import contextlib

from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

from .config import settings
from .gates import run_constitution
from .routers import checkout

# Build the MCP sub-app at import time so its streamable-HTTP session manager
# exists before the FastAPI lifespan runs. Mounted defensively so a transport/API
# mismatch never takes down the REST service.
try:
    from .mcp_server import mcp, mcp_http_app

    _mcp_app = mcp_http_app()
except Exception as exc:  # pragma: no cover
    print(f"MCP mount skipped: {exc}")
    mcp = None
    _mcp_app = None


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # A mounted Starlette sub-app's own lifespan is NOT run by the parent app, so
    # the streamable-HTTP session manager's task group would never start (→ 500
    # "Task group is not initialized"). Run it explicitly here.
    if mcp is not None:
        async with mcp.session_manager.run():
            yield
    else:
        yield


app = FastAPI(title="Keel Service", version="0.1.0", lifespan=lifespan)
app.include_router(checkout.router)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/constitution/check")
def constitution_check():
    """Run the constitution gate against the pinned standard."""
    return run_constitution()


@app.get("/constitution/raw", response_class=PlainTextResponse)
def constitution_raw():
    """The pinned constitution markdown (read-only — the standard the app renders)."""
    try:
        with open(settings.constitution_path, encoding="utf-8") as fh:
            return fh.read()
    except OSError:
        return PlainTextResponse("Constitution not found", status_code=404)


@app.get("/projects/{project_id}/doc/{n}", response_class=PlainTextResponse)
def project_doc(project_id: str, n: int):
    """Stream deliverable #n's markdown from the latest snapshot, so the web Pack tab
    can render the generated content (read-only; the snapshot is the source of truth).
    404 when no snapshot has the doc (e.g. only a map was pushed)."""
    from . import checkout_core as core

    md = core.get_deliverable(project_id, n)
    if md is None:
        return PlainTextResponse("Not generated", status_code=404)
    return md


# Mount the remote MCP server (streamable HTTP) for BYO agents.
if _mcp_app is not None:
    app.mount("/mcp", _mcp_app)
