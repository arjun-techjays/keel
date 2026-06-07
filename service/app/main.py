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


class _MCPNoRedirect:
    """Serve the MCP endpoint at both "/mcp" and "/mcp/" with no 307 redirect.

    The streamable-HTTP app is mounted at "/mcp" and serves at "/mcp/", so a bare
    "/mcp" would hit Starlette's Mount trailing-slash redirect (307). The
    streamable-HTTP client doesn't reliably re-POST a request body across that
    redirect, so large pushes hang. Rewrite "/mcp" -> "/mcp/" in-process (before
    routing) so the bare path is served directly, regardless of how a client
    normalizes the configured URL.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http" and scope.get("path") == "/mcp":
            scope = dict(scope)
            scope["path"] = "/mcp/"
            scope["raw_path"] = b"/mcp/"
        await self.app(scope, receive, send)


app = FastAPI(title="Keel Service", version="0.1.0", lifespan=lifespan)
app.add_middleware(_MCPNoRedirect)
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


# Mount the remote MCP server (streamable HTTP) for BYO agents.
if _mcp_app is not None:
    app.mount("/mcp", _mcp_app)
