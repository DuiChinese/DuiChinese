from sqlalchemy import Column, Integer, String, Float, Numeric, DateTime, ForeignKey, Boolean, Date, Text, Uuid
from sqlalchemy.sql import func
from app.db.session import Base


class UserProfile(Base):
    """
    User profile linked to Supabase auth.users(id).
    Stores student settings, streak, and preferences.
    """
    __tablename__ = "user_profiles"

    user_id = Column(Uuid(as_uuid=False), primary_key=True, index=True)
    display_name = Column(Text, nullable=True)
    avatar_url = Column(Text, nullable=True)
    daily_card_goal = Column(Integer, default=7)
    current_streak = Column(Integer, default=0)
    last_study_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UserCardSRS(Base):
    """
    Multi-user Spaced Repetition System (SRS) state tracking Anki SM-2 & FSRS v4.5
    for an individual student studying a Hanzi character.
    """
    __tablename__ = "user_card_srs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Uuid(as_uuid=False), nullable=False, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False, index=True)
    
    state = Column(String(20), default="new")  # 'new', 'learning', 'review', 'relearning', 'mastered'
    is_unlocked = Column(Boolean, default=False, nullable=False)
    reps = Column(Integer, default=0)
    lapses = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.50)
    interval_days = Column(Integer, default=0)
    due_date = Column(DateTime(timezone=True), nullable=True)
    last_reviewed = Column(DateTime(timezone=True), nullable=True)
    
    # FSRS v4.5 parameters
    stability = Column(Float, default=0.0)
    difficulty = Column(Float, default=0.0)
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UserReview(Base):
    """
    Audit log of individual card reviews submitted by a student.
    """
    __tablename__ = "user_reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Uuid(as_uuid=False), nullable=False, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1: Again, 2: Hard, 3: Good, 4: Easy
    status = Column(String(20), default="learning")
    reviewed_at = Column(DateTime(timezone=True), server_default=func.now())
