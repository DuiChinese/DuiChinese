# Arquitectura de DuiChinese

## Visión General del Sistema

DuiChinese está diseñado como una aplicación web desacoplada en dos capas:

```
[ Cliente Web / Móvil ] (Vite + React 18)
        │
        ▼ HTTP (REST / JSON)
[ Servidor API FastAPI ] (Python 3.9+)
        │
        ▼ SQLAlchemy ORM (asyncpg / psycopg)
[ PostgreSQL 16 ] (o SQLite local transparente en desarrollo)
```

---

## Componentes del Frontend

- **`Navbar`**: Navegación principal con imagen de marca `logo-full.svg`, contador de progreso y acceso a la guía de tonos.
- **`HeroSection`**: Portada visual orientada a conversión y práctica inmediata.
- **`FlashcardDeck`**: Experiencia de tarjetas 3D con volteo (`transform-style: preserve-3d`), audio nativo (`speechSynthesis`) y atajos de teclado.
- **`PronunciationCoach`**: Entrenador fonético con captura de audio mediante `Web Speech API` (`zh-CN`), evaluación de coincidencia de caracter y análisis de tonos.
- **`CharacterGrid`**: Buscador dinámico por pinyin, hanzi o español, y filtrado por cualquiera de los 5 tonos.
- **`ToneGuideModal`**: Modal didáctico con ejemplos auditivos de las curvas melódicas chinas.

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
  - `pronunciation`: Motor de comparación fonética y asistencia tonal.
  - `seed`: Poblado de los 15 caracteres iniciales de HSK 1.

