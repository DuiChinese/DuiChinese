import pytest
from datetime import datetime, timezone, timedelta
from app.core.fsrs import (
    FSRSState,
    calculate_fsrs_next_review,
    calculate_retrievability,
    calculate_interval,
    initial_stability,
    initial_difficulty,
    MATURE_INTERVAL_THRESHOLD_DAYS,
)


def test_initial_state_defaults():
    card = FSRSState()
    assert card.state == "new"
    assert card.reps == 0
    assert card.lapses == 0
    assert card.stability == 0.0
    assert card.difficulty == 0.0
    assert card.interval_days == 0
    assert card.is_young is False
    assert card.is_mature is False


def test_first_review_all_ratings():
    now = datetime(2026, 9, 20, 10, 0, 0, tzinfo=timezone.utc)
    card = FSRSState()

    # Rating 1 (Again)
    res_again = calculate_fsrs_next_review(card, rating=1, now=now)
    assert res_again.reps == 0
    assert res_again.lapses == 1
    assert res_again.state == "learning"
    assert res_again.stability == initial_stability(1)
    assert res_again.interval_days >= 1
    assert res_again.due_date == now + timedelta(days=res_again.interval_days)

    # Rating 2 (Hard)
    res_hard = calculate_fsrs_next_review(card, rating=2, now=now)
    assert res_hard.reps == 1
    assert res_hard.lapses == 0
    assert res_hard.state == "review"
    assert res_hard.stability == initial_stability(2)
    assert res_hard.is_young is True

    # Rating 3 (Good)
    res_good = calculate_fsrs_next_review(card, rating=3, now=now)
    assert res_good.reps == 1
    assert res_good.stability == initial_stability(3)
    assert res_good.interval_days >= 1
    assert res_good.is_young is True

    # Rating 4 (Easy)
    res_easy = calculate_fsrs_next_review(card, rating=4, now=now)
    assert res_easy.reps == 1
    assert res_easy.stability == initial_stability(4)
    assert res_easy.difficulty < res_again.difficulty
    assert res_easy.stability > res_good.stability


def test_retrievability_decay():
    # At t = 0, R = 1.0
    assert calculate_retrievability(stability=10.0, elapsed_days=0.0) == 1.0
    
    # At t = S, R must equal 0.90 (90%) by mathematical definition of stability
    r_at_s = calculate_retrievability(stability=10.0, elapsed_days=10.0)
    assert round(r_at_s, 2) == 0.90

    # Over time, retrievability drops smoothly
    r_late = calculate_retrievability(stability=10.0, elapsed_days=30.0)
    assert 0.0 < r_late < 0.90


def test_subsequent_good_reviews_and_mature_transition():
    now = datetime(2026, 9, 20, 10, 0, 0, tzinfo=timezone.utc)
    card = FSRSState()

    # Review 1: Good
    s1 = calculate_fsrs_next_review(card, rating=3, now=now)
    assert s1.reps == 1
    assert s1.is_young is True
    assert s1.is_mature is False

    # Review 2: Good after interval elapsed
    t2 = now + timedelta(days=s1.interval_days)
    s2 = calculate_fsrs_next_review(s1, rating=3, now=t2)
    assert s2.reps == 2
    assert s2.stability > s1.stability
    assert s2.interval_days > s1.interval_days

    # Review 3: Good after interval elapsed
    t3 = t2 + timedelta(days=s2.interval_days)
    s3 = calculate_fsrs_next_review(s2, rating=3, now=t3)
    assert s3.reps == 3
    assert s3.stability > s2.stability

    # Review 4: Easy to push into Mature (>= 21 days)
    t4 = t3 + timedelta(days=s3.interval_days)
    s4 = calculate_fsrs_next_review(s3, rating=4, now=t4)
    assert s4.reps == 4
    if s4.interval_days >= MATURE_INTERVAL_THRESHOLD_DAYS:
        assert s4.is_mature is True
        assert s4.state == "mature"


def test_lapse_and_relearning():
    now = datetime(2026, 9, 20, 10, 0, 0, tzinfo=timezone.utc)
    mature_card = FSRSState(
        state="mature",
        reps=5,
        lapses=0,
        stability=30.0,
        difficulty=4.0,
        interval_days=30,
        last_reviewed=now,
    )

    # Fail review (Again)
    t_fail = now + timedelta(days=35)  # 5 days late
    lapsed = calculate_fsrs_next_review(mature_card, rating=1, now=t_fail)
    assert lapsed.reps == 0
    assert lapsed.lapses == 1
    assert lapsed.state == "relearning"
    assert lapsed.interval_days == 1
    assert lapsed.stability < mature_card.stability
    assert lapsed.difficulty > mature_card.difficulty


def test_invalid_rating():
    card = FSRSState()
    with pytest.raises(ValueError):
        calculate_fsrs_next_review(card, rating=0)
    with pytest.raises(ValueError):
        calculate_fsrs_next_review(card, rating=5)
