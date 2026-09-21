import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
import jwt

from app.core.auth import (
    get_jwks_client,
    verify_supabase_token,
    get_current_user_id,
    get_optional_user_id,
)


def test_jwks_client_endpoint():
    client = get_jwks_client()
    assert "auth/v1/.well-known/jwks.json" in client.uri


def test_missing_credentials_raises_401():
    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(None)
    assert exc_info.value.status_code == 401
    assert "Missing Authorization header" in exc_info.value.detail


def test_optional_user_id_none():
    assert get_optional_user_id(None) is None


def test_invalid_token_raises_401():
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="invalid.jwt.token")
    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(creds)
    assert exc_info.value.status_code == 401


@patch("app.core.auth.get_jwks_client")
@patch("jwt.decode")
def test_valid_token_returns_user_id(mock_decode, mock_get_client):
    mock_signing_key = MagicMock()
    mock_signing_key.key = "fake_key"
    mock_client = MagicMock()
    mock_client.get_signing_key_from_jwt.return_value = mock_signing_key
    mock_get_client.return_value = mock_client

    mock_decode.return_value = {"sub": "123e4567-e89b-12d3-a456-426614174000"}

    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="valid.mock.token")
    user_id = get_current_user_id(creds)
    assert user_id == "123e4567-e89b-12d3-a456-426614174000"
