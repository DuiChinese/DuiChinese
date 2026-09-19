from typing import List, Optional
from pydantic import BaseModel


class PronunciationEvaluationRequest(BaseModel):
    character_id: Optional[int] = None
    target_hanzi: str
    target_pinyin: str
    target_tone: int
    spoken_text: str


class ToneContourInfo(BaseModel):
    tone_number: int
    name_es: str
    description_es: str
    pitch_pattern: str  # e.g. "55 Alto y plano", "35 Ascendente", etc.


class PronunciationEvaluationResponse(BaseModel):
    is_match: bool
    score: int  # 0 to 100
    recognized_text: str
    target_hanzi: str
    target_pinyin: str
    target_tone: int
    feedback_message: str
    tone_info: ToneContourInfo
    tips: List[str]

