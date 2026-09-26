def test_study_session_queue(client):
    # GET /api/study/session returns session characters
    response = client.get("/api/study/session")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "hanzi" in data[0]
    assert "pinyin" in data[0]


def test_study_review_and_prelearn(client):
    # POST /api/cards/prelearn for characters 10 and 11
    prelearn_resp = client.post("/api/cards/prelearn", json={"character_ids": [10, 11]})
    assert prelearn_resp.status_code == 200
    prelearn_data = prelearn_resp.json()
    assert prelearn_data["ok"] is True
    assert prelearn_data["prelearned_count"] == 2

    # Check that stats now classifies prelearned cards as Mature
    stats_resp = client.get("/api/study/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["mature_count"] >= 2
    # Verify formatted_interval in category items
    mature_items = stats["categories"]["mature"]
    assert len(mature_items) >= 2
    for item in mature_items:
        assert "formatted_interval" in item
        assert item["formatted_interval"] != "New"

    # POST /api/study/review for card 10 with rating 3 (Good)
    review_resp = client.post("/api/study/review", json={"character_id": 10, "rating": 3})
    assert review_resp.status_code == 200
    review_data = review_resp.json()
    assert review_data["character_id"] == 10
    assert review_data["rating"] == 3
    assert review_data["stability"] > 0
