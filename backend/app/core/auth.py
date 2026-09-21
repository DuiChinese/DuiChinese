"""
Supabase Authentication helper using asymmetric JWT Signing Keys (JWKS).
Validates tokens issued by Supabase Auth using the project's public key (ES256 / RS256).
"""
import logging
from typing import Optional
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

logger = logging.getLogger("duichinese.auth")
security = HTTPBearer(auto_error=False)

# JWKS client automatically fetches and caches public signing keys from Supabase
_jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
_jwks_client: Optional[PyJWKClient] = None


def get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = PyJWKClient(_jwks_url)
    return _jwks_client


def verify_supabase_token(token: str) -> dict:
    """
    Decodes and validates a Supabase JWT using the JWKS public keys.
    Returns the decoded token payload dictionary.
    """
    try:
        client = get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
        return payload
    except jwt.PyJWTError as e:
        logger.warning(f"Supabase JWT validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired authorization token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> str:
    """
    FastAPI dependency that enforces authentication.
    Returns the user's UUID (the 'sub' claim in Supabase JWT).
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing sub (user ID)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return str(user_id)


def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[str]:
    """
    FastAPI dependency that returns user UUID if token is present and valid,
    or None if no Authorization header was supplied.
    """
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = verify_supabase_token(credentials.credentials)
        return payload.get("sub")
    except HTTPException:
        return None
