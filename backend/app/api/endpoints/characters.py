from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.db.session import get_db
from app.models.character import Character
from app.schemas.character import CharacterResponse

router = APIRouter(prefix="/characters", tags=["Characters"])


@router.get("", response_model=List[CharacterResponse])
def get_characters(
    q: Optional[str] = Query(None, description="Search by Hanzi, Pinyin, or Spanish meaning"),
    tone: Optional[int] = Query(None, ge=1, le=5, description="Filter by tone (1-5)"),
    hsk: Optional[int] = Query(None, ge=1, le=6, description="Filter by HSK level"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Retrieve characters with optional filtering and search."""
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

    return query.order_by(Character.id.asc()).offset(offset).limit(limit).all()


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
    return char


@router.get("/{character_id}", response_model=CharacterResponse)
def get_character_by_id(character_id: int, db: Session = Depends(get_db)):
    """Retrieve single character details by ID."""
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail=f"Character with ID {character_id} not found")
    return char

