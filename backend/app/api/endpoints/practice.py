from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.character import Character
from app.models.review import FlashcardReview
from app.models.srs import CardSRS
from app.core.anki_srs import AnkiSRSState, calculate_anki_next_review
from app.schemas.character import (
    FlashcardReviewCreate,
    FlashcardReviewResponse,
    StatsResponse,
    CharacterResponse
)

router = APIRouter(prefix="/practice", tags=["Practice & Flashcards"])


@router.post("/review", response_model=FlashcardReviewResponse)
def record_review(payload: FlashcardReviewCreate, db: Session = Depends(get_db)):
    """
    Record user flashcard interaction and calculate next schedule using Anki SM-2.
    Rating: 1 (Again), 2 (Hard), 3 (Medium / Good), 4 (Easy).
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
            due_date=None,
            last_reviewed=None
        )
        db.add(card_srs)
        db.flush()

    current_state = AnkiSRSState(
        state=card_srs.state,
        reps=card_srs.reps,
        lapses=card_srs.lapses,
        ease_factor=card_srs.ease_factor,
        interval_days=card_srs.interval_days,
        due_date=card_srs.due_date,
        last_reviewed=card_srs.last_reviewed,
    )

    now = datetime.now(timezone.utc)
    updated_state = calculate_anki_next_review(current_state, payload.rating, now=now)

    # Update CardSRS
    card_srs.state = updated_state.state
    card_srs.reps = updated_state.reps
    card_srs.lapses = updated_state.lapses
    card_srs.ease_factor = updated_state.ease_factor
    card_srs.interval_days = updated_state.interval_days
    card_srs.due_date = updated_state.due_date
    card_srs.last_reviewed = updated_state.last_reviewed

    # Determine high-level status for backwards compatibility (mastered if rating >= 3)
    status = "mastered" if payload.rating >= 3 else "learning"

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
        reps=card_srs.reps,
        lapses=card_srs.lapses,
        due_date=card_srs.due_date,
    )


@router.get("/due", response_model=List[CharacterResponse])
def get_due_characters(limit: int = 20, db: Session = Depends(get_db)):
    """
    Get characters due for review according to Anki SRS.
    Includes overdue/due cards first, then unstudied (new) cards.
    """
    now = datetime.now(timezone.utc)

    # 1. Cards that are due or overdue
    due_srs = db.query(CardSRS).filter(
        CardSRS.due_date <= now
    ).order_by(CardSRS.due_date.asc()).limit(limit).all()

    due_char_ids = [s.character_id for s in due_srs]
    characters_due = []
    if due_char_ids:
        chars_map = {c.id: c for c in db.query(Character).filter(Character.id.in_(due_char_ids)).all()}
        characters_due = [chars_map[cid] for cid in due_char_ids if cid in chars_map]

    # If we haven't reached limit, add characters that haven't been studied yet (new)
    if len(characters_due) < limit:
        studied_ids = [s[0] for s in db.query(CardSRS.character_id).all()]
        remaining = limit - len(characters_due)
        query = db.query(Character)
        if studied_ids:
            query = query.filter(~Character.id.in_(studied_ids))
        new_chars = query.limit(remaining).all()
        characters_due.extend(new_chars)

    # If still empty (all reviewed and none due), return all characters
    if not characters_due:
        characters_due = db.query(Character).limit(limit).all()

    return characters_due


@router.get("/stats", response_model=StatsResponse)
def get_practice_stats(db: Session = Depends(get_db)):
    """Get aggregated study and Anki SRS statistics."""
    total_characters = db.query(Character).count()
    total_reviews = db.query(FlashcardReview).count()

    mastered_count = db.query(FlashcardReview.character_id).filter(
        FlashcardReview.status == "mastered"
    ).distinct().count()

    learning_count = db.query(FlashcardReview.character_id).filter(
        FlashcardReview.status == "learning"
    ).distinct().count()

    now = datetime.now(timezone.utc)
    due_today_count = db.query(CardSRS).filter(
        CardSRS.due_date <= now
    ).count()

    avg_ease = db.query(func.avg(CardSRS.ease_factor)).scalar() or 2.5
    avg_ease = round(float(avg_ease), 2)

    # Retention rate (% of reviews rated 3 or 4)
    successful_reviews = db.query(FlashcardReview).filter(FlashcardReview.rating >= 3).count()
    retention_rate = round((successful_reviews / total_reviews * 100), 1) if total_reviews > 0 else 100.0

    return StatsResponse(
        total_characters=total_characters,
        total_reviews=total_reviews,
        mastered_count=mastered_count,
        learning_count=learning_count,
        due_today_count=due_today_count,
        average_ease_factor=avg_ease,
        retention_rate=retention_rate,
    )
