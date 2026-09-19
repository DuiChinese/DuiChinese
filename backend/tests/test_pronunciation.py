def test_evaluate_pronunciation_correct(client):
    payload = {
        "target_hanzi": "好",
        "target_pinyin": "hǎo",
        "target_tone": 3,
        "spoken_text": "好"
    }
    response = client.post("/api/pronunciation/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_match"] is True
    assert data["score"] == 100
    assert data["target_tone"] == 3
    assert "tone_info" in data
    assert "pitch_pattern" in data["tone_info"]


def test_evaluate_pronunciation_incorrect(client):
    payload = {
        "target_hanzi": "师",
        "target_pinyin": "shī",
        "target_tone": 1,
        "spoken_text": "十"
    }
    response = client.post("/api/pronunciation/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_match"] is False
    assert data["score"] < 100
    assert len(data["tips"]) > 0

