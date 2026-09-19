"""
Anki Spaced Repetition System (SRS) Scheduler.
Implements the open-source SuperMemo-2 (SM-2) algorithm customized with Anki defaults:
- Ratings:
    1 = Again (fail / lapse)
    2 = Hard (recalled with difficulty)
    3 = Medium / Good (successful recall at appropriate interval)
    4 = Easy (effortless recall)
- Ease Factor (EF):
    Default initial EF: 2.5 (250%)
    Minimum EF: 1.3 (130%)
- Interval Progression:
    Again (1): Lapses count increases, reps reset to 0, interval resets to 1 day, EF decreases by 0.20
    Hard (2): Reps increase, EF decreases by 0.15, interval multiplied by 1.2
    Medium (3): Reps increase, EF unchanged, interval: 1 day -> 6 days -> interval * EF
    Easy (4): Reps increase, EF increases by 0.15, interval: 4 days -> 10 days -> interval * EF * 1.3
"""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

MIN_EASE_FACTOR = 1.30
INITIAL_EASE_FACTOR = 2.50
EASY_BONUS = 1.30
HARD_INTERVAL_FACTOR = 1.20


@dataclass
class AnkiSRSState:
    state: str = "new"  # 'new', 'learning', 'review', 'relearning', 'mastered'
    reps: int = 0
    lapses: int = 0
    ease_factor: float = INITIAL_EASE_FACTOR
    interval_days: int = 0
    due_date: Optional[datetime] = None
    last_reviewed: Optional[datetime] = None


def calculate_anki_next_review(
    current: AnkiSRSState,
    rating: int,
    now: Optional[datetime] = None
) -> AnkiSRSState:
    """
    Computes the next SRS state and scheduling parameters based on user rating.
    
    Args:
        current: Current card SRS state.
        rating: 1 (Again), 2 (Hard), 3 (Medium/Good), 4 (Easy).
        now: Optional current timestamp (defaults to UTC now).
        
    Returns:
        AnkiSRSState: Updated card SRS state with new interval, ease factor, and due date.
    """
    if rating not in (1, 2, 3, 4):
        raise ValueError(f"Invalid Anki rating: {rating}. Must be 1, 2, 3, or 4.")

    if now is None:
        now = datetime.now(timezone.utc)

    ease = current.ease_factor
    interval = current.interval_days
    reps = current.reps
    lapses = current.lapses

    if rating == 1:  # AGAIN
        lapses += 1
        reps = 0
        ease = max(MIN_EASE_FACTOR, round(ease - 0.20, 2))
        interval = 1
        new_state = "relearning" if current.state in ("review", "mastered") else "learning"

    elif rating == 2:  # HARD
        reps += 1
        ease = max(MIN_EASE_FACTOR, round(ease - 0.15, 2))
        if interval <= 0:
            interval = 1
        else:
            interval = max(interval + 1, int(round(interval * HARD_INTERVAL_FACTOR)))
        new_state = "review"

    elif rating == 3:  # MEDIUM (Anki Good)
        reps += 1
        # Ease factor is unchanged for Good/Medium in Anki SM-2
        if reps == 1:
            interval = 1
        elif reps == 2:
            interval = 6
        else:
            interval = max(interval + 1, int(round(interval * ease)))
        new_state = "mastered" if interval >= 14 and reps >= 3 else "review"

    elif rating == 4:  # EASY
        reps += 1
        ease = round(ease + 0.15, 2)
        if reps == 1:
            interval = 4
        elif reps == 2:
            interval = 10
        else:
            interval = max(interval + 2, int(round(interval * ease * EASY_BONUS)))
        new_state = "mastered"

    due_date = now + timedelta(days=interval)

    return AnkiSRSState(
        state=new_state,
        reps=reps,
        lapses=lapses,
        ease_factor=ease,
        interval_days=interval,
        due_date=due_date,
        last_reviewed=now,
    )
