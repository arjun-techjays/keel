import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException

from .config import settings

_jwks_client: PyJWKClient | None = None


def _jwks() -> PyJWKClient:
    """Cached JWKS client for the project's asymmetric JWT signing keys."""
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(
            f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        )
    return _jwks_client


class User:
    def __init__(self, claims: dict):
        self.id: str = claims["sub"]
        self.email: str | None = claims.get("email")


def get_current_user(authorization: str | None = Header(default=None)) -> User:
    """Verify the Supabase-issued JWT (asymmetric, via JWKS) and return the caller."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1]
    try:
        signing_key = _jwks().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except Exception as exc:  # PyJWTError or JWKS fetch error
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc
    return User(claims)
