from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_jwt_secret: str = ""

    checks_dir: str = "../checks"
    constitution_path: str = "../constitution.md"

    lease_ttl_minutes: int = 15

    # Pandoc branding reference .docx for the render pipeline (app/render.py). Empty
    # or a missing file ⇒ render still works, just unbranded (pandoc default styles).
    reference_doc_path: str = ""


settings = Settings()
