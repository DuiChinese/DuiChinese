# Arquitectura de DuiChinese

## Visión General del Sistema

DuiChinese está diseñado como una plataforma de aprendizaje desacoplada y nativa en la nube:

```
[ Cliente Web ] (Vite + React 19 + Tailwind + shadcn)
        │
        ├── 1. Autenticación (Google OAuth / Email) ──► [ Supabase Auth ]
        │                                                     │
        │   ◄── 2. Emisión de JWT (ES256) ────────────────────┘
        │
        ├── 3. HTTP REST con Bearer Token ───────────► [ Servidor API FastAPI ]
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            ▼                                   ▼
                             [ Verificación JWKS Supabase ]         [ Supabase PostgreSQL 16 ]
                             (Claves públicas asimétricas)         - characters (243 HSK1)
                                                                   - user_card_srs (Multi-user SM-2/FSRS)
                                                                   - user_reviews (Audit log)
                                                                   - user_profiles (Perfiles y rachas)
```

---

## Componentes del Frontend

- **`AppShell`**: Cabecera con navegación en inglés (`Flashcards`, `Characters`, `Stats`), estado de sesión (`Sign In` o avatar/nombre de usuario y `Sign out`).
- **`LandingPage`**: Cartel carmesí con el objetivo del producto, CTA de inicio y campo interactivo de hanzi flotantes (`HanziDrift`).
- **`FlashcardsPage`**: Cuatro modos de estudio (`hanzi`, `meaning`, `listen`, `speak`) con algoritmo SRS Anki. Tarjeta centrada al 50% vertical en el tapete rojo. Protegida con `AuthWall` para persistencia en base de datos.
- **`StatsPage`**: Métricas de aprendizaje por usuario (retención real calculada en base a repasos en SQL, distribución por madurez de tarjetas). Protegida con `AuthWall`.
- **`AuthCard` / `AuthModal` / `AuthWall`**: Interfaz unificada de autenticación 100% en inglés:
  - Continuar con Google (1-Click OAuth).
  - Inicio de sesión y registro tradicional con Email y Contraseña.
  - Recuperación de contraseña (`Forgot password?`) con enlace seguro.
- **`HanziCard`**: Marco proporcional (`public/assets/card-frame.jpg`), esquinas ligeramente redondeadas, volteo y audio nativo.
- **Voz y Audio (`lib/speech.ts`)**: Putonghua (`zh-CN`). Incorpora terminación fonética natural con puntuación china (`。`) y selección de voces premium (Ting-Ting en macOS / Google en Chrome) para evitar cortes bruscos (*clics/pops*).
- **Reconocimiento (`lib/recognition.ts`)**: Escucha de voz en mandarín estándar para el modo de pronunciación.

---

## Componentes del Backend

- **`app.core.auth`**: Verificación de tokens JWT asimétricos emitidos por Supabase Auth mediante el endpoint público de JWKS (`ES256`). Extrae el `user_id` único del usuario autenticado.
- **`app.core.config`**: Configuración con Pydantic Settings, orígenes CORS y parámetros de Supabase.
- **`app.db.session`**: Gestión de conexiones PostgreSQL a Supabase Pooler (`aws-0-eu-central-1.pooler.supabase.com:6543`) con tipado `Uuid(as_uuid=False)`.
- **`app.models`**:
  - `Character`: Catálogo de 243 caracteres HSK1 (pinyin, tonos, radicales, significados en español e inglés, ejemplos).
  - `UserCardSRS`: Estado de repetición espaciada independiente por estudiante (repeticiones, lapsos, factor de facilidad, fecha de vencimiento, estabilidad y dificultad FSRS).
  - `UserReview`: Historial transaccional de repasos enviados por cada estudiante.
  - `UserProfile`: Perfil de estudiante, racha actual y meta diaria.
- **`app.api.endpoints`**:
  - `characters`: Catálogo de caracteres, enriquecido con el estado de desbloqueo del usuario activo.
  - `practice`: Obtención de cartas vencidas (`/due`), envío de repasos (`/review`) y cálculo de estadísticas (`/stats`).
  - `pronunciation`: Motor de evaluación fonética y asesoramiento tonal.
