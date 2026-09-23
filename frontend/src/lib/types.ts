export interface ExampleWord {
  chinese: string
  pinyin: string
  meaning: string
}

export interface Character {
  id: number
  hanzi: string
  pinyin: string
  pinyin_clean: string
  tone: number
  meaning: string
  radical?: string | null
  stroke_count?: number | null
  hsk_level: number
  order_index?: number
  is_unlocked?: boolean
  mnemonic?: string | null
  examples?: ExampleWord[]
}

export type ReviewRating = 1 | 2 | 3 | 4 // 1: Again, 2: Hard, 3: Good/Medium, 4: Easy

export interface CategoryCharacterItem {
  id: number
  hanzi: string
  pinyin: string
  meaning: string
  tone: number
  interval_days?: number
  stability?: number
  difficulty?: number
}

export interface StatsCategories {
  new: CategoryCharacterItem[]
  learning: CategoryCharacterItem[]
  young: CategoryCharacterItem[]
  mature: CategoryCharacterItem[]
}

export interface Stats {
  total_characters: number
  total_reviews: number
  new_count: number
  learning_count: number
  young_count: number
  mature_count: number
  mastered_count: number
  due_today_count: number
  current_streak?: number
  average_ease_factor?: number
  average_stability?: number
  average_difficulty?: number
  retention_rate: number
  categories?: StatsCategories
}

export interface FlashcardReviewResponse {
  id: number
  character_id: number
  status: string
  rating: number
  interval_days: number
  stability?: number
  difficulty?: number
  reps: number
  lapses: number
  due_date?: string | null
}

export interface PronunciationEvaluation {
  is_correct: boolean
  pinyin_expected: string
  pinyin_detected: string
  similarity_score: number
  feedback: string
}
