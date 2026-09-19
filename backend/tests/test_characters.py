def test_get_characters_list(client):
    response = client.get("/api/characters")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 15
    # Verify the first character is '不'
    assert data[0]["hanzi"] == "不"
    assert data[0]["pinyin"] == "bù"
    assert data[0]["tone"] == 4


def test_search_character_by_hanzi(client):
    response = client.get("/api/characters?q=好")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["hanzi"] == "好"
    assert data[0]["pinyin"] == "hǎo"


def test_search_character_by_pinyin(client):
    response = client.get("/api/characters?q=xue")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(c["hanzi"] == "学" for c in data)


def test_search_character_by_spanish_meaning(client):
    response = client.get("/api/characters?q=profesor")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(c["hanzi"] == "师" for c in data)


def test_filter_characters_by_tone(client):
    response = client.get("/api/characters?tone=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for char in data:
        assert char["tone"] == 1


def test_get_character_by_id(client):
    # Retrieve character with ID 1
    response = client.get("/api/characters/1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert "examples" in data
    assert len(data["examples"]) > 0


def test_get_character_not_found(client):
    response = client.get("/api/characters/9999")
    assert response.status_code == 404


def test_get_random_character(client):
    response = client.get("/api/characters/random")
    assert response.status_code == 200
    data = response.json()
    assert "hanzi" in data
    assert "pinyin" in data

