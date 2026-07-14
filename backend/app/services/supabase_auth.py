"""
Supabase Auth verification for the backend.

All signup/login/email-verification happens on the FRONTEND via the
supabase-js client — Supabase's own hosted Auth sends and handles the
verification emails, so there's no SMTP/email code in this backend at all.

This backend's only job is to verify the JWT that the frontend sends with
each request, using Supabase's officially recommended `auth.get_user(jwt)`
call. This validates the token against Supabase's Auth server directly
(works regardless of whether the project uses symmetric or asymmetric JWT
signing, and survives Supabase rotating their signing keys) rather than us
trying to verify the signature ourselves with a static secret.

Trade-off: this is one extra network call to Supabase per authenticated
request. For a portfolio project / moderate-traffic app this is fine. If
you need to shave that latency later, switch to `get_claims()`
(JWKS-cached, verifies locally) — see Supabase's Python auth docs.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client, Client

from app.config import settings

security = HTTPBearer(auto_error=False)

_supabase_client: Client | None = None


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_PUBLISHABLE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set in .env "
                "to use auth-protected routes."
            )
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_PUBLISHABLE_KEY)
    return _supabase_client


class CurrentUser:
    """Lightweight wrapper so routes don't depend on Supabase's full User shape."""
    def __init__(self, id: str, email: str | None):
        self.id = id
        self.email = email


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    token = credentials.credentials
    try:
        supabase = get_supabase()
        response = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

    if not response or not response.user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

    return CurrentUser(id=response.user.id, email=response.user.email)


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CurrentUser | None:
    """For routes that work both logged-in and logged-out (e.g. local dev without auth set up)."""
    if credentials is None:
        return None
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None
