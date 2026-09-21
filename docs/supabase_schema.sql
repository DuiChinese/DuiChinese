-- ==============================================================================
-- DuiChinese - Unified Supabase Database Schema
-- Project: DuiChinese (Mandarin Flashcard & Spaced Repetition Platform)
-- PostgreSQL / Supabase Migration Script
-- ==============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABLA: public.characters (Catálogo Global de Caracteres HSK1)
-- Contenido educativo inmutable y compartido por todos los usuarios.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.characters (
    id SERIAL PRIMARY KEY,
    hanzi VARCHAR(10) NOT NULL UNIQUE,
    pinyin VARCHAR(50) NOT NULL,
    pinyin_clean VARCHAR(50) NOT NULL,
    tone SMALLINT NOT NULL CHECK (tone BETWEEN 1 AND 5),
    meaning VARCHAR(255) NOT NULL,
    radical VARCHAR(20),
    stroke_count SMALLINT,
    hsk_level SMALLINT DEFAULT 1 CHECK (hsk_level BETWEEN 1 AND 6),
    order_index INTEGER DEFAULT 0,
    mnemonic TEXT,
    examples JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Índices de búsqueda rápida para catálogo y diccionario
CREATE INDEX IF NOT EXISTS idx_characters_order ON public.characters (order_index ASC, id ASC);
CREATE INDEX IF NOT EXISTS idx_characters_hsk_level ON public.characters (hsk_level);
CREATE INDEX IF NOT EXISTS idx_characters_tone ON public.characters (tone);
CREATE INDEX IF NOT EXISTS idx_characters_pinyin ON public.characters (pinyin_clean);


-- ==============================================================================
-- 2. TABLA: public.user_profiles (Perfiles y Estadísticas de Racha)
-- Vinculado a auth.users de Supabase (se elimina en cascada si se borra el usuario).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    daily_card_goal INTEGER DEFAULT 7 CHECK (daily_card_goal > 0),
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    last_study_date DATE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);


-- ==============================================================================
-- 3. TABLA: public.user_card_srs (Progreso Individual de Repetición Espaciada)
-- Almacena los parámetros Anki SM-2 y FSRS v4.5 por cada usuario y carácter.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_card_srs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    
    -- Estado de progreso en la curva de aprendizaje
    state VARCHAR(20) DEFAULT 'new' CHECK (state IN ('new', 'learning', 'review', 'relearning', 'mastered')),
    is_unlocked BOOLEAN DEFAULT FALSE,
    
    -- Parámetros del algoritmo Anki SM-2
    reps INTEGER DEFAULT 0 CHECK (reps >= 0),
    lapses INTEGER DEFAULT 0 CHECK (lapses >= 0),
    ease_factor NUMERIC(4, 2) DEFAULT 2.50 CHECK (ease_factor >= 1.30),
    interval_days INTEGER DEFAULT 0 CHECK (interval_days >= 0),
    due_date TIMESTAMPTZ,
    last_reviewed TIMESTAMPTZ,
    
    -- Parámetros FSRS v4.5 (Difficulty & Stability)
    stability NUMERIC(6, 2) DEFAULT 0.0 CHECK (stability >= 0.0),
    difficulty NUMERIC(4, 2) DEFAULT 0.0 CHECK (difficulty >= 0.0),
    
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),

    -- Clave única: Cada usuario tiene exactamente un registro SRS por carácter
    CONSTRAINT unique_user_character UNIQUE (user_id, character_id)
);

-- Índices optimizados para las consultas de flashcards pendientes (due cards)
CREATE INDEX IF NOT EXISTS idx_user_srs_query ON public.user_card_srs (user_id, is_unlocked, due_date ASC);
CREATE INDEX IF NOT EXISTS idx_user_srs_state ON public.user_card_srs (user_id, state);
CREATE INDEX IF NOT EXISTS idx_user_srs_char ON public.user_card_srs (character_id);


-- ==============================================================================
-- 4. TABLA: public.user_reviews (Registro Histórico de Calificaciones)
-- Auditoría de cada intento de repaso (ratings 1 a 4).
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 4), -- 1: Again, 2: Hard, 3: Good, 4: Easy
    status VARCHAR(20) NOT NULL,                           -- 'learning', 'mastered'
    reviewed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_user_reviews_timeline ON public.user_reviews (user_id, reviewed_at DESC);


-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) - Seguridad Estricta
-- ==============================================================================
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_card_srs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reviews ENABLE ROW LEVEL SECURITY;

-- 5.1 Políticas para characters:
-- Lectura pública universal (anon y autenticados pueden ver el diccionario HSK1)
DROP POLICY IF EXISTS "Characters son públicos para lectura" ON public.characters;
CREATE POLICY "Characters son públicos para lectura"
    ON public.characters FOR SELECT
    USING (true);

-- 5.2 Políticas para user_profiles:
DROP POLICY IF EXISTS "Usuarios gestionan su propio perfil" ON public.user_profiles;
CREATE POLICY "Usuarios gestionan su propio perfil"
    ON public.user_profiles FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5.3 Políticas para user_card_srs:
DROP POLICY IF EXISTS "Usuarios gestionan su propio SRS" ON public.user_card_srs;
CREATE POLICY "Usuarios gestionan su propio SRS"
    ON public.user_card_srs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5.4 Políticas para user_reviews:
DROP POLICY IF EXISTS "Usuarios gestionan su propio historial de reviews" ON public.user_reviews;
CREATE POLICY "Usuarios gestionan su propio historial de reviews"
    ON public.user_reviews FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 6. AUTOMATIZACIÓN (TRIGGERS Y FUNCIONES)
-- ==============================================================================

-- 6.1 Trigger: Al registrarse un usuario en auth.users, inicializar su perfil
-- y desbloquear los primeros 7 caracteres en orden pedagógico.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Crear perfil de usuario
    INSERT INTO public.user_profiles (user_id, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Estudiante')
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- 2. Inicializar progreso SRS para todos los caracteres existentes
    -- Desbloquear automáticamente los primeros 7 según order_index
    INSERT INTO public.user_card_srs (
        user_id,
        character_id,
        is_unlocked,
        state,
        due_date
    )
    SELECT
        NEW.id,
        c.id,
        (c.order_index <= 7),
        'new',
        TIMEZONE('utc', NOW())
    FROM public.characters c
    ON CONFLICT (user_id, character_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enlazar trigger a auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 6.2 Función RPC: Desbloquear el siguiente lote de caracteres para el usuario actual
CREATE OR REPLACE FUNCTION public.unlock_next_batch(batch_size INT DEFAULT 7)
RETURNS SETOF public.characters AS $$
DECLARE
    curr_user_id UUID := auth.uid();
BEGIN
    IF curr_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    -- Actualiza a is_unlocked = TRUE las siguientes N cartas bloqueadas
    RETURN QUERY
    WITH next_cards AS (
        SELECT s.character_id
        FROM public.user_card_srs s
        JOIN public.characters c ON c.id = s.character_id
        WHERE s.user_id = curr_user_id
          AND s.is_unlocked = FALSE
        ORDER BY c.order_index ASC, c.id ASC
        LIMIT batch_size
    )
    UPDATE public.user_card_srs u
    SET is_unlocked = TRUE,
        due_date = TIMEZONE('utc', NOW()),
        updated_at = TIMEZONE('utc', NOW())
    FROM next_cards n
    WHERE u.user_id = curr_user_id
      AND u.character_id = n.character_id
    RETURNING (SELECT c FROM public.characters c WHERE c.id = u.character_id).*;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
