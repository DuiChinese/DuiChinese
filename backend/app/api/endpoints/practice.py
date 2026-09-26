from datetime import datetime, timezone, timedelta
from typing import List
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.character import Character
from app.models.user_srs import UserCardSRS, UserReview, UserProfile
from app.core.auth import get_current_user_id
from app.core.anki_srs import (
    AnkiSRSState,
    calculate_anki_next_review,
)
from app.core.fsrs import (
    FSRSState,
    calculate_fsrs_next_review,
    MATURE_INTERVAL_THRESHOLD_DAYS,
)
from app.schemas.character import (
    FlashcardReviewCreate,
    FlashcardReviewResponse,
    StatsResponse,
    CharacterResponse,
    CategoryCharacterItem,
    CategoryDistribution,
    PrelearnRequest,
)

router = APIRouter(prefix="/practice", tags=["Practice & Flashcards"])
study_router = APIRouter(prefix="/study", tags=["Study Session"])
cards_router = APIRouter(prefix="/cards", tags=["Cards"])


def ensure_user_srs_initialized(user_id: str, db: Session) -> None:
    """
    Guarantees that a student has records in user_card_srs.
    If empty, initializes all 243 characters with the first 7 unlocked.
    """
    has_cards = db.query(UserCardSRS.id).filter(UserCardSRS.user_id == user_id).first()
    if has_cards:
        return

    all_chars = db.query(Character).order_by(Character.order_index.asc(), Character.id.asc()).all()
    records = []
    for idx, char in enumerate(all_chars, 1):
        records.append(
            UserCardSRS(
                user_id=user_id,
                character_id=char.id,
                state="new",
                fsrs_state=0,
                reps=0,
                lapses=0,
                ease_factor=2.50,
                interval_days=0,
                stability=0.0,
                difficulty=0.0,
                is_unlocked=False,
                due_date=None,
            )
        )
    if records:
        db.bulk_save_objects(records)
        db.commit()


@study_router.post("/review", response_model=FlashcardReviewResponse)
@router.post("/review", response_model=FlashcardReviewResponse)
def record_review(
    payload: FlashcardReviewCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Record authenticated user flashcard interaction and calculate next schedule using Anki SM-2 & FSRS v4.5.
    Rating: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy).
    """
    if payload.rating not in (1, 2, 3, 4):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 4")

    char = db.query(Character).filter(Character.id == payload.character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    ensure_user_srs_initialized(user_id, db)

    # Fetch user card SRS
    card_srs = (
        db.query(UserCardSRS)
        .filter(UserCardSRS.user_id == user_id, UserCardSRS.character_id == payload.character_id)
        .first()
    )
    if not card_srs:
        card_srs = UserCardSRS(
            user_id=user_id,
            character_id=payload.character_id,
            state="new",
            fsrs_state=0,
            reps=0,
            lapses=0,
            ease_factor=2.50,
            interval_days=0,
            scheduled_days=0,
            elapsed_days=0,
            stability=0.0,
            difficulty=0.0,
            is_unlocked=True,
            due_date=None,
            last_reviewed=None,
        )
        db.add(card_srs)
        db.flush()

    current_anki_state = AnkiSRSState(
        state=card_srs.state or "new",
        reps=card_srs.reps or 0,
        lapses=card_srs.lapses or 0,
        ease_factor=card_srs.ease_factor or 2.50,
        interval_days=card_srs.interval_days or 0,
        due_date=card_srs.due_date,
        last_reviewed=card_srs.last_reviewed,
    )

    now = datetime.now(timezone.utc)
    updated_anki = calculate_anki_next_review(current_anki_state, payload.rating, now=now)

    current_fsrs_state = FSRSState(
        state=card_srs.state or "new",
        fsrs_state=card_srs.fsrs_state or 0,
        reps=card_srs.reps or 0,
        lapses=card_srs.lapses or 0,
        stability=card_srs.stability or 0.0,
        difficulty=card_srs.difficulty or 0.0,
        interval_days=card_srs.interval_days or 0,
        scheduled_days=card_srs.scheduled_days or 0,
        elapsed_days=card_srs.elapsed_days or 0,
        due_date=card_srs.due_date,
        last_reviewed=card_srs.last_reviewed,
    )
    updated_fsrs = calculate_fsrs_next_review(current_fsrs_state, payload.rating, now=now)

    # Update UserCardSRS with Anki SM-2 and FSRS stats
    card_srs.state = updated_anki.state
    card_srs.fsrs_state = updated_fsrs.fsrs_state
    card_srs.reps = updated_anki.reps
    card_srs.lapses = updated_anki.lapses
    card_srs.ease_factor = updated_anki.ease_factor
    card_srs.interval_days = updated_anki.interval_days
    card_srs.scheduled_days = updated_fsrs.scheduled_days
    card_srs.elapsed_days = updated_fsrs.elapsed_days
    card_srs.due_date = updated_anki.due_date
    card_srs.last_reviewed = updated_anki.last_reviewed
    card_srs.stability = updated_fsrs.stability
    card_srs.difficulty = updated_fsrs.difficulty
    card_srs.is_unlocked = True

    status = "mastered" if updated_anki.state == "mastered" or (updated_anki.interval_days >= 14 and updated_anki.reps >= 3) else "learning"

    review = UserReview(
        user_id=user_id,
        character_id=payload.character_id,
        rating=payload.rating,
        status=status,
    )
    db.add(review)

    # Update or initialize UserProfile streak
    today = now.date()
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(
            user_id=user_id,
            current_streak=1,
            last_study_date=today,
        )
        db.add(profile)
    else:
        if profile.last_study_date is None:
            profile.current_streak = 1
            profile.last_study_date = today
        elif profile.last_study_date == today:
            pass
        elif (today - profile.last_study_date).days == 1:
            profile.current_streak = (profile.current_streak or 0) + 1
            profile.last_study_date = today
        else:
            profile.current_streak = 1
            profile.last_study_date = today

    db.commit()
    db.refresh(review)

    return FlashcardReviewResponse(
        id=review.id,
        character_id=review.character_id,
        status=status,
        rating=review.rating,
        state=card_srs.fsrs_state or 0,
        interval_days=card_srs.interval_days,
        scheduled_days=card_srs.scheduled_days or card_srs.interval_days,
        elapsed_days=card_srs.elapsed_days or 0,
        ease_factor=card_srs.ease_factor,
        stability=card_srs.stability or 0.0,
        difficulty=card_srs.difficulty or 0.0,
        reps=card_srs.reps,
        lapses=card_srs.lapses,
        due_date=card_srs.due_date,
    )


@study_router.get("/session", response_model=List[CharacterResponse])
@router.get("/session", response_model=List[CharacterResponse])
def get_study_session(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Get official daily study queue according to Section 3:
    1. Due review cards: state > 0 (or reps > 0) and due <= now.
    2. Batch of new cards: state == 0 (or reps == 0), limited to daily_new_cards (default: 10).
    3. Merged and shuffled via Fisher-Yates algorithm.
    """
    ensure_user_srs_initialized(user_id, db)
    now = datetime.now(timezone.utc)

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    daily_new_limit = profile.daily_new_cards if profile and profile.daily_new_cards else 10

    # 1. Due review cards
    due_srs = (
        db.query(UserCardSRS)
        .filter(
            UserCardSRS.user_id == user_id,
            (UserCardSRS.reps > 0) | (UserCardSRS.state.in_(["learning", "relearning", "review", "mature"])) | (UserCardSRS.fsrs_state.in_([1, 2, 3])),
            UserCardSRS.due_date <= now,
        )
        .order_by(UserCardSRS.due_date.asc().nullsfirst())
        .all()
    )
    due_ids = [s.character_id for s in due_srs]

    # 2. Batch of new cards
    new_srs = (
        db.query(UserCardSRS)
        .filter(
            UserCardSRS.user_id == user_id,
            UserCardSRS.reps == 0,
            (UserCardSRS.fsrs_state == 0) | (UserCardSRS.fsrs_state.is_(None)),
            ~UserCardSRS.character_id.in_(due_ids),
        )
        .order_by(UserCardSRS.character_id.asc())
        .limit(daily_new_limit)
        .all()
    )
    new_ids = [s.character_id for s in new_srs]

    # Combine due + new
    combined_ids = due_ids + new_ids

    # Fisher-Yates shuffle
    for i in range(len(combined_ids) - 1, 0, -1):
        j = random.randint(0, i)
        combined_ids[i], combined_ids[j] = combined_ids[j], combined_ids[i]

    if not combined_ids:
        return []

    chars_map = {c.id: c for c in db.query(Character).filter(Character.id.in_(combined_ids)).all()}
    return [
        CharacterResponse(
            id=chars_map[cid].id,
            hanzi=chars_map[cid].hanzi,
            pinyin=chars_map[cid].pinyin,
            pinyin_clean=chars_map[cid].pinyin_clean,
            tone=chars_map[cid].tone,
            meaning=chars_map[cid].meaning,
            radical=chars_map[cid].radical,
            stroke_count=chars_map[cid].stroke_count,
            hsk_level=chars_map[cid].hsk_level,
            order_index=chars_map[cid].order_index or chars_map[cid].id,
            mnemonic=chars_map[cid].mnemonic,
            examples=chars_map[cid].examples or [],
            is_unlocked=True,
        )
        for cid in combined_ids
        if cid in chars_map
    ]


@cards_router.post("/prelearn")
@router.post("/prelearn")
def prelearn_cards(
    payload: PrelearnRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Onboarding pre-learned Hanzi selection (Section 5):
    Sets selected characters directly as mature (state=2, stability=21.0, difficulty=5.0,
    scheduled_days=21..35, due=now+scheduled_days, reps=1, lapses=0).
    """
    ensure_user_srs_initialized(user_id, db)
    now = datetime.now(timezone.utc)
    updated_count = 0

    for char_id in payload.character_ids:
        card = (
            db.query(UserCardSRS)
            .filter(UserCardSRS.user_id == user_id, UserCardSRS.character_id == char_id)
            .first()
        )
        scheduled = random.randint(21, 35)
        due_date = now + timedelta(days=scheduled)

        if not card:
            card = UserCardSRS(
                user_id=user_id,
                character_id=char_id,
                state="mature",
                fsrs_state=2,
                is_unlocked=True,
                reps=1,
                lapses=0,
                ease_factor=2.50,
                interval_days=scheduled,
                scheduled_days=scheduled,
                elapsed_days=0,
                due_date=due_date,
                last_reviewed=now,
                stability=21.0,
                difficulty=5.0,
            )
            db.add(card)
        else:
            card.state = "mature"
            card.fsrs_state = 2
            card.is_unlocked = True
            card.reps = max(1, card.reps)
            card.interval_days = scheduled
            card.scheduled_days = scheduled
            card.due_date = due_date
            card.last_reviewed = now
            card.stability = 21.0
            card.difficulty = 5.0
        updated_count += 1

    db.commit()
    return {"ok": True, "prelearned_count": updated_count}


@router.get("/due", response_model=List[CharacterResponse])
def get_due_characters(
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Get unlocked cards due for review according to Anki SRS for the authenticated user:
    1. Cards that were difficult or lapsed before (relearning/learning or lapses > 0 or due_date <= now).
    2. New unlocked words of the day (reps == 0).
    """
    ensure_user_srs_initialized(user_id, db)
    now = datetime.now(timezone.utc)

    # 1. Cards that are unlocked AND due or were difficult before
    difficult_due_srs = (
        db.query(UserCardSRS)
        .filter(
            UserCardSRS.user_id == user_id,
            UserCardSRS.is_unlocked == True,
            (UserCardSRS.due_date <= now)
            | (UserCardSRS.state.in_(["learning", "relearning"]))
            | (UserCardSRS.lapses > 0),
        )
        .order_by(UserCardSRS.due_date.asc().nullsfirst(), UserCardSRS.lapses.desc())
        .limit(limit)
        .all()
    )

    due_char_ids = [s.character_id for s in difficult_due_srs]
    characters_due = []
    if due_char_ids:
        chars_map = {c.id: c for c in db.query(Character).filter(Character.id.in_(due_char_ids)).all()}
        characters_due = [chars_map[cid] for cid in due_char_ids if cid in chars_map]

    # 2. Unstudied (new) cards of the day (reps == 0)
    if len(characters_due) < limit:
        remaining = limit - len(characters_due)
        unstudied_srs = (
            db.query(UserCardSRS)
            .filter(
                UserCardSRS.user_id == user_id,
                UserCardSRS.reps == 0,
                (UserCardSRS.fsrs_state == 0) | (UserCardSRS.fsrs_state.is_(None)),
                ~UserCardSRS.character_id.in_(due_char_ids),
            )
            .order_by(UserCardSRS.character_id.asc())
            .limit(remaining)
            .all()
        )

        unstudied_ids = [s.character_id for s in unstudied_srs]
        if unstudied_ids:
            chars_map = {c.id: c for c in db.query(Character).filter(Character.id.in_(unstudied_ids)).all()}
            characters_due.extend([chars_map[cid] for cid in unstudied_ids if cid in chars_map])

    return [
        CharacterResponse(
            id=c.id,
            hanzi=c.hanzi,
            pinyin=c.pinyin,
            pinyin_clean=c.pinyin_clean,
            tone=c.tone,
            meaning=c.meaning,
            radical=c.radical,
            stroke_count=c.stroke_count,
            hsk_level=c.hsk_level,
            order_index=c.order_index or c.id,
            mnemonic=c.mnemonic,
            examples=c.examples or [],
            is_unlocked=True,
        )
        for c in characters_due
    ]


@router.get("/ahead", response_model=List[CharacterResponse])
def get_practice_ahead_characters(
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Get already unlocked cards for extra review practice ('Seguir repasando') for user.
    """
    ensure_user_srs_initialized(user_id, db)
    unlocked_srs = (
        db.query(UserCardSRS)
        .filter(UserCardSRS.user_id == user_id, UserCardSRS.is_unlocked == True)
        .order_by(UserCardSRS.last_reviewed.asc().nullsfirst())
        .limit(limit)
        .all()
    )
    unlocked_ids = [s.character_id for s in unlocked_srs]
    if not unlocked_ids:
        return []
    chars_map = {c.id: c for c in db.query(Character).filter(Character.id.in_(unlocked_ids)).all()}
    return [
        CharacterResponse(
            id=c.id,
            hanzi=c.hanzi,
            pinyin=c.pinyin,
            pinyin_clean=c.pinyin_clean,
            tone=c.tone,
            meaning=c.meaning,
            radical=c.radical,
            stroke_count=c.stroke_count,
            hsk_level=c.hsk_level,
            order_index=c.order_index or c.id,
            mnemonic=c.mnemonic,
            examples=c.examples or [],
            is_unlocked=True,
        )
        for cid in unlocked_ids if cid in chars_map for c in [chars_map[cid]]
    ]


def format_ui_interval(state: int, scheduled_days: int) -> str:
    if state == 0:
        return "New"
    if state in (1, 3) or scheduled_days < 1:
        return "< 1d"
    if scheduled_days < 30:
        return f"{int(round(scheduled_days))}d"
    if scheduled_days < 365:
        m = round(scheduled_days / 30.0, 1)
        m_str = f"{m:.1f}"
        return f"{m_str[:-2] if m_str.endswith('.0') else m_str}m"
    y = round(scheduled_days / 365.0, 1)
    y_str = f"{y:.1f}"
    return f"{y_str[:-2] if y_str.endswith('.0') else y_str}y"


@study_router.get("/stats", response_model=StatsResponse)
@router.get("/stats", response_model=StatsResponse)
def get_practice_stats(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Get aggregated study statistics with official FSRS / Anki card breakdown for authenticated user.
    """
    ensure_user_srs_initialized(user_id, db)
    total_reviews = db.query(UserReview).filter(UserReview.user_id == user_id).count()

    now = datetime.now(timezone.utc)

    all_characters = db.query(Character).all()
    all_srs = {s.character_id: s for s in db.query(UserCardSRS).filter(UserCardSRS.user_id == user_id).all()}

    cat_new = []
    cat_learning = []
    cat_young = []
    cat_mature = []

    for char in all_characters:
        srs = all_srs.get(char.id)
        if not srs:
            continue
        is_card_unlocked = bool(
            (srs.fsrs_state is not None and srs.fsrs_state != 0)
            or (srs.reps and srs.reps > 0)
            or (srs.stability and srs.stability > 0)
        )
        if not is_card_unlocked:
            continue

        scheduled = srs.scheduled_days or srs.interval_days or 0
        fsrs_st = srs.fsrs_state if srs.fsrs_state is not None else (0 if srs.reps == 0 else 2)

        # Classification per Section 6:
        # NEW: state == 0 (Never reviewed)
        # LEARNING: state == 1 or state == 3 (In learning / relearning)
        # YOUNG: state == 2 and scheduled_days < 21
        # MATURE: state == 2 and scheduled_days >= 21
        if fsrs_st == 0 and srs.reps == 0:
            category = "new"
            actual_state = 0
        elif fsrs_st in (1, 3) or srs.state in ("learning", "relearning"):
            category = "learning"
            actual_state = 1 if fsrs_st == 1 else 3
        elif scheduled >= MATURE_INTERVAL_THRESHOLD_DAYS or srs.state == "mature":
            category = "mature"
            actual_state = 2
        else:
            category = "young"
            actual_state = 2

        formatted_ivl = format_ui_interval(actual_state, scheduled)

        item = CategoryCharacterItem(
            id=char.id,
            hanzi=char.hanzi,
            pinyin=char.pinyin,
            meaning=char.meaning,
            tone=char.tone,
            state=actual_state,
            interval_days=srs.interval_days if srs else 0,
            scheduled_days=scheduled,
            stability=srs.stability if srs else 0.0,
            difficulty=srs.difficulty if srs else 0.0,
            formatted_interval=formatted_ivl,
        )

        if category == "new":
            cat_new.append(item)
        elif category == "learning":
            cat_learning.append(item)
        elif category == "mature":
            cat_mature.append(item)
        else:
            cat_young.append(item)

    new_count = len(cat_new)
    learning_count = len(cat_learning)
    young_count = len(cat_young)
    mature_count = len(cat_mature)
    total_unlocked = new_count + learning_count + young_count + mature_count

    due_today_count = (
        db.query(UserCardSRS)
        .filter(
            UserCardSRS.user_id == user_id,
            UserCardSRS.is_unlocked == True,
            UserCardSRS.due_date <= now,
        )
        .count()
    )

    avg_ease = (
        db.query(func.avg(UserCardSRS.ease_factor))
        .filter(UserCardSRS.user_id == user_id, UserCardSRS.is_unlocked == True)
        .scalar()
        or 2.50
    )
    avg_ease = round(float(avg_ease), 2)

    avg_stability = (
        db.query(func.avg(UserCardSRS.stability))
        .filter(UserCardSRS.user_id == user_id, UserCardSRS.is_unlocked == True, UserCardSRS.stability > 0)
        .scalar()
        or 0.0
    )
    avg_stability = round(float(avg_stability), 1)

    avg_difficulty = (
        db.query(func.avg(UserCardSRS.difficulty))
        .filter(UserCardSRS.user_id == user_id, UserCardSRS.is_unlocked == True, UserCardSRS.difficulty > 0)
        .scalar()
        or 0.0
    )
    avg_difficulty = round(float(avg_difficulty), 1)

    successful_reviews = (
        db.query(UserReview)
        .filter(UserReview.user_id == user_id, UserReview.rating >= 3)
        .count()
    )
    retention_rate = (
        round((successful_reviews / total_reviews * 100), 1) if total_reviews > 0 else 0.0
    )

    streak = 0
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if profile:
        today = datetime.now(timezone.utc).date()
        if profile.last_study_date:
            days_diff = (today - profile.last_study_date).days
            if days_diff <= 1:
                streak = profile.current_streak or 0
            else:
                streak = 0
        else:
            streak = profile.current_streak or 0
    elif total_reviews > 0:
        streak = 1

    return StatsResponse(
        total_characters=total_unlocked,
        total_reviews=total_reviews,
        new_count=new_count,
        learning_count=learning_count,
        young_count=young_count,
        mature_count=mature_count,
        mastered_count=mature_count,
        due_today_count=due_today_count,
        current_streak=streak,
        average_ease_factor=avg_ease,
        average_stability=avg_stability,
        average_difficulty=avg_difficulty,
        retention_rate=retention_rate,
        categories=CategoryDistribution(
            new=cat_new,
            learning=cat_learning,
            young=cat_young,
            mature=cat_mature,
        ),
    )


@router.post("/reset")
def reset_user_progress(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Resets the authenticated user's study progress:
    - Deletes all review history in UserReview for this user.
    - Deletes all card SRS records in UserCardSRS for this user.
    - Resets UserProfile streak counters and last study date if profile exists.
    - Re-initializes all characters with the initial 7 unlocked at Day 1.
    """
    # 1. Delete user reviews
    db.query(UserReview).filter(UserReview.user_id == user_id).delete(synchronize_session=False)

    # 2. Delete user card SRS
    db.query(UserCardSRS).filter(UserCardSRS.user_id == user_id).delete(synchronize_session=False)

    # 3. Reset UserProfile if present
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if user_profile:
        user_profile.current_streak = 0
        user_profile.last_study_date = None

    db.commit()

    # 4. Re-initialize SRS with first 7 characters unlocked
    ensure_user_srs_initialized(user_id, db)

    return {"ok": True, "message": "User progress reset successfully"}

