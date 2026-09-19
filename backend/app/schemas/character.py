from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ExampleWord(BaseModel):
    chinese: str
    pinyin: str
    meaning: str


class CharacterBase(BaseModel):
    hanzi: str
    pinyin: str
    pinyin_clean: str
    tone: int
    meaning: str
    radical: Optional[str] = None
    stroke_count: Optional[int] = None
    hsk_level: int = 1
    mnemonic: Optional[str] = None
    examples: List[ExampleWord] = []


class CharacterCreate(CharacterBase):
    pass


class CharacterResponse(CharacterBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class FlashcardReviewCreate(BaseModel):
    character_id: int
    rating: int  # 1: again, 2: hard, 3: medium/good, 4: easy


class FlashcardReviewResponse(BaseModel):
    id: int
    character_id: int
    status: str
    rating: int
    interval_days: Optional[int] = 0
    ease_factor: Optional[float] = 2.5
    reps: Optional[int] = 0
    lapses: Optional[int] = 0
    due_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StatsResponse(BaseModel):
    total_characters: int
    total_reviews: int
    mastered_count: int
    learning_count: int
    due_today_count: Optional[int] = 0
    average_ease_factor: Optional[float] = 2.5
    retention_rate: Optional[float] = 100.0
