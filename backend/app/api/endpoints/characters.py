from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.db.session import get_db
from app.models.character import Character
from app.models.user_srs import UserCardSRS
from app.models.srs import CardSRS
from app.core.auth import get_current_user_id, get_optional_user_id
from app.schemas.character import CharacterResponse

router = APIRouter(prefix="/characters", tags=["Characters"])


def _to_character_response(char: Character, is_unlocked: bool = False) -> CharacterResponse:
    return CharacterResponse(
        id=char.id,
        hanzi=char.hanzi,
        pinyin=char.pinyin,
        pinyin_clean=char.pinyin_clean,
        tone=char.tone,
        meaning=char.meaning,
        radical=char.radical,
        stroke_count=char.stroke_count,
        hsk_level=char.hsk_level,
        order_index=char.order_index or char.id,
        mnemonic=char.mnemonic,
        examples=char.examples or [],
        is_unlocked=is_unlocked,
    )


@router.get("", response_model=List[CharacterResponse])
def get_characters(
    q: Optional[str] = Query(None, description="Search by Hanzi, Pinyin, or English/Spanish meaning"),
    tone: Optional[int] = Query(None, ge=1, le=5, description="Filter by tone (1-5)"),
    hsk: Optional[int] = Query(None, ge=1, le=6, description="Filter by HSK level"),
    limit: int = Query(200, ge=1, le=300),
    offset: int = Query(0, ge=0),
    user_id: Optional[str] = Depends(get_optional_user_id),
    db: Session = Depends(get_db),
):
    """Retrieve characters with optional filtering, search, and unlock status."""
    query = db.query(Character)

    if hsk is not None:
        query = query.filter(Character.hsk_level == hsk)

    if tone is not None:
        query = query.filter(Character.tone == tone)

    if q:
        search_pattern = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                Character.hanzi.like(f"%{q.strip()}%"),
                Character.pinyin.ilike(search_pattern),
                Character.pinyin_clean.ilike(search_pattern),
                Character.meaning.ilike(search_pattern),
            )
        )

    chars = query.order_by(Character.order_index.asc(), Character.id.asc()).offset(offset).limit(limit).all()
    char_ids = [c.id for c in chars]
    srs_map = {}
    if char_ids:
        if user_id:
            for s in db.query(UserCardSRS).filter(UserCardSRS.user_id == user_id, UserCardSRS.character_id.in_(char_ids)).all():
                is_unlocked = bool((s.fsrs_state is not None and s.fsrs_state != 0) or (s.reps and s.reps > 0) or (s.stability and s.stability > 0))
                srs_map[s.character_id] = is_unlocked
        else:
            for s in db.query(CardSRS).filter(CardSRS.character_id.in_(char_ids)).all():
                is_unlocked = bool((s.reps and s.reps > 0) or (s.stability and s.stability > 0) or (s.state and s.state != "new"))
                srs_map[s.character_id] = is_unlocked

    results = []
    for c in chars:
        resp = _to_character_response(c, is_unlocked=srs_map.get(c.id, False))
        results.append(resp)
    return results


@router.post("/unlock-next", response_model=List[CharacterResponse])
def unlock_next_batch(
    count: int = Query(7, ge=1, le=30),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Unlock the next batch of characters in pedagogical order for the authenticated user.
    """
    all_chars = db.query(Character).order_by(Character.order_index.asc(), Character.id.asc()).all()
    newly_unlocked = []
    now = datetime.now(timezone.utc)

    for char in all_chars:
        if len(newly_unlocked) >= count:
            break
        srs = (
            db.query(UserCardSRS)
            .filter(UserCardSRS.user_id == user_id, UserCardSRS.character_id == char.id)
            .first()
        )
        if not srs:
            srs = UserCardSRS(
                user_id=user_id,
                character_id=char.id,
                state="new",
                reps=0,
                lapses=0,
                ease_factor=2.50,
                interval_days=0,
                is_unlocked=True,
                due_date=now,
            )
            db.add(srs)
            newly_unlocked.append(char)
        elif not srs.is_unlocked:
            srs.is_unlocked = True
            srs.due_date = now
            newly_unlocked.append(char)

    db.commit()
    return [_to_character_response(c, is_unlocked=True) for c in newly_unlocked]


@router.get("/random", response_model=CharacterResponse)
def get_random_character(
    hsk: Optional[int] = Query(None),
    user_id: Optional[str] = Depends(get_optional_user_id),
    db: Session = Depends(get_db),
):
    """Get a random character for quick flashcard quizzes."""
    query = db.query(Character)
    if hsk is not None:
        query = query.filter(Character.hsk_level == hsk)

    char = query.order_by(func.random()).first()
    if not char:
        raise HTTPException(status_code=404, detail="No characters found in database")

    is_unlocked = False
    if user_id:
        srs = db.query(UserCardSRS).filter(UserCardSRS.user_id == user_id, UserCardSRS.character_id == char.id).first()
        is_unlocked = bool(srs and ((srs.fsrs_state is not None and srs.fsrs_state != 0) or (srs.reps and srs.reps > 0) or (srs.stability and srs.stability > 0)))
    else:
        srs = db.query(CardSRS).filter(CardSRS.character_id == char.id).first()
        is_unlocked = bool(srs and ((srs.reps and srs.reps > 0) or (srs.stability and srs.stability > 0) or (srs.state and srs.state != "new")))

    return _to_character_response(char, is_unlocked=is_unlocked)


@router.get("/{character_id}", response_model=CharacterResponse)
def get_character_by_id(
    character_id: int,
    user_id: Optional[str] = Depends(get_optional_user_id),
    db: Session = Depends(get_db),
):
    """Retrieve single character details by ID."""
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail=f"Character with ID {character_id} not found")

    is_unlocked = False
    if user_id:
        srs = db.query(UserCardSRS).filter(UserCardSRS.user_id == user_id, UserCardSRS.character_id == char.id).first()
        is_unlocked = bool(srs and ((srs.fsrs_state is not None and srs.fsrs_state != 0) or (srs.reps and srs.reps > 0) or (srs.stability and srs.stability > 0)))
    else:
        srs = db.query(CardSRS).filter(CardSRS.character_id == char.id).first()
        is_unlocked = bool(srs and ((srs.reps and srs.reps > 0) or (srs.stability and srs.stability > 0) or (srs.state and srs.state != "new")))

    return _to_character_response(char, is_unlocked=is_unlocked)
