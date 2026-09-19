def test_record_review_and_stats(client):
    # Record a review for character 1 (rating 4 = easy/mastered)
    payload = {
        "character_id": 1,
        "rating": 4
    }
    response = client.post("/api/practice/review", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["character_id"] == 1
    assert data["status"] == "mastered"
    assert data["rating"] == 4

    # Check stats endpoint
    stats_resp = client.get("/api/practice/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_characters"] >= 15
    assert stats["total_reviews"] >= 1
    assert stats["mastered_count"] >= 1


def test_record_review_learning_status(client):
    # Rating 1 = again/learning
    payload = {
        "character_id": 2,
        "rating": 1
    }
    response = client.post("/api/practice/review", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["character_id"] == 2
    assert data["status"] == "learning"


def test_record_review_invalid_character(client):
    payload = {
        "character_id": 9999,
        "rating": 3
    }
    response = client.post("/api/practice/review", json=payload)
    assert response.status_code == 404


def test_get_due_characters(client):
    response = client.get("/api/practice/due")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "hanzi" in data[0]
    assert "pinyin" in data[0]


