from functools import lru_cache

from supabase import Client, create_client

from .config import settings


@lru_cache
def admin() -> Client:
    """Service-role Supabase client. Bypasses RLS — server use only."""
    return create_client(settings.supabase_url, settings.supabase_service_key)
