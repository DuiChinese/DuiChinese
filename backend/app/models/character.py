from sqlalchemy import Column, Integer, String, Text, JSON, DateTime
from sqlalchemy.sql import func
from app.db.session import Base


class Character(Base):
    """
    Chinese character model (Hanzi) with phonetic, grammatical,
    and pedagogical information.
    """
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    hanzi = Column(String(10), unique=True, nullable=False, index=True)
    pinyin = Column(String(50), nullable=False, index=True)
    pinyin_clean = Column(String(50), nullable=False)
    tone = Column(Integer, nullable=False)  # 1, 2, 3, 4, 5 (neutral)
    meaning = Column(String(255), nullable=False)
    radical = Column(String(20), nullable=True)
    stroke_count = Column(Integer, nullable=True)
    hsk_level = Column(Integer, default=1, index=True)
    mnemonic = Column(Text, nullable=True)
    examples = Column(JSON, default=list)  # list of {chinese: str, pinyin: str, meaning: str}
    created_at = Column(DateTime(timezone=True), server_default=func.now())

