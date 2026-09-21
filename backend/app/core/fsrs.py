"""
Free Spaced Repetition Scheduler (FSRS) - Python Implementation.
Based on the DSR (Difficulty, Stability, Retrievability) model used in modern Anki (23.10+).

Key Concepts:
- Difficulty (D): Intrinsic difficulty of a card on a scale from 1.0 (easiest) to 10.0 (hardest).
- Stability (S): Memory stability, defined as the time in days required for the retrievability (probability of recall)
  to drop from 100% to 90% (or the desired retention).
- Retrievability (R): Probability of recalling a card given elapsed time t (in days) and stability S:
    R(t, S) = (1 + FACTOR * t / S) ** -0.5
    where FACTOR = 19 / 81 (~0.2345679) such that R(S, S) = 0.90 exactly.
- Interval (I): Given desired retention r (default 0.90):
    I(r, S) = round( (S / FACTOR) * (r ** -2 - 1) )
    When r = 0.90, I(0.90, S) = round(S).

Card Classifications (Anki Standard):
- New: Never studied (reps == 0)
- Learning: In short-term learning or relearning after a lapse
- Young: Graduated review card with interval < 21 days
- Mature: Graduated review card with interval >= 21 days
"""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

# Decay factor ensuring R(S, S) = 0.90 with power -0.5:
# (1 + FACTOR * 1) ** -0.5 = 0.90 => 1 + FACTOR = 0.90 ** -2 = 100 / 81 => FACTOR = 19 / 81
FACTOR = 19.0 / 81.0

# Anki threshold for Mature vs Young cards
MATURE_INTERVAL_THRESHOLD_DAYS = 21

# Default FSRS v4.5 parameters (17 weights)
DEFAULT_WEIGHTS = (
    0.40255,   # w0: initial S for Again (1)
    1.18385,   # w1: initial S for Hard (2)
    3.17300,   # w2: initial S for Good (3)
    15.69105,  # w3: initial S for Easy (4)
    7.19490,   # w4: initial D base
    0.53450,   # w5: initial D slope
    1.46040,   # w6: difficulty reversion speed
    0.00460,   # w7: difficulty delta
    1.54570,   # w8: recall S multiplier
    0.11920,   # w9: recall S power
    1.01920,   # w10: recall S retrievability factor
    1.93950,   # w11: forget S factor
    0.11000,   # w12: forget S difficulty factor
    0.29600,   # w13: forget S stability power
    2.26980,   # w14: forget S retrievability power
    0.23150,   # w15: hard penalty
    2.98980,   # w16: easy bonus
)


@dataclass
class FSRSState:
    """FSRS card state tracking memory parameters and schedule."""
    state: str = "new"  # 'new', 'learning', 'review', 'relearning', 'mature'
    reps: int = 0
    lapses: int = 0
    stability: float = 0.0
    difficulty: float = 0.0
    interval_days: int = 0
    due_date: Optional[datetime] = None
    last_reviewed: Optional[datetime] = None
    retrievability: float = 0.0

    @property
    def is_young(self) -> bool:
        """Card is in review with interval < 21 days."""
        return self.reps > 0 and self.state in ("review", "learning", "relearning") and self.interval_days < MATURE_INTERVAL_THRESHOLD_DAYS

    @property
    def is_mature(self) -> bool:
        """Card is in review with interval >= 21 days."""
        return self.reps > 0 and self.interval_days >= MATURE_INTERVAL_THRESHOLD_DAYS


def calculate_retrievability(stability: float, elapsed_days: float) -> float:
    """
    Computes current retrievability R(t, S), bounded in [0.0, 1.0].
    When elapsed_days == stability, R is exactly 0.90 (90%).
    """
    if stability <= 0.0:
        return 0.0
    if elapsed_days <= 0.0:
        return 1.0
    r = (1.0 + FACTOR * (elapsed_days / stability)) ** -0.5
    return max(0.0, min(1.0, float(r)))


def calculate_interval(stability: float, desired_retention: float = 0.90) -> int:
    """
    Calculates next review interval in days to hit target retention r.
    Default r = 0.90 returns interval ~ round(stability).
    """
    if stability <= 0.0:
        return 1
    r = max(0.70, min(0.99, desired_retention))
    ivl = (stability / FACTOR) * (r ** -2 - 1.0)
    return max(1, int(round(ivl)))


def initial_stability(rating: int, weights: Tuple[float, ...] = DEFAULT_WEIGHTS) -> float:
    """Initial stability S0 based on first rating (1=Again, 2=Hard, 3=Good, 4=Easy)."""
    rating_idx = max(0, min(3, rating - 1))
    return float(weights[rating_idx])


def initial_difficulty(rating: int, weights: Tuple[float, ...] = DEFAULT_WEIGHTS) -> float:
    """Initial difficulty D0 in range [1.0, 10.0]."""
    w4, w5 = weights[4], weights[5]
    # Linear/exponential decay from rating 1 (hardest) to 4 (easiest)
    # Clamp to [1.0, 10.0]
    val = w4 - (rating - 3) * w5
    return max(1.0, min(10.0, round(float(val), 2)))


def next_difficulty(current_d: float, rating: int, weights: Tuple[float, ...] = DEFAULT_WEIGHTS) -> float:
    """
    Updates card difficulty D' using reversion to target difficulty for given rating.
    """
    target_d = initial_difficulty(rating, weights)
    w6 = weights[6]
    # Mean reversion formula: D' = w6 * D0(G) + (1 - w6) * D
    new_d = (1.0 - 0.1 * w6) * current_d + (0.1 * w6) * target_d
    # Fine delta adjustment based on rating
    if rating == 1:
        new_d += 0.8
    elif rating == 2:
        new_d += 0.4
    elif rating == 4:
        new_d -= 0.6
    return max(1.0, min(10.0, round(float(new_d), 2)))


def next_stability_recall(
    stability: float,
    difficulty: float,
    retrievability: float,
    rating: int,
    weights: Tuple[float, ...] = DEFAULT_WEIGHTS
) -> float:
    """
    Computes new stability after successful recall (Rating 2, 3, or 4).
    Lower retrievability at recall produces a larger stability boost (spacing effect).
    """
    w8, w9, w10, w15, w16 = weights[8], weights[9], weights[10], weights[15], weights[16]
    
    grade_bonus = 1.0
    if rating == 2:  # Hard
        grade_bonus = w15
    elif rating == 4:  # Easy
        grade_bonus = w16

    # S_inc = 1 + exp(w8) * (11 - D) * S^(-w9) * (exp(w10 * (1 - R)) - 1) * grade_bonus
    s_inc = 1.0 + (
        w8 * (11.0 - difficulty) * (max(stability, 0.1) ** -w9) *
        ((2.718281828 ** (w10 * (1.0 - retrievability))) - 0.9) * grade_bonus
    )
    new_s = max(stability * max(1.05, s_inc), stability + 0.5)
    return round(float(new_s), 2)


def next_stability_forget(
    stability: float,
    difficulty: float,
    retrievability: float,
    weights: Tuple[float, ...] = DEFAULT_WEIGHTS
) -> float:
    """
    Computes post-lapse stability after forgetting (Rating 1 - Again).
    Retains partial stability while dropping to relearning level.
    """
    w11, w12, w13, w14 = weights[11], weights[12], weights[13], weights[14]
    new_s = w11 * (difficulty ** -w12) * (((stability + 1.0) ** w13) - 1.0) * (2.718281828 ** (w14 * (1.0 - retrievability)))
    # Bound between 0.2 and max(0.5, stability * 0.5)
    bounded_s = max(0.2, min(max(0.5, stability * 0.5), float(new_s)))
    return round(bounded_s, 2)


def calculate_fsrs_next_review(
    current: FSRSState,
    rating: int,
    now: Optional[datetime] = None,
    desired_retention: float = 0.90,
    weights: Tuple[float, ...] = DEFAULT_WEIGHTS
) -> FSRSState:
    """
    Computes the updated FSRS card state based on user rating.

    Args:
        current: Current FSRS card state.
        rating: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy).
        now: Optional current timestamp (defaults to UTC now).
        desired_retention: Target probability of recall (default: 0.90 = 90%).
        weights: FSRS parameter weights tuple.

    Returns:
        FSRSState: Updated card state with new stability, difficulty, interval, and due date.
    """
    if rating not in (1, 2, 3, 4):
        raise ValueError(f"Invalid rating: {rating}. Must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy).")

    if now is None:
        now = datetime.now(timezone.utc)

    # First review of this card (New -> Learning / Review)
    if current.reps == 0 or current.stability <= 0.0:
        new_d = initial_difficulty(rating, weights)
        new_s = initial_stability(rating, weights)
        new_interval = calculate_interval(new_s, desired_retention)
        
        if rating == 1:
            new_state = "learning"
            new_lapses = current.lapses + 1
            new_reps = 0
        elif rating == 4:
            new_state = "mature" if new_interval >= MATURE_INTERVAL_THRESHOLD_DAYS else "review"
            new_lapses = current.lapses
            new_reps = 1
        else:
            new_state = "review"
            new_lapses = current.lapses
            new_reps = 1

        due_date = now + timedelta(days=new_interval)
        return FSRSState(
            state=new_state,
            reps=new_reps,
            lapses=new_lapses,
            stability=new_s,
            difficulty=new_d,
            interval_days=new_interval,
            due_date=due_date,
            last_reviewed=now,
            retrievability=1.0,
        )

    # Subsequent review
    elapsed_days = 0.0
    if current.last_reviewed is not None:
        last_rev = current.last_reviewed
        now_cmp = now
        if last_rev.tzinfo is None and now_cmp.tzinfo is not None:
            last_rev = last_rev.replace(tzinfo=timezone.utc)
        elif last_rev.tzinfo is not None and now_cmp.tzinfo is None:
            now_cmp = now_cmp.replace(tzinfo=timezone.utc)
        elapsed_days = max(0.0, (now_cmp - last_rev).total_seconds() / 86400.0)
    else:
        elapsed_days = float(current.interval_days)

    current_r = calculate_retrievability(current.stability, elapsed_days)
    new_d = next_difficulty(current.difficulty, rating, weights)

    if rating == 1:  # Again (Forgot)
        new_s = next_stability_forget(current.stability, new_d, current_r, weights)
        new_interval = 1
        new_lapses = current.lapses + 1
        new_reps = 0
        new_state = "relearning" if current.state in ("review", "mature") else "learning"
    else:  # Hard (2), Good (3), Easy (4)
        new_s = next_stability_recall(current.stability, new_d, current_r, rating, weights)
        new_interval = calculate_interval(new_s, desired_retention)
        # Ensure interval strictly advances on Good and Easy
        if rating >= 3:
            new_interval = max(current.interval_days + 1, new_interval)
        else:
            new_interval = max(1, new_interval)
        
        new_lapses = current.lapses
        new_reps = current.reps + 1
        new_state = "mature" if new_interval >= MATURE_INTERVAL_THRESHOLD_DAYS else "review"

    due_date = now + timedelta(days=new_interval)

    return FSRSState(
        state=new_state,
        reps=new_reps,
        lapses=new_lapses,
        stability=new_s,
        difficulty=new_d,
        interval_days=new_interval,
        due_date=due_date,
        last_reviewed=now,
        retrievability=current_r,
    )
