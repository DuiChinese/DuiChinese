# Arquitectura de DuiChinese

## Visión General del Sistema

DuiChinese está diseñado como una aplicación web desacoplada en dos capas:

```
[ Cliente Web / Móvil ] (Vite + React 19)
        │
    ▼ HTTP (REST / JSON)
[ Servidor API FastAPI ] (Python 3.9+)
        │
        ▼ SQLAlchemy ORM (asyncpg / psycopg)
[ PostgreSQL 16 ] (o SQLite local transparente en desarrollo)
```

---

## Componentes del Frontend

- **`AppShell`**: Lienzo carmesí, wordmark `public/assets/logo.svg` y navegación en pastillas oro.
- **`LandingPage`**: Cartel carmesí con el objetivo del producto, un CTA a Flashcards y un campo de hanzi que rebotan contra los bordes de la ventana, por debajo del nav (`HanziDrift`).
- **`FlashcardsPage`**: Cuatro modos (`hanzi`, `meaning`, `listen`, `speak`) con SRS Anki.
- **`HanziCard`**: Foto de marco 回纹 a proporción (`public/assets/card-frame.jpg`), esquinas ligeramente redondeadas, audio nativo y volteo.
- **Voz**: `lib/speech.ts` usa Putonghua (`zh-CN`, nunca cantonés). El altavoz reproduce a velocidad normal y el caracol más despacio. `lib/recognition.ts` escucha en `zh-CN`.
- **`CharactersPage`**: Búsqueda por hanzi, pinyin o meaning, y filtro por tono.
- **`StatsPage`**: Contadores de repaso.

Marca en `frontend/public/`: `favicon.svg`, `apple-touch-icon.svg`, `site.webmanifest`, `assets/logo.svg`. No hay imágenes sueltas en la raíz ni en `src/assets`.

---

## Componentes del Backend

- **`app.core.config`**: Configuración con Pydantic Settings, gestión de orígenes CORS y conmutador de base de datos.
- **`app.db.session`**: Gestión de conexiones y sesiones SQLAlchemy con autodetección de PostgreSQL y fallback a SQLite.
- **`app.models`**:
  - `Character`: Entidad principal de Hanzi con campos fonéticos, radicales, trazos, mnemotecnia y ejemplos JSON.
  - `FlashcardReview`: Registro de sesiones de repaso para repetición espaciada.
- **`app.api.endpoints`**:
  - `characters`: Listado, búsqueda, filtrado por tono y detalle.
  - `practice`: Registro de repasos y estadísticas de progreso.
  - `pronunciation`: Motor de comparación fonética (hanzi o pinyin) y asistencia tonal.
  - `seed`: Poblado de los 15 caracteres iniciales de HSK 1.
