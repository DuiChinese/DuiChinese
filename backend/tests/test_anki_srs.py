import pytest
from datetime import datetime, timezone, timedelta
from app.core.anki_srs import (
    AnkiSRSState,
    calculate_anki_next_review,
    MIN_EASE_FACTOR,
    INITIAL_EASE_FACTOR,
)


def test_initial_defaults():
    card = AnkiSRSState()
    assert card.state == "new"
    assert card.reps == 0
    assert card.lapses == 0
    assert card.ease_factor == 2.5
    assert card.interval_days == 0
    assert card.due_date is None


def test_rating_again():
    now = datetime(2026, 9, 19, 12, 0, 0, tzinfo=timezone.utc)
    card = AnkiSRSState(reps=3, interval_days=15, ease_factor=2.5, lapses=0, state="review")
    
    updated = calculate_anki_next_review(card, rating=1, now=now)
    assert updated.reps == 0
    assert updated.lapses == 1
    assert updated.interval_days == 1
    assert updated.ease_factor == 2.30  # 2.5 - 0.20
    assert updated.state == "relearning"
    assert updated.due_date == now + timedelta(days=1)


def test_minimum_ease_factor_bound():
    now = datetime(2026, 9, 19, 12, 0, 0, tzinfo=timezone.utc)
    card = AnkiSRSState(ease_factor=1.35)
    
    # 1.35 - 0.20 would be 1.15, but min is 1.30
    updated = calculate_anki_next_review(card, rating=1, now=now)
    assert updated.ease_factor == MIN_EASE_FACTOR


def test_rating_hard():
    now = datetime(2026, 9, 19, 12, 0, 0, tzinfo=timezone.utc)
    card = AnkiSRSState(reps=2, interval_days=10, ease_factor=2.5)
    
    updated = calculate_anki_next_review(card, rating=2, now=now)
    assert updated.reps == 3
    assert updated.ease_factor == 2.35  # 2.5 - 0.15
    assert updated.interval_days == 12   # int(round(10 * 1.2))
    assert updated.due_date == now + timedelta(days=12)


def test_rating_medium_progression():
    now = datetime(2026, 9, 19, 12, 0, 0, tzinfo=timezone.utc)
    card = AnkiSRSState()

    # 1st review Medium -> interval 1
    rep1 = calculate_anki_next_review(card, rating=3, now=now)
    assert rep1.reps == 1
    assert rep1.interval_days == 1
    assert rep1.ease_factor == 2.5  # unchanged

    # 2nd review Medium -> interval 6
    rep2 = calculate_anki_next_review(rep1, rating=3, now=now)
    assert rep2.reps == 2
    assert rep2.interval_days == 6
    assert rep2.ease_factor == 2.5

    # 3rd review Medium -> interval = round(6 * 2.5) = 15
    rep3 = calculate_anki_next_review(rep2, rating=3, now=now)
    assert rep3.reps == 3
    assert rep3.interval_days == 15
    assert rep3.ease_factor == 2.5
    assert rep3.state == "mastered"  # interval >= 14 and reps >= 3


def test_rating_easy_bonus():
    now = datetime(2026, 9, 19, 12, 0, 0, tzinfo=timezone.utc)
    card = AnkiSRSState()

    # 1st review Easy -> interval 4, ease increases to 2.65
    rep1 = calculate_anki_next_review(card, rating=4, now=now)
    assert rep1.reps == 1
    assert rep1.interval_days == 4
    assert rep1.ease_factor == 2.65
    assert rep1.state == "mastered"

    # 2nd review Easy -> interval 10
    rep2 = calculate_anki_next_review(rep1, rating=4, now=now)
    assert rep2.reps == 2
    assert rep2.interval_days == 10
    assert rep2.ease_factor == 2.80


def test_invalid_rating():
    card = AnkiSRSState()
    with pytest.raises(ValueError):
        calculate_anki_next_review(card, rating=0)
    with pytest.raises(ValueError):
        calculate_anki_next_review(card, rating=5)
