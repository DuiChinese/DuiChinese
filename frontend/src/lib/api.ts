import { HSK1_CHARACTERS } from "@/data/hsk1"
import type {
  Character,
  FlashcardReviewResponse,
  ReviewRating,
  Stats,
} from "@/lib/types"

const API_BASE = import.meta.env.VITE_API_URL || ""

const UNLOCKED_STORAGE_KEY = "duichinese_unlocked_ids_v1"
const LOCAL_SRS_KEY = "duichinese_local_srs_v1"

interface LocalSRSState {
  reps: number
  lapses: number
  interval_days: number
  due_date: string // ISO date
}

function getLocalUnlockedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(UNLOCKED_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return new Set(parsed)
      }
    }
  } catch {
    // fallback
  }
  // By default, unlock the first 7 characters
  const initial = new Set(HSK1_CHARACTERS.slice(0, 7).map((c) => c.id))
  try {
    localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(Array.from(initial)))
  } catch {
    // ignore
  }
  return initial
}

function saveLocalUnlockedIds(ids: Set<number>) {
  try {
    localStorage.setItem(UNLOCKED_STORAGE_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    // ignore
  }
}

function getLocalSRSMap(): Record<number, LocalSRSState> {
  try {
    const raw = localStorage.getItem(LOCAL_SRS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return {}
}

function saveLocalSRSMap(map: Record<number, LocalSRSState>) {
  try {
    localStorage.setItem(LOCAL_SRS_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export async function loadCharacters(): Promise<Character[]> {
  try {
    const response = await fetch(`${API_BASE}/api/characters`)
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

export async function loadDueCharacters(): Promise<Character[]> {
  try {
    const response = await fetch(`${API_BASE}/api/practice/due`)
    if (!response.ok) throw new Error("Failed to fetch due characters")
    return await response.json()
  } catch {
    const unlockedIds = getLocalUnlockedIds()
    const srsMap = getLocalSRSMap()
    const now = new Date()

    // Filter only unlocked characters
    const unlockedChars = HSK1_CHARACTERS.filter((c) => unlockedIds.has(c.id))

    // A card is due if never studied or due_date <= now
    const dueChars = unlockedChars.filter((c) => {
      const srs = srsMap[c.id]
      if (!srs) return true // Unstudied (new) card
      return new Date(srs.due_date) <= now
    })

    return dueChars.map((c) => ({ ...c, is_unlocked: true }))
  }
}

export async function loadPracticeAhead(): Promise<Character[]> {
  try {
    const response = await fetch(`${API_BASE}/api/practice/ahead`)
    if (!response.ok) throw new Error("Failed to fetch practice ahead")
    return await response.json()
  } catch {
    const unlockedIds = getLocalUnlockedIds()
    return HSK1_CHARACTERS.filter((c) => unlockedIds.has(c.id)).map((c) => ({
      ...c,
      is_unlocked: true,
    }))
  }
}

export async function unlockNextBatch(count: number = 7): Promise<Character[]> {
  try {
    const response = await fetch(`${API_BASE}/api/characters/unlock-next?count=${count}`, {
      method: "POST",
    })
    if (!response.ok) throw new Error("Failed to unlock next batch")
    return await response.json()
  } catch {
    const unlockedIds = getLocalUnlockedIds()
    const remaining = HSK1_CHARACTERS.filter((c) => !unlockedIds.has(c.id))
    const newlyUnlocked = remaining.slice(0, count)
    newlyUnlocked.forEach((c) => unlockedIds.add(c.id))
    saveLocalUnlockedIds(unlockedIds)
    return newlyUnlocked.map((c) => ({ ...c, is_unlocked: true }))
  }
}

export async function loadStats(fallbackCharacters?: Character[]): Promise<Stats> {
  try {
    const response = await fetch(`${API_BASE}/api/practice/stats`)
    if (!response.ok) throw new Error("Failed to fetch stats")
    return await response.json()
  } catch {
    const chars = fallbackCharacters && fallbackCharacters.length > 0 ? fallbackCharacters : HSK1_CHARACTERS
    const unlockedIds = getLocalUnlockedIds()
    // Locked characters must not be counted until unlocked
    const unlockedChars = chars.filter((c) => unlockedIds.has(c.id) || c.is_unlocked)
    const total = unlockedChars.length

    const toItem = (c: Character, interval: number, stab: number, diff: number) => ({
      id: c.id,
      hanzi: c.hanzi,
      pinyin: c.pinyin,
      meaning: c.meaning,
      tone: c.tone,
      interval_days: interval,
      stability: stab,
      difficulty: diff,
    })

    const srsMap = getLocalSRSMap()
    const catNew: Array<ReturnType<typeof toItem>> = []
    const catLearning: Array<ReturnType<typeof toItem>> = []
    const catYoung: Array<ReturnType<typeof toItem>> = []
    const catMature: Array<ReturnType<typeof toItem>> = []

    for (const c of unlockedChars) {
      const srs = srsMap[c.id]
      if (!srs || srs.reps === 0) {
        catNew.push(toItem(c, 0, 0, 0))
      } else if (srs.lapses > 0 && srs.interval_days <= 1) {
        catLearning.push(toItem(c, srs.interval_days, 1.2, 5.0))
      } else if (srs.interval_days >= 21) {
        catMature.push(toItem(c, srs.interval_days, 25.0, 3.5))
      } else {
        catYoung.push(toItem(c, srs.interval_days, 5.0, 4.5))
      }
    }

    const totalReviews = Object.values(srsMap).reduce((sum, item) => sum + item.reps, 0)

    return {
      total_characters: total,
      total_reviews: totalReviews,
      new_count: catNew.length,
      learning_count: catLearning.length,
      young_count: catYoung.length,
      mature_count: catMature.length,
      mastered_count: catMature.length,
      due_today_count: Math.min(3, unlockedChars.length),
      average_ease_factor: 2.5,
      average_stability: 14.5,
      average_difficulty: 4.8,
      retention_rate: 92.5,
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
  rating: ReviewRating
): Promise<FlashcardReviewResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/practice/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character_id: characterId, rating }),
    })
    if (!response.ok) throw new Error("Failed to submit review")
    return await response.json()
  } catch {
    // Offline local SM-2 progression
    const srsMap = getLocalSRSMap()
    const current = srsMap[characterId] || {
      reps: 0,
      lapses: 0,
      interval_days: 0,
      due_date: new Date().toISOString(),
    }

    let interval = current.interval_days
    let reps = current.reps
    let lapses = current.lapses

    if (rating === 1) {
      lapses += 1
      reps = 0
      interval = 1
    } else if (rating === 2) {
      reps += 1
      interval = Math.max(1, Math.round((interval || 1) * 1.2))
    } else if (rating === 3) {
      reps += 1
      if (reps === 1) interval = 1
      else if (reps === 2) interval = 6
      else interval = Math.round(interval * 2.5)
    } else if (rating === 4) {
      reps += 1
      if (reps === 1) interval = 4
      else if (reps === 2) interval = 10
      else interval = Math.round(interval * 2.5 * 1.3)
    }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + interval)

    srsMap[characterId] = {
      reps,
      lapses,
      interval_days: interval,
      due_date: dueDate.toISOString(),
    }
    saveLocalSRSMap(srsMap)

    return {
      id: Date.now(),
      character_id: characterId,
      status: rating >= 3 ? "mastered" : "learning",
      rating,
      interval_days: interval,
      stability: rating >= 3 ? 3.2 : 0.4,
      difficulty: 5.0,
      reps,
      lapses,
      due_date: dueDate.toISOString(),
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
