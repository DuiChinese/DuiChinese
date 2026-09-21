# Especificación de la API REST - DuiChinese

Documentación interactiva disponible en vivo en: `http://localhost:8000/docs` (Swagger UI).

---

## 🔐 Autenticación

Los endpoints protegidos de práctica y sincronización de usuario requieren el encabezado estándar:
```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```
El backend valida la firma asimétrica `ES256` contra el endpoint JWKS público de Supabase (`/.well-known/jwks.json`).

---

## 1. Caracteres (`/api/characters`)

### `GET /api/characters`
Obtiene la lista de los 243 caracteres HSK1 registrados en Supabase PostgreSQL. Si se incluye cabecera de autenticación, incluye el estado `is_unlocked` para ese estudiante.

- **Parámetros de consulta (Query params)**:
  - `q` (string, opcional): Búsqueda textual en hanzi, pinyin o traducción en español.
  - `tone` (int 1-5, opcional): Filtra por tono específico.
  - `hsk` (int 1-6, opcional): Filtra por nivel HSK (ej. `1`).
  - `limit` (int, default 200): Número máximo de resultados.
  - `offset` (int, default 0): Paginación.

### `POST /api/characters/unlock-next?count=7`
*(Requiere Autenticación)*
Desbloquea el siguiente lote de caracteres para el usuario autenticado y los agrega a su cola SRS.

### `GET /api/characters/{id}`
Obtiene el detalle completo de un caracter por su identificador numérico.

### `GET /api/characters/random`
Devuelve un caracter aleatorio para repasos rápidos o pruebas.

---

## 2. Práctica y Flashcards (`/api/practice`)

### `GET /api/practice/due`
*(Requiere Autenticación)*
Obtiene las cartas del usuario que vencen hoy o antes según el algoritmo de repetición espaciada Anki SM-2.

### `GET /api/practice/ahead`
*(Requiere Autenticación)*
Obtiene cartas futuras para repasar por adelantado cuando no quedan cartas vencidas hoy.

### `POST /api/practice/review`
*(Requiere Autenticación)*
Registra la calificación de una tarjeta tras una sesión de estudio para el estudiante activo.

- **Cuerpo (JSON)**:
```json
{
  "character_id": 1,
  "rating": 4
}
```
*Ratings*: `1` (Again), `2` (Hard), `3` (Good/Medium), `4` (Easy).

### `GET /api/practice/stats`
*(Requiere Autenticación)*
Devuelve las estadísticas calculadas en SQL para el estudiante activo:
```json
{
  "total_characters": 243,
  "total_reviews": 12,
  "new_count": 5,
  "learning_count": 2,
  "young_count": 3,
  "mature_count": 2,
  "due_today_count": 0,
  "average_ease_factor": 2.5,
  "average_stability": 1.2,
  "average_difficulty": 4.8,
  "retention_rate": 83.3
}
```

---

## 3. Pronunciación y Voz (`/api/pronunciation`)

### `POST /api/pronunciation/evaluate`
Evalúa la transcripción de voz. Acepta el hanzi o el pinyin sin tonos (`hao` = `hǎo`).

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
}
```
