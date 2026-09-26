import {
  fsrs,
  generatorParameters,
  createEmptyCard,
  Rating,
  State,
  type Card as FSRSCard,
  type RecordLog,
} from "ts-fsrs"
import type { UserCardProgress, ReviewRating } from "./types"

/**
 * Canonical FSRS Scheduler configured with:
 * - Target retention: 0.90 (90%)
 * - Enable fuzz: true (prevents card clustering on future review dates)
 */
export const fsrsScheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    enable_fuzz: true,
  })
)

/**
 * Creates an initial UserCardProgress entity in State 0 (New).
 */
export function createInitialUserCard(
  hanziId: string | number,
  userId: string = "local-user",
  now: Date = new Date()
): UserCardProgress {
  const empty = createEmptyCard(now)
  return {
    id: `card-${userId}-${hanziId}`,
    userId,
    hanziId: String(hanziId),
    state: 0,
    due: empty.due,
    stability: empty.stability,
    difficulty: empty.difficulty,
    elapsed_days: empty.elapsed_days,
    scheduled_days: empty.scheduled_days,
    reps: empty.reps,
    lapses: empty.lapses,
    last_review: empty.last_review ?? null,
  }
}

/**
 * Converts a UserCardProgress entity to a ts-fsrs Card object.
 */
export function toFSRSCard(progress: UserCardProgress): FSRSCard {
  return {
    due: new Date(progress.due),
    stability: progress.stability,
    difficulty: progress.difficulty,
    elapsed_days: progress.elapsed_days,
    scheduled_days: progress.scheduled_days,
    reps: progress.reps,
    lapses: progress.lapses,
    state: progress.state as State,
    last_review: progress.last_review ? new Date(progress.last_review) : undefined,
    learning_steps: 0,
  }
}

/**
 * Calculates next review state and scheduling using canonical ts-fsrs.
 * Ratings: 1 = Again, 2 = Hard, 3 = Good, 4 = Easy.
 */
export function calculateNextReview(
  card: UserCardProgress,
  rating: ReviewRating,
  now: Date = new Date()
): { nextCard: UserCardProgress; log: RecordLog[keyof RecordLog]["log"] } {
  const currentFSRSCard = toFSRSCard(card)
  const repeatRecord = fsrsScheduler.repeat(currentFSRSCard, now)

  const gradeMap: Record<ReviewRating, Rating.Again | Rating.Hard | Rating.Good | Rating.Easy> = {
    1: Rating.Again,
    2: Rating.Hard,
    3: Rating.Good,
    4: Rating.Easy,
  }

  const selectedItem = repeatRecord[gradeMap[rating]]
  const updatedFSRSCard = selectedItem.card

  const nextCard: UserCardProgress = {
    ...card,
    state: updatedFSRSCard.state as 0 | 1 | 2 | 3,
    due: updatedFSRSCard.due,
    stability: Number(updatedFSRSCard.stability.toFixed(4)),
    difficulty: Number(updatedFSRSCard.difficulty.toFixed(4)),
    elapsed_days: updatedFSRSCard.elapsed_days,
    scheduled_days: updatedFSRSCard.scheduled_days,
    reps: updatedFSRSCard.reps,
    lapses: updatedFSRSCard.lapses,
    last_review: updatedFSRSCard.last_review ?? now,
  }

  return { nextCard, log: selectedItem.log }
}

/**
 * Formats FSRS interval into the canonical UI display string.
 * - NEW: "New"
 * - LEARNING / RELEARNING (state 1 or 3): "< 1d"
 * - YOUNG & MATURE (state 2): "4d", "18d", "1.2m"
 */
export function formatInterval(state: 0 | 1 | 2 | 3, scheduledDays: number = 0): string {
  if (state === 0) {
    return "New"
  }
  if (state === 1 || state === 3 || scheduledDays < 1) {
    return "< 1d"
  }
  if (scheduledDays < 30) {
    return `${Math.round(scheduledDays)}d`
  }
  if (scheduledDays < 365) {
    const months = (scheduledDays / 30).toFixed(1)
    return `${months.endsWith(".0") ? months.slice(0, -2) : months}m`
  }
  const years = (scheduledDays / 365).toFixed(1)
  return `${years.endsWith(".0") ? years.slice(0, -2) : years}y`
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * Never iterates cards in default ID / creation / Unicode order.
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

/**
 * In-session failure handling ('Again' - Rating 1):
 * Re-inserts failed card between 3 and 5 positions behind current index.
 */
export function reinsertAgainCard<T>(queue: T[], currentIndex: number): T[] {
  if (queue.length <= 1) return [...queue]
  const nextQueue = [...queue]
  const [failedCard] = nextQueue.splice(currentIndex, 1)

  // Random offset between 3 and 5 positions ahead of current index
  const offset = 3 + Math.floor(Math.random() * 3) // 3, 4, or 5
  const insertIndex = Math.min(nextQueue.length, currentIndex + offset)

  nextQueue.splice(insertIndex, 0, failedCard)
  return nextQueue
}

/**
 * Pre-learned Hanzi initial configuration (Section 5):
 * Returns card with state = 2 (Review/Mature), stability = 21.0, difficulty = 5.0,
 * scheduled_days = random(21, 35), reps = 1, lapses = 0.
 */
export function createPrelearnedCard(
  hanziId: string | number,
  userId: string = "local-user",
  now: Date = new Date()
): UserCardProgress {
  const scheduledDays = Math.floor(Math.random() * (35 - 21 + 1)) + 21
  const due = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000)

  return {
    id: `card-${userId}-${hanziId}`,
    userId,
    hanziId: String(hanziId),
    state: 2, // Review
    due,
    stability: 21.0,
    difficulty: 5.0,
    elapsed_days: 0,
    scheduled_days: scheduledDays,
    reps: 1,
    lapses: 0,
    last_review: now,
  }
}
