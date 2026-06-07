from fastapi import FastAPI

from .gates import run_constitution
from .routers import checkout

app = FastAPI(title="Keel Service", version="0.1.0")
app.include_router(checkout.router)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/constitution/check")
def constitution_check():
    """Run the constitution gate against the pinned standard."""
    return run_constitution()


# Mount the remote MCP server (streamable HTTP) for BYO agents. Mounted
# defensively so a transport/API mismatch never takes down the REST service.
try:
    from .mcp_server import mcp as _mcp

    app.mount("/mcp", _mcp.streamable_http_app())
except Exception as exc:  # pragma: no cover
    print(f"MCP mount skipped: {exc}")
