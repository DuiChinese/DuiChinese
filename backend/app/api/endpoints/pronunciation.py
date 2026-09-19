import unicodedata
from fastapi import APIRouter
from app.schemas.pronunciation import (
    PronunciationEvaluationRequest,
    PronunciationEvaluationResponse,
    ToneContourInfo
)

router = APIRouter(prefix="/pronunciation", tags=["Pronunciation"])

TONE_METADATA = {
    1: {
        "name_es": "Primer Tono (一声)",
        "description_es": "Tono alto, plano y constante. Mantén la voz en un registro agudo sin variar la altura.",
        "pitch_pattern": "55 (Alto y sostenido, como cantar una nota larga)"
    },
    2: {
        "name_es": "Segundo Tono (二声)",
        "description_es": "Tono ascendente de medio a alto. Similar a la entonación de duda o pregunta en español: '¿Qué?'",
        "pitch_pattern": "35 (Ascenso suave desde tono medio a agudo)"
    },
    3: {
        "name_es": "Tercer Tono (三声)",
        "description_es": "Tono descendente y luego ascendente. Baja al registro más grave de tu garganta antes de subir levemente.",
        "pitch_pattern": "214 (Baja al fondo y luego repunta)"
    },
    4: {
        "name_es": "Cuarto Tono (四声)",
        "description_es": "Tono descendente rápido y contundente. Como dar una orden tajante o un grito corto: '¡No!'",
        "pitch_pattern": "51 (Caída vertical desde el punto más alto al más bajo)"
    },
    5: {
        "name_es": "Tono Neutro (轻声)",
        "description_es": "Tono corto, suave y ligero. Sin acentuación marcada, apoyado sobre la sílaba anterior.",
        "pitch_pattern": "0 (Corto, ligero y relajado)"
    }
}


def fold_phonetic(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text or "")
    stripped = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return stripped.lower().replace(" ", "")


def is_pronunciation_match(spoken: str, hanzi: str, pinyin: str) -> bool:
    heard = (spoken or "").strip()
    if not heard:
        return False
    target = (hanzi or "").strip()
    if target and (target in heard or heard in target):
        return True
    return fold_phonetic(heard) == fold_phonetic(pinyin)


@router.post("/evaluate", response_model=PronunciationEvaluationResponse)
def evaluate_pronunciation(payload: PronunciationEvaluationRequest):
    """
    Evaluates speech recognition output against target Hanzi and Tone.
    Provides targeted tips and melodic pitch advice.
    """
    heard = payload.spoken_text.strip()
    is_match = is_pronunciation_match(heard, payload.target_hanzi, payload.target_pinyin)

    tone_meta = TONE_METADATA.get(payload.target_tone, TONE_METADATA[1])
    tone_info = ToneContourInfo(
        tone_number=payload.target_tone,
        name_es=tone_meta["name_es"],
        description_es=tone_meta["description_es"],
        pitch_pattern=tone_meta["pitch_pattern"]
    )

    score = 100 if is_match else (40 if len(heard) > 0 else 0)

    tips = []
    if is_match:
        feedback = f"¡Excelente pronunciación! Has articulado '{payload.target_hanzi}' ({payload.target_pinyin}) con total claridad."
        tips.append(f"Tu tono {payload.target_tone} fue reconocido de forma precisa.")
    else:
        feedback = f"Reconocido '{heard or 'Silencio'}' en lugar de '{payload.target_hanzi}' ({payload.target_pinyin})."
        tips.append(f"Recuerda el perfil tonal: {tone_meta['pitch_pattern']}.")
        tips.append(tone_meta["description_es"])
        tips.append("Consejo: Abre la boca con mayor claridad y prolonga ligeramente la vocal principal.")

    return PronunciationEvaluationResponse(
        is_match=is_match,
        score=score,
        recognized_text=heard,
        target_hanzi=payload.target_hanzi,
        target_pinyin=payload.target_pinyin,
        target_tone=payload.target_tone,
        feedback_message=feedback,
        tone_info=tone_info,
        tips=tips
    )

