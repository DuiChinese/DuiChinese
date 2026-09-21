from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.db.session import get_db
from app.models.character import Character
from app.models.srs import CardSRS
from app.schemas.character import CharacterResponse

router = APIRouter(prefix="/characters", tags=["Characters"])


def _to_character_response(char: Character, db: Session) -> CharacterResponse:
    srs = db.query(CardSRS).filter(CardSRS.character_id == char.id).first()
    is_unlocked = bool(srs.is_unlocked) if srs else False
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
        for s in db.query(CardSRS).filter(CardSRS.character_id.in_(char_ids)).all():
            srs_map[s.character_id] = bool(s.is_unlocked)

    results = []
    for c in chars:
        resp = CharacterResponse(
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
            is_unlocked=srs_map.get(c.id, False),
        )
        results.append(resp)
    return results


@router.post("/unlock-next", response_model=List[CharacterResponse])
def unlock_next_batch(count: int = Query(7, ge=1, le=30), db: Session = Depends(get_db)):
    """
    Unlock the next batch of characters (e.g. 6 or 7 characters) in pedagogical order.
    Returns the newly unlocked characters.
    """
    # Find characters whose CardSRS is either missing or is_unlocked == 0
    all_chars = db.query(Character).order_by(Character.order_index.asc(), Character.id.asc()).all()
    newly_unlocked = []

    for char in all_chars:
        if len(newly_unlocked) >= count:
            break
        srs = db.query(CardSRS).filter(CardSRS.character_id == char.id).first()
        if not srs:
            srs = CardSRS(
                character_id=char.id,
                state="new",
                reps=0,
                lapses=0,
                ease_factor=2.5,
                interval_days=0,
                is_unlocked=1
            )
            db.add(srs)
            newly_unlocked.append(char)
        elif not srs.is_unlocked:
            srs.is_unlocked = 1
            newly_unlocked.append(char)

    db.commit()
    return [_to_character_response(c, db) for c in newly_unlocked]


@router.get("/random", response_model=CharacterResponse)
def get_random_character(
    hsk: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get a random character for quick flashcard quizzes."""
    query = db.query(Character)
    if hsk is not None:
        query = query.filter(Character.hsk_level == hsk)
    
    char = query.order_by(func.random()).first()
    if not char:
        raise HTTPException(status_code=404, detail="No characters found in database")
    return _to_character_response(char, db)


@router.get("/{character_id}", response_model=CharacterResponse)
def get_character_by_id(character_id: int, db: Session = Depends(get_db)):
    """Retrieve single character details by ID."""
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail=f"Character with ID {character_id} not found")
    return _to_character_response(char, db)


