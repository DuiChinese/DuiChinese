from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base


class CardSRS(Base):
    """
    Card Spaced Repetition System (SRS) state implementing Anki SM-2.
    Tracks interval, ease factor, repetition count, lapses, and due dates.
    """
    __tablename__ = "card_srs"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), unique=True, nullable=False, index=True)
    state = Column(String(20), default="new")  # 'new', 'learning', 'review', 'relearning', 'mastered'
    reps = Column(Integer, default=0)
    lapses = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Integer, default=0)
    due_date = Column(DateTime(timezone=True), nullable=True)
    last_reviewed = Column(DateTime(timezone=True), nullable=True)
    stability = Column(Float, nullable=True, default=0.0)
    difficulty = Column(Float, nullable=True, default=0.0)
