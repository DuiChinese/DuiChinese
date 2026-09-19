# Especificación de la API REST - DuiChinese

Documentación interactiva disponible en vivo en: `http://localhost:8000/docs` (Swagger UI).

---

## 1. Caracteres (`/api/characters`)

### `GET /api/characters`
Obtiene la lista de caracteres chinos registrados.

- **Parámetros de consulta (Query params)**:
  - `q` (string, opcional): Búsqueda textual en hanzi, pinyin o traducción en español.
  - `tone` (int 1-5, opcional): Filtra por tono específico.
  - `hsk` (int 1-6, opcional): Filtra por nivel HSK (ej. `1`).
  - `limit` (int, default 50): Número máximo de resultados.
  - `offset` (int, default 0): Paginación.

- **Respuesta 200 OK**:
```json
[
  {
    "id": 1,
    "hanzi": "不",
    "pinyin": "bù",
    "pinyin_clean": "bu",
    "tone": 4,
    "meaning": "No, no ser, negación",
    "radical": "一",
    "stroke_count": 4,
    "hsk_level": 1,
    "mnemonic": "Una planta cuyas raíces...",
    "examples": [
      { "chinese": "不好", "pinyin": "bù hǎo", "meaning": "No está bien" }
    ]
  }
]
```

### `GET /api/characters/{id}`
Obtiene el detalle completo de un caracter por su identificador numérico.

### `GET /api/characters/random`
Devuelve un caracter aleatorio para repasos rápidos o pruebas.

---

## 2. Práctica y Flashcards (`/api/practice`)

### `POST /api/practice/review`
Registra la calificación de una tarjeta tras una sesión de estudio.

- **Cuerpo (JSON)**:
```json
{
  "character_id": 1,
  "rating": 4
}
```
*Ratings*: `1` (Otra vez), `2` (Difícil), `3` (Bien), `4` (Fácil / Dominado).

### `GET /api/practice/stats`
Devuelve las estadísticas acumuladas de estudio:
```json
{
  "total_characters": 15,
  "total_reviews": 12,
  "mastered_count": 5,
  "learning_count": 7
}
```

---

## 3. Pronunciación y Voz (`/api/pronunciation`)

### `POST /api/pronunciation/evaluate`
Evalúa la transcripción fonética de la voz del usuario frente al caracter y tono esperado.

- **Cuerpo (JSON)**:
```json
{
  "target_hanzi": "好",
  "target_pinyin": "hǎo",
  "target_tone": 3,
  "spoken_text": "好"
}
```

- **Respuesta 200 OK**:
```json
{
  "is_match": true,
  "score": 100,
  "recognized_text": "好",
  "target_hanzi": "好",
  "target_pinyin": "hǎo",
  "target_tone": 3,
  "feedback_message": "¡Excelente pronunciación!...",
  "tone_info": {
    "tone_number": 3,
    "name_es": "Tercer Tono (三声)",
    "description_es": "Tono descendente y luego ascendente...",
    "pitch_pattern": "214"
  },
  "tips": [
    "Tu tono 3 fue reconocido de forma precisa."
  ]
]
```

