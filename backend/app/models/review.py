from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base


class FlashcardReview(Base):
    """
    Tracks flashcard review performance for spaced repetition.
    """
    __tablename__ = "flashcard_reviews"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False, index=True)
    status = Column(String(20), default="learning")  # 'new', 'learning', 'mastered'
    rating = Column(Integer, nullable=False)  # 1: again, 2: hard, 3: good, 4: easy
    reviewed_at = Column(DateTime(timezone=True), server_default=func.now())

