import { renderAt, screen, userEvent } from "@/test/render"

describe("Flashcards page", () => {
  beforeEach(() => {
    localStorage.clear()
  })
  it("shows the first due card and reveals the Anki ratings after a flip", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards")

    expect(await screen.findByText("不")).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "Study mode" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Easy" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Turn around" }))

    expect(screen.getByText("bù")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Again" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Hard" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Good" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Easy" })).toBeInTheDocument()
  })

  it("moves to the next character with Next", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards")

    expect(await screen.findByText("不")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByText("我")).toBeInTheDocument()
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

  it("displays completion state when all daily due cards are reviewed and allows unlocking next batch", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards")

    // Expect the first card to load
    expect(await screen.findByText("不")).toBeInTheDocument()

    // Flip and rate Easy through both passes for all cards in the initial due session until consolidated
    while (!screen.queryByText(/That's all for today!/i)) {
      const turnAroundBtn = screen.queryByRole("button", { name: "Turn around" })
      if (!turnAroundBtn) break
      await user.click(turnAroundBtn)
      const easyBtn = await screen.findByRole("button", { name: "Easy" })
      await user.click(easyBtn)
    }

    // Now all cards for today are completed!
    expect(await screen.findByText(/That's all for today!/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Keep reviewing/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Unlock tomorrow's cards/i })).toBeInTheDocument()

    // Click to unlock next batch
    await user.click(screen.getByRole("button", { name: /Unlock tomorrow's cards/i }))

    // Next batch is loaded into study session (contains 你好)
    expect(await screen.findByText("你好")).toBeInTheDocument()
  })
})

