import { vi } from "vitest"
import { renderAt, screen, userEvent } from "@/test/render"

vi.mock("@/lib/fsrs-engine", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/fsrs-engine")>()
  return {
    ...actual,
    fisherYatesShuffle: (arr: any[]) => [...arr],
  }
})

describe("Flashcards page", () => {
  beforeEach(() => {
    localStorage.clear()
  })
  it("shows the first due card with Turn around on front and reveals ratings when flipped", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards")

    expect(await screen.findByText("不")).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "Study mode" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Turn around" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Again" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Hard" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Good" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Easy" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Turn around" }))
    expect(screen.getByText("bù")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Turn around" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Again" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Hard" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Good" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Easy" })).toBeInTheDocument()
  })

  it("advances to the next character when rating a card and resets to front", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards")

    expect(await screen.findByText("不")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Turn around" }))
    await user.click(screen.getByRole("button", { name: "Easy" }))
    expect(await screen.findByText("我")).toBeInTheDocument()
    // Next card starts on front: Turn around is visible, ratings are hidden
    expect(screen.getByRole("button", { name: "Turn around" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Easy" })).not.toBeInTheDocument()
  })

  it("shows pinyin first in Meaning mode", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards?mode=meaning")

    expect(await screen.findByText("bù")).toBeInTheDocument()
    expect(screen.getByText(/Not.*negation/i)).toBeInTheDocument()
    expect(screen.queryByText("不")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Turn around" }))
    expect(screen.getByText("不")).toBeInTheDocument()
  })

  it("asks for the heard character in Listen mode", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards?mode=listen")

    expect(
      await screen.findByLabelText("Character you heard")
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText("Character you heard"), "不")
    await user.click(screen.getByRole("button", { name: "Check" }))
    expect(screen.getByText("Correct")).toBeInTheDocument()
  })

  it("lets you type pinyin in Speak mode when the microphone API is missing", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards?mode=speak")

    expect(await screen.findByText("不")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Say it" })).not.toBeInTheDocument()
    expect(screen.getByText(/type the pinyin you said/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText("Pinyin you said"), "bu")
    await user.click(screen.getByRole("button", { name: "Check" }))
    expect(screen.getByText("Heard correctly")).toBeInTheDocument()
  })

  it("repeats cards rated Hard inside the study session as in Anki", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards")

    // First card is 不
    expect(await screen.findByText("不")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Turn around" }))

    // Rate Hard
    await user.click(screen.getByRole("button", { name: "Hard" }))

    // The session is not concluded; we move through cards and 不 reappears
    // Card advances to next (我)
    expect(await screen.findByText("我")).toBeInTheDocument()
  })

  it("displays completion state when all daily due cards are reviewed with Keep reviewing and Go to Dashboard actions", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards")

    // Expect the first card to load
    expect(await screen.findByText("不")).toBeInTheDocument()

    // Flip and rate Easy for all cards in the initial due session until complete
    while (!screen.queryByText(/That's all for today!/i)) {
      const turnAroundBtn = screen.queryByRole("button", { name: "Turn around" })
      if (!turnAroundBtn) break
      await user.click(turnAroundBtn)
      const easyBtn = await screen.findByRole("button", { name: "Easy" })
      await user.click(easyBtn)
    }

    // Now all cards for today are completed!
    expect(await screen.findByText(/That's all for today!/i)).toBeInTheDocument()
    expect(screen.getByText(/You've reviewed all your scheduled characters for today/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Keep reviewing/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Dashboard/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Unlock tomorrow's cards/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Pre-learned Hanzi/i })).not.toBeInTheDocument()

    // Click "Keep reviewing" to enter free practice / Ghost Mode
    await user.click(screen.getByRole("button", { name: /Keep reviewing/i }))

    // Active deck loads cards for ghost practice
    expect(await screen.findByRole("button", { name: "Turn around" })).toBeInTheDocument()

    // Complete cards in Ghost Mode
    while (!screen.queryByText(/Practice round completed!/i)) {
      const turnAroundBtn = screen.queryByRole("button", { name: "Turn around" })
      if (!turnAroundBtn) break
      await user.click(turnAroundBtn)
      const easyBtn = await screen.findByRole("button", { name: "Easy" })
      await user.click(easyBtn)
    }

    // Ghost Mode completion screen
    expect(await screen.findByText(/Practice round completed!/i)).toBeInTheDocument()
    expect(screen.getByText(/in ghost mode/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Practicar otra ronda/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Dashboard/i })).toBeInTheDocument()
  })

  it("flips the card when pressing the Space key", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards")

    expect(await screen.findByText("不")).toBeInTheDocument()
    expect(screen.queryByText("bù")).not.toBeInTheDocument()

    // Press Space to flip
    await user.keyboard(" ")
    expect(screen.getByText("bù")).toBeInTheDocument()

    // Press Space again to unflip
    await user.keyboard(" ")
    expect(screen.queryByText("bù")).not.toBeInTheDocument()
  })
})

