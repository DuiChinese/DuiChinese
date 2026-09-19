from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.character import Character
from app.data.seed_hsk1 import INITIAL_15_CHARACTERS

router = APIRouter(prefix="/seed", tags=["Seed Data"])


@router.post("")
def seed_database(force: bool = False, db: Session = Depends(get_db)):
    """
    Populates database with the 15 HSK 1 characters from the user screenshot.
    """
    existing_count = db.query(Character).count()
    if existing_count > 0 and not force:
        return {
            "message": f"Database already has {existing_count} characters. Use force=True to reload.",
            "characters_count": existing_count
        }

    if force:
        db.query(Character).delete()
        db.commit()

    created = []
    for item in INITIAL_15_CHARACTERS:
        char = Character(
            hanzi=item["hanzi"],
            pinyin=item["pinyin"],
            pinyin_clean=item["pinyin_clean"],
            tone=item["tone"],
            meaning=item["meaning"],
            radical=item["radical"],
            stroke_count=item["stroke_count"],
            hsk_level=item["hsk_level"],
            mnemonic=item["mnemonic"],
            examples=item["examples"]
        )
        db.add(char)
        created.append(item["hanzi"])

    db.commit()
    return {
        "message": f"Successfully seeded {len(created)} characters.",
        "characters": created
    }

