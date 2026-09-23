import pytest
from fastapi import HTTPException
from app.main import app
from app.core.auth import get_current_user_id
from tests.conftest import TEST_USER_ID


def test_reset_unauthenticated(client):
    def raise_401():
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    app.dependency_overrides[get_current_user_id] = raise_401
    try:
        res = client.post("/api/practice/reset")
        assert res.status_code == 401
    finally:
        app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID


def test_reset_progress_clears_reviews_and_resets_srs(client):
    # 1. Record reviews for characters 1 and 2
    client.post("/api/practice/review", json={"character_id": 1, "rating": 4})
    client.post("/api/practice/review", json={"character_id": 2, "rating": 3})

    stats_before = client.get("/api/practice/stats").json()
    assert stats_before["total_reviews"] >= 2
    assert stats_before["new_count"] < 7

    # 2. Reset progress
    reset_resp = client.post("/api/practice/reset")
    assert reset_resp.status_code == 200
    data = reset_resp.json()
    assert data["ok"] is True
    assert "User progress reset successfully" in data["message"]

    # 3. Check stats after reset
    stats_after = client.get("/api/practice/stats").json()
    assert stats_after["total_reviews"] == 0
    assert stats_after["new_count"] == 7
    assert stats_after["learning_count"] == 0
    assert stats_after["young_count"] == 0
    assert stats_after["mature_count"] == 0
