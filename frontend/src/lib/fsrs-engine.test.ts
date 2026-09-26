import { describe, it, expect } from "vitest"
import {
  createInitialUserCard,
  calculateNextReview,
  formatInterval,
  fisherYatesShuffle,
  reinsertAgainCard,
  createPrelearnedCard,
} from "./fsrs-engine"

describe("FSRS Engine", () => {
  it("creates initial card in state 0 (New)", () => {
    const card = createInitialUserCard(1, "user-test")
    expect(card.state).toBe(0)
    expect(card.reps).toBe(0)
    expect(card.lapses).toBe(0)
    expect(card.hanziId).toBe("1")
    expect(card.last_review).toBeNull()
  })

  it("calculates next review for Again (rating 1) -> Learning", () => {
    const card = createInitialUserCard(2, "user-test")
    const now = new Date()
    const { nextCard } = calculateNextReview(card, 1, now)

    expect(nextCard.state).toBe(1) // Learning
    expect(nextCard.reps).toBe(1)
    expect(nextCard.stability).toBeGreaterThan(0)

    // When a review card lapses on Again:
    const reviewCard = createPrelearnedCard(2, "user-test")
    const { nextCard: lapsedCard } = calculateNextReview(reviewCard, 1, now)
    expect(lapsedCard.state).toBe(3) // Relearning
    expect(lapsedCard.lapses).toBe(1)
  })

  it("calculates next review for Good (rating 3) -> advances stability and schedule", () => {
    const card = createInitialUserCard(3, "user-test")
    const now = new Date()
    const { nextCard } = calculateNextReview(card, 3, now)

    expect(nextCard.state).toBe(1) // Initial pass enters learning/review step
    expect(nextCard.reps).toBe(1)
    expect(nextCard.lapses).toBe(0)
    expect(nextCard.stability).toBeGreaterThan(0)
    expect(nextCard.last_review).toBeDefined()
  })

  it("formats interval accurately according to specifications", () => {
    expect(formatInterval(0, 0)).toBe("New")
    expect(formatInterval(1, 0)).toBe("< 1d")
    expect(formatInterval(3, 0)).toBe("< 1d")
    expect(formatInterval(2, 4)).toBe("4d")
    expect(formatInterval(2, 18)).toBe("18d")
    expect(formatInterval(2, 36)).toBe("1.2m")
  })

  it("applies Fisher-Yates shuffle to randomize order without mutating element set", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const shuffled = fisherYatesShuffle(original)

    expect(shuffled).toHaveLength(original.length)
    expect(new Set(shuffled)).toEqual(new Set(original))
  })

  it("re-inserts failed Again card between 3 and 5 positions behind current index", () => {
    const queue = ["A", "B", "C", "D", "E", "F", "G"]
    const nextQueue = reinsertAgainCard(queue, 0)

    expect(nextQueue).toHaveLength(queue.length)
    // "A" should no longer be at index 0
    expect(nextQueue[0]).toBe("B")
    // "A" should be placed at index 3, 4, or 5
    const newPos = nextQueue.indexOf("A")
    expect(newPos).toBeGreaterThanOrEqual(3)
    expect(newPos).toBeLessThanOrEqual(5)
  })

  it("creates pre-learned card as Mature (state 2, stability 21, interval 21-35 days)", () => {
    const card = createPrelearnedCard(42, "user-test")
    expect(card.state).toBe(2)
    expect(card.stability).toBe(21.0)
    expect(card.difficulty).toBe(5.0)
    expect(card.reps).toBe(1)
    expect(card.lapses).toBe(0)
    expect(card.scheduled_days).toBeGreaterThanOrEqual(21)
    expect(card.scheduled_days).toBeLessThanOrEqual(35)
  })
})
