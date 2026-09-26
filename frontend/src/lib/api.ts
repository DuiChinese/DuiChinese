import { HSK1_CHARACTERS } from "@/data/hsk1"
import { getAccessToken } from "@/lib/supabase"
import {
  createInitialUserCard,
  calculateNextReview,
  formatInterval,
  fisherYatesShuffle,
  createPrelearnedCard,
} from "@/lib/fsrs-engine"
import type {
  Character,
  FlashcardReviewResponse,
  ReviewRating,
  Stats,
  CategoryCharacterItem,
  UserCardProgress,
  UserSettings,
} from "@/lib/types"

const API_BASE = import.meta.env.VITE_API_URL || ""

async function authHeaders(customHeaders?: Record<string, string>): Promise<HeadersInit> {
  const headers: Record<string, string> = { ...customHeaders }
  try {
    const token = await getAccessToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  } catch {
    // Ignore in tests or offline mode
  }
  return headers
}

async function hasAuthToken(): Promise<boolean> {
  try {
    const token = await getAccessToken()
    return Boolean(token)
  } catch {
    return false
  }
}

const UNLOCKED_STORAGE_KEY = "duichinese_unlocked_ids_v1"
const LOCAL_SRS_KEY = "duichinese_local_srs_v1"
const LOCAL_FSRS_KEY = "duichinese_local_fsrs_v2"
const LOCAL_STREAK_KEY = "duichinese_streak_v1"
const USER_SETTINGS_KEY = "duichinese_user_settings_v1"

interface LocalStreakData {
  streak: number
  lastStudyDate: string
}

function getLocalStreak(): number {
  try {
    const raw = localStorage.getItem(LOCAL_STREAK_KEY)
    if (raw) {
      const data: LocalStreakData = JSON.parse(raw)
      const today = new Date().toISOString().split("T")[0]
      const last = new Date(data.lastStudyDate)
      const now = new Date(today)
      const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays <= 1) {
        return data.streak || 0
      }
      return 0
    }
  } catch {
    // fallback
  }
  return 0
}

function recordLocalStudyStreak(): void {
  try {
    const today = new Date().toISOString().split("T")[0]
    const raw = localStorage.getItem(LOCAL_STREAK_KEY)
    if (!raw) {
      localStorage.setItem(LOCAL_STREAK_KEY, JSON.stringify({ streak: 1, lastStudyDate: today }))
      return
    }
    const data: LocalStreakData = JSON.parse(raw)
    if (data.lastStudyDate === today) return
    const last = new Date(data.lastStudyDate)
    const now = new Date(today)
    const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    const nextStreak = diffDays === 1 ? (data.streak || 0) + 1 : 1
    localStorage.setItem(LOCAL_STREAK_KEY, JSON.stringify({ streak: nextStreak, lastStudyDate: today }))
  } catch {
    // fallback
  }
}


export function getLocalUnlockedIds(): Set<number> {
  // Purge legacy storage keys so they never pollute unlock status
  try {
    localStorage.removeItem(UNLOCKED_STORAGE_KEY)
    localStorage.removeItem("duichinese_unlocked_ids")
  } catch {
    // ignore
  }

  const fsrsMap = getLocalFSRSMap()
  const unlocked = new Set<number>()
  for (const [idStr, progress] of Object.entries(fsrsMap)) {
    if (progress && typeof progress.state === "number" && progress.state !== 0) {
      unlocked.add(Number(idStr))
    }
  }
  return unlocked
}

export function getUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(USER_SETTINGS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return { userId: "local-user", daily_new_cards: 10 }
}

export function saveUserSettings(settings: Partial<UserSettings>) {
  try {
    const current = getUserSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

export function getLocalFSRSMap(): Record<number, UserCardProgress> {
  try {
    const raw = localStorage.getItem(LOCAL_FSRS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return {}
}

export function saveLocalFSRSMap(map: Record<number, UserCardProgress>) {
  try {
    localStorage.setItem(LOCAL_FSRS_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export async function loadCharacters(): Promise<Character[]> {
  try {
    if (!(await hasAuthToken())) throw new Error("Guest mode: using local FSRS")
    const response = await fetch(`${API_BASE}/api/characters`, {
      headers: await authHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch characters")
    return await response.json()
  } catch {
    const unlockedIds = getLocalUnlockedIds()
    return HSK1_CHARACTERS.map((c) => ({
      ...c,
      is_unlocked: unlockedIds.has(c.id),
    }))
  }
}

/**
 * Loads today's official study session:
 * 1. Due review cards (state > 0 and due <= now).
 * 2. New cards (state === 0), limited to daily_new_cards.
 * 3. Shuffled via Fisher-Yates.
 */
export async function loadStudySession(): Promise<Character[]> {
  try {
    if (!(await hasAuthToken())) throw new Error("Guest mode: using local FSRS")
    const response = await fetch(`${API_BASE}/api/study/session`, {
      headers: await authHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch study session")
    return await response.json()
  } catch {
    const fsrsMap = getLocalFSRSMap()
    const now = new Date()

    const dueCards: Character[] = []
    const newCards: Character[] = []

    for (const char of HSK1_CHARACTERS) {
      const card = fsrsMap[char.id]
      if (!card || card.state === 0) {
        newCards.push({ ...char, is_unlocked: false })
      } else if (new Date(card.due) <= now) {
        dueCards.push({ ...char, is_unlocked: true })
      }
    }

    const settings = getUserSettings()
    const dailyLimit = Math.max(5, Math.min(15, settings.daily_new_cards || 10))
    const selectedNew = newCards.slice(0, dailyLimit)

    const combined = [...dueCards, ...selectedNew]
    return fisherYatesShuffle(combined)
  }
}

export async function loadDueCharacters(): Promise<Character[]> {
  return await loadStudySession()
}

/**
 * Loads random cards from the already studied catalog (state !== 0) for Ghost Mode practice.
 */
export async function loadPracticeAhead(): Promise<Character[]> {
  try {
    if (!(await hasAuthToken())) throw new Error("Guest mode: using local FSRS")
    const response = await fetch(`${API_BASE}/api/practice/ahead`, {
      headers: await authHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch practice ahead")
    return await response.json()
  } catch {
    const fsrsMap = getLocalFSRSMap()
    const studiedIds = new Set(
      Object.values(fsrsMap)
        .filter((c) => c.state !== 0 || c.reps > 0)
        .map((c) => Number(c.hanziId))
    )

    let pool = HSK1_CHARACTERS.filter((c) => studiedIds.has(c.id))
    if (pool.length === 0) {
      const unlocked = getLocalUnlockedIds()
      pool = HSK1_CHARACTERS.filter((c) => unlocked.has(c.id))
    }
    return fisherYatesShuffle(pool.map((c) => ({ ...c, is_unlocked: true })))
  }
}

export async function unlockNextBatch(count: number = 7): Promise<Character[]> {
  try {
    if (!(await hasAuthToken())) throw new Error("Guest mode: using local SRS")
    const response = await fetch(`${API_BASE}/api/characters/unlock-next?count=${count}`, {
      method: "POST",
      headers: await authHeaders(),
    })
    if (!response.ok) throw new Error("Failed to unlock next batch")
    return await response.json()
  } catch {
    const fsrsMap = getLocalFSRSMap()
    const unlockedIds = getLocalUnlockedIds()
    const remaining = HSK1_CHARACTERS.filter((c) => !unlockedIds.has(c.id))
    const newlyUnlocked = remaining.slice(0, count)
    newlyUnlocked.forEach((c) => {
      const card = createInitialUserCard(c.id)
      card.state = 1
      fsrsMap[c.id] = card
    })
    saveLocalFSRSMap(fsrsMap)
    return newlyUnlocked.map((c) => ({ ...c, is_unlocked: true }))
  }
}

/**
 * Marks a set of pre-selected characters directly as Mature (Section 5 Onboarding):
 * state = 2 (Review), stability = 21.0, difficulty = 5.0, scheduled_days = 21..35, reps = 1.
 */
export async function prelearnCards(characterIds: number[]): Promise<{ ok: boolean; prelearned_count: number }> {
  const fsrsMap = getLocalFSRSMap()
  characterIds.forEach((id) => {
    fsrsMap[id] = createPrelearnedCard(id)
  })
  saveLocalFSRSMap(fsrsMap)

  if (await hasAuthToken()) {
    try {
      const response = await fetch(`${API_BASE}/api/cards/prelearn`, {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ character_ids: characterIds }),
      })
      if (response.ok) {
        return await response.json()
      }
    } catch {
      // Local fallback succeeded
    }
  }

  return { ok: true, prelearned_count: characterIds.length }
}

export async function loadStats(fallbackCharacters?: Character[]): Promise<Stats> {
  const localStreak = getLocalStreak()
  try {
    if (!(await hasAuthToken())) throw new Error("Guest mode: using local FSRS")
    const response = await fetch(`${API_BASE}/api/study/stats`, {
      headers: await authHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch stats")
    const data = await response.json()
    return {
      ...data,
      current_streak:
        typeof data.current_streak === "number" && data.current_streak > 0
          ? data.current_streak
          : localStreak,
    }
  } catch {
    const chars = fallbackCharacters && fallbackCharacters.length > 0 ? fallbackCharacters : HSK1_CHARACTERS
    const unlockedIds = getLocalUnlockedIds()
    const unlockedChars = chars.filter((c) => unlockedIds.has(c.id))
    const fsrsMap = getLocalFSRSMap()

    const catNew: CategoryCharacterItem[] = []
    const catLearning: CategoryCharacterItem[] = []
    const catYoung: CategoryCharacterItem[] = []
    const catMature: CategoryCharacterItem[] = []

    for (const c of unlockedChars) {
      const card = fsrsMap[c.id]
      const state = card ? card.state : 0
      const scheduled = card ? card.scheduled_days : 0
      const formatted = formatInterval(state, scheduled)

      const item: CategoryCharacterItem = {
        id: c.id,
        hanzi: c.hanzi,
        pinyin: c.pinyin,
        meaning: c.meaning,
        tone: c.tone,
        state,
        interval_days: Math.round(scheduled),
        scheduled_days: scheduled,
        stability: card ? card.stability : 0,
        difficulty: card ? card.difficulty : 0,
        formatted_interval: formatted,
      }

      // Classification per Section 6:
      // NEW: state === 0 (Never reviewed)
      // LEARNING: state === 1 || state === 3 (In learning / relearning)
      // YOUNG: state === 2 && scheduled_days < 21
      // MATURE: state === 2 && scheduled_days >= 21
      if (state === 0) {
        catNew.push(item)
      } else if (state === 1 || state === 3) {
        catLearning.push(item)
      } else if (scheduled >= 21) {
        catMature.push(item)
      } else {
        catYoung.push(item)
      }
    }

    const totalReviews = Object.values(fsrsMap).reduce((sum, item) => sum + (item.reps || 0), 0)
    const dueTodayCount = unlockedChars.filter((c) => {
      const card = fsrsMap[c.id]
      return card && card.due && new Date(card.due) <= new Date()
    }).length

    return {
      total_characters: unlockedChars.length,
      total_reviews: totalReviews,
      new_count: catNew.length,
      learning_count: catLearning.length,
      young_count: catYoung.length,
      mature_count: catMature.length,
      mastered_count: catMature.length,
      due_today_count: dueTodayCount,
      current_streak: localStreak,
      average_ease_factor: 2.5,
      average_stability: 0.0,
      average_difficulty: 0.0,
      retention_rate: 0.0,
      categories: {
        new: catNew,
        learning: catLearning,
        young: catYoung,
        mature: catMature,
      },
    }
  }
}

export async function submitReview(
  characterId: number,
  rating: ReviewRating,
  isGhostMode: boolean = false
): Promise<FlashcardReviewResponse> {
  // Free Practice (Keep Reviewing / Ghost Mode):
  // DATA INVARIANCE: Does NOT mutate FSRS database or local card schedule.
  if (isGhostMode) {
    return {
      id: Date.now(),
      character_id: characterId,
      status: "ghost_practice",
      rating,
      interval_days: 0,
      scheduled_days: 0,
      elapsed_days: 0,
      state: 2,
      reps: 0,
      lapses: 0,
      due_date: null,
    }
  }

  try {
    if (!(await hasAuthToken())) throw new Error("Guest mode: using local FSRS")
    const response = await fetch(`${API_BASE}/api/study/review`, {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ character_id: characterId, rating }),
    })
    if (!response.ok) throw new Error("Failed to submit review")
    return await response.json()
  } catch {
    const fsrsMap = getLocalFSRSMap()
    const current = fsrsMap[characterId] || createInitialUserCard(characterId)
    const { nextCard } = calculateNextReview(current, rating, new Date())

    fsrsMap[characterId] = nextCard
    saveLocalFSRSMap(fsrsMap)
    recordLocalStudyStreak()

    return {
      id: Date.now(),
      character_id: characterId,
      status: nextCard.state === 2 ? "mastered" : "learning",
      rating,
      state: nextCard.state,
      interval_days: Math.round(nextCard.scheduled_days),
      scheduled_days: nextCard.scheduled_days,
      elapsed_days: nextCard.elapsed_days,
      stability: nextCard.stability,
      difficulty: nextCard.difficulty,
      reps: nextCard.reps,
      lapses: nextCard.lapses,
      due_date: new Date(nextCard.due).toISOString(),
    }
  }
}

export async function evaluatePronunciation(params: {
  hanzi: string
  pinyin: string
  tone: number
  spoken: string
  characterId?: number
}): Promise<{ is_match: boolean; feedback_message: string; score: number }> {
  try {
    const response = await fetch(`${API_BASE}/api/pronunciation/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character_id: params.characterId,
        target_hanzi: params.hanzi,
        target_pinyin: params.pinyin,
        target_tone: params.tone,
        spoken_text: params.spoken,
      }),
    })
    if (!response.ok) throw new Error("Failed to evaluate pronunciation")
    return await response.json()
  } catch {
    // Offline / fallback phonetic matching
    const clean = (text: string) =>
      text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    const targetPinyinClean = clean(params.pinyin)
    const spokenClean = clean(params.spoken)
    const isMatch = spokenClean === targetPinyinClean || params.spoken.includes(params.hanzi)

    return {
      is_match: isMatch,
      score: isMatch ? 100 : 40,
      feedback_message: isMatch
        ? `¡Excelente pronunciación! Has articulado ${params.hanzi} (${params.pinyin}) con el tono correcto.`
        : `Has dicho "${params.spoken}". Se esperaba "${params.pinyin}". Practica el tono ${params.tone}.`,
    }
  }
}

export async function resetUserProgress(): Promise<{ ok: boolean; message: string }> {
  // 1. Reset local storage SRS & unlocked IDs
  try {
    localStorage.removeItem(LOCAL_SRS_KEY)
    localStorage.removeItem(LOCAL_FSRS_KEY)
    localStorage.removeItem(LOCAL_STREAK_KEY)
    localStorage.removeItem(UNLOCKED_STORAGE_KEY)
    localStorage.removeItem("duichinese_unlocked_ids")
  } catch {
    // Ignore storage errors
  }

  // 2. If authenticated, call backend reset endpoint
  const authenticated = await hasAuthToken()
  if (authenticated) {
    try {
      const headers = await authHeaders({ "Content-Type": "application/json" })
      const res = await fetch(`${API_BASE}/api/practice/reset`, {
        method: "POST",
        headers,
      })
      if (res.ok) {
        return await res.json()
      }
    } catch {
      // In case backend is offline, local reset already completed
    }
  }

  return { ok: true, message: "Progress reset successfully." }
}

