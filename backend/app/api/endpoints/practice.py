from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.character import Character
from app.models.review import FlashcardReview
from app.models.srs import CardSRS
from app.core.anki_srs import (
    AnkiSRSState,
    calculate_anki_next_review,
)
from app.core.fsrs import (
    FSRSState,
    calculate_fsrs_next_review,
    calculate_retrievability,
    MATURE_INTERVAL_THRESHOLD_DAYS,
)
from app.schemas.character import (
    FlashcardReviewCreate,
    FlashcardReviewResponse,
    StatsResponse,
    CharacterResponse,
    CategoryCharacterItem,
    CategoryDistribution,
)

router = APIRouter(prefix="/practice", tags=["Practice & Flashcards"])


@router.post("/review", response_model=FlashcardReviewResponse)
def record_review(payload: FlashcardReviewCreate, db: Session = Depends(get_db)):
    """
    Record user flashcard interaction and calculate next schedule using Anki SM-2.
    Rating: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy).
    """
    if payload.rating not in (1, 2, 3, 4):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 4")

    char = db.query(Character).filter(Character.id == payload.character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    # Fetch existing CardSRS or create initial one
    card_srs = db.query(CardSRS).filter(CardSRS.character_id == payload.character_id).first()
    if not card_srs:
        card_srs = CardSRS(
            character_id=payload.character_id,
            state="new",
            reps=0,
            lapses=0,
            ease_factor=2.5,
            interval_days=0,
            stability=0.0,
            difficulty=0.0,
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
        reps=card_srs.reps or 0,
        lapses=card_srs.lapses or 0,
        stability=card_srs.stability or 0.0,
        difficulty=card_srs.difficulty or 0.0,
        interval_days=card_srs.interval_days or 0,
        due_date=card_srs.due_date,
        last_reviewed=card_srs.last_reviewed,
    )
    updated_fsrs = calculate_fsrs_next_review(current_fsrs_state, payload.rating, now=now)

    # Update CardSRS with Anki SM-2 parameters and FSRS stats
    card_srs.state = updated_anki.state
    card_srs.reps = updated_anki.reps
    card_srs.lapses = updated_anki.lapses
    card_srs.ease_factor = updated_anki.ease_factor
    card_srs.interval_days = updated_anki.interval_days
    card_srs.due_date = updated_anki.due_date
    card_srs.last_reviewed = updated_anki.last_reviewed
    card_srs.stability = updated_fsrs.stability
    card_srs.difficulty = updated_fsrs.difficulty

    status = "mastered" if updated_anki.state == "mastered" or (updated_anki.interval_days >= 14 and updated_anki.reps >= 3) else "learning"

    review = FlashcardReview(
        character_id=payload.character_id,
        rating=payload.rating,
        status=status,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return FlashcardReviewResponse(
        id=review.id,
        character_id=review.character_id,
        status=status,
        rating=review.rating,
        interval_days=card_srs.interval_days,
        ease_factor=card_srs.ease_factor,
        stability=card_srs.stability or 0.0,
        difficulty=card_srs.difficulty or 0.0,
        reps=card_srs.reps,
        lapses=card_srs.lapses,
        due_date=card_srs.due_date,
    )


@router.get("/due", response_model=List[CharacterResponse])
def get_due_characters(limit: int = 20, db: Session = Depends(get_db)):
    """
    Get unlocked cards due for review according to Anki SRS:
    1. Cards that were difficult or lapsed before (relearning/learning or lapses > 0 or due_date <= now).
    2. New unlocked words of the day (reps == 0).
    If all reviews and new words are graduated for today, returns empty list [].
    """
    now = datetime.now(timezone.utc)

    # 1. Cards that are unlocked AND due or were difficult before
    difficult_due_srs = db.query(CardSRS).filter(
        CardSRS.is_unlocked == 1,
        (CardSRS.due_date <= now) | (CardSRS.state.in_(["learning", "relearning"])) | (CardSRS.lapses > 0)
    ).order_by(
        CardSRS.due_date.asc().nullsfirst(),
        CardSRS.lapses.desc()
    ).limit(limit).all()

    due_char_ids = [s.character_id for s in difficult_due_srs]
    characters_due = []
    if due_char_ids:
        chars_map = {c.id: c for c in db.query(Character).filter(Character.id.in_(due_char_ids)).all()}
        characters_due = [chars_map[cid] for cid in due_char_ids if cid in chars_map]

    # 2. Unstudied (new) UNLOCKED cards of the day (reps == 0)
    if len(characters_due) < limit:
        remaining = limit - len(characters_due)
        unstudied_unlocked_srs = db.query(CardSRS).filter(
            CardSRS.is_unlocked == 1,
            CardSRS.reps == 0,
            ~CardSRS.character_id.in_(due_char_ids)
        ).limit(remaining).all()

        unstudied_ids = [s.character_id for s in unstudied_unlocked_srs]
        if unstudied_ids:
            chars_map = {c.id: c for c in db.query(Character).filter(Character.id.in_(unstudied_ids)).all()}
            characters_due.extend([chars_map[cid] for cid in unstudied_ids if cid in chars_map])

    # Convert to CharacterResponse with is_unlocked=True
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
def get_practice_ahead_characters(limit: int = 20, db: Session = Depends(get_db)):
    """
    Get already unlocked cards for extra review practice ('Seguir repasando').
    """
    unlocked_srs = db.query(CardSRS).filter(CardSRS.is_unlocked == 1).order_by(CardSRS.last_reviewed.asc().nullsfirst()).limit(limit).all()
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



@router.get("/stats", response_model=StatsResponse)
def get_practice_stats(db: Session = Depends(get_db)):
    """
    Get aggregated study statistics with official Anki card breakdown:
    - New: Never studied cards.
    - Learning: Cards in learning or relearning steps.
    - Young: Review cards with interval < 21 days.
    - Mature: Long-term cards with interval >= 21 days.
    Plus FSRS average stability and difficulty.
    """
    total_characters = db.query(Character).count()
    total_reviews = db.query(FlashcardReview).count()

    now = datetime.now(timezone.utc)

    # Build character distributions for each category
    all_characters = db.query(Character).all()
    all_srs = {s.character_id: s for s in db.query(CardSRS).all()}

    cat_new = []
    cat_learning = []
    cat_young = []
    cat_mature = []

    for char in all_characters:
        srs = all_srs.get(char.id)
        # Locked characters must not be counted until unlocked
        if not srs or not srs.is_unlocked:
            continue

        if srs.reps == 0 and srs.state == "new":
            cat_new.append(
                CategoryCharacterItem(
                    id=char.id,
                    hanzi=char.hanzi,
                    pinyin=char.pinyin,
                    meaning=char.meaning,
                    tone=char.tone,
                    interval_days=srs.interval_days if srs else 0,
                    stability=srs.stability if srs else 0.0,
                    difficulty=srs.difficulty if srs else 0.0,
                )
            )
        elif srs.state in ("learning", "relearning"):
            cat_learning.append(
                CategoryCharacterItem(
                    id=char.id,
                    hanzi=char.hanzi,
                    pinyin=char.pinyin,
                    meaning=char.meaning,
                    tone=char.tone,
                    interval_days=srs.interval_days,
                    stability=srs.stability,
                    difficulty=srs.difficulty,
                )
            )
        elif srs.interval_days >= MATURE_INTERVAL_THRESHOLD_DAYS:
            cat_mature.append(
                CategoryCharacterItem(
                    id=char.id,
                    hanzi=char.hanzi,
                    pinyin=char.pinyin,
                    meaning=char.meaning,
                    tone=char.tone,
                    interval_days=srs.interval_days,
                    stability=srs.stability,
                    difficulty=srs.difficulty,
                )
            )
        else:
            cat_young.append(
                CategoryCharacterItem(
                    id=char.id,
                    hanzi=char.hanzi,
                    pinyin=char.pinyin,
                    meaning=char.meaning,
                    tone=char.tone,
                    interval_days=srs.interval_days,
                    stability=srs.stability,
                    difficulty=srs.difficulty,
                )
            )

    new_count = len(cat_new)
    learning_count = len(cat_learning)
    young_count = len(cat_young)
    mature_count = len(cat_mature)
    total_unlocked = new_count + learning_count + young_count + mature_count

    # Due today count (only unlocked cards)
    due_today_count = db.query(CardSRS).filter(
        CardSRS.is_unlocked == 1,
        CardSRS.due_date <= now
    ).count()

    # Average ease factor (only unlocked)
    avg_ease = db.query(func.avg(CardSRS.ease_factor)).filter(CardSRS.is_unlocked == 1).scalar() or 2.5
    avg_ease = round(float(avg_ease), 2)

    # Average FSRS stability (in days, only unlocked)
    avg_stability = db.query(func.avg(CardSRS.stability)).filter(CardSRS.is_unlocked == 1, CardSRS.stability > 0).scalar() or 0.0
    avg_stability = round(float(avg_stability), 1)

    # Average FSRS difficulty (scale 1 - 10, only unlocked)
    avg_difficulty = db.query(func.avg(CardSRS.difficulty)).filter(CardSRS.is_unlocked == 1, CardSRS.difficulty > 0).scalar() or 0.0
    avg_difficulty = round(float(avg_difficulty), 1)

    # Retention rate (% of reviews rated 3 or 4)
    successful_reviews = db.query(FlashcardReview).filter(FlashcardReview.rating >= 3).count()
    retention_rate = round((successful_reviews / total_reviews * 100), 1) if total_reviews > 0 else 100.0

    return StatsResponse(
        total_characters=total_unlocked,
        total_reviews=total_reviews,
        new_count=new_count,
        learning_count=learning_count,
        young_count=young_count,
        mature_count=mature_count,
        mastered_count=mature_count,  # Backwards compatibility
        due_today_count=due_today_count,
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
