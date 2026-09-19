def test_record_review_and_stats(client):
    # Record a review for character 1 (rating 4 = easy)
    payload = {
        "character_id": 1,
        "rating": 4
    }
    response = client.post("/api/practice/review", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["character_id"] == 1
    assert data["rating"] == 4
    assert data["stability"] > 0
    assert data["difficulty"] > 0
    assert "interval_days" in data

    # Check stats endpoint with Anki breakdown
    stats_resp = client.get("/api/practice/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_characters"] >= 15
    assert stats["total_reviews"] >= 1
    assert "new_count" in stats
    assert "learning_count" in stats
    assert "young_count" in stats
    assert "mature_count" in stats
    assert stats["average_stability"] > 0
    assert stats["average_difficulty"] > 0
    # Total sum of cards must equal total_characters
    total_cards = stats["new_count"] + stats["learning_count"] + stats["young_count"] + stats["mature_count"]
    assert total_cards == stats["total_characters"]

    # Verify categories structure
    assert "categories" in stats
    cats = stats["categories"]
    assert "new" in cats and "learning" in cats and "young" in cats and "mature" in cats
    total_cat_items = len(cats["new"]) + len(cats["learning"]) + len(cats["young"]) + len(cats["mature"])
    assert total_cat_items == stats["total_characters"]
    if len(cats["new"]) > 0:
        first_new = cats["new"][0]
        assert "hanzi" in first_new and "pinyin" in first_new


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
    assert data["stability"] > 0
    assert data["difficulty"] > 0

    stats_resp = client.get("/api/practice/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["learning_count"] >= 1


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
