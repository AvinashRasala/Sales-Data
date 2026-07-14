import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # Supabase Postgres connection string (Project Settings -> Database ->
    # Connection string -> URI, using the "Transaction pooler" connection
    # for serverless-friendly pooling). Falls back to local SQLite if unset,
    # so the app still runs with zero setup.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/app.db")

    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./data/uploads")
    MAX_UPLOAD_MB: int = 25

    # --- Supabase Auth (backend only verifies tokens — see services/supabase_auth.py) ---
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    # Use the new "publishable" key (sb_publishable_...), not the legacy anon
    # key — Supabase is deprecating legacy keys by end of 2026.
    SUPABASE_PUBLISHABLE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs("./data", exist_ok=True)
