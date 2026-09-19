import { renderAt, screen, userEvent } from "@/test/render"

describe("Flashcards page", () => {
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
    expect(screen.getByRole("button", { name: "Medium" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Easy" })).toBeInTheDocument()
  })

  it("moves to the next character with Next", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards")

    expect(await screen.findByText("不")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByText("们")).toBeInTheDocument()
  })

  it("shows pinyin first in Meaning mode", async () => {
    const user = userEvent.setup()
    renderAt("/flashcards?mode=meaning")

    expect(await screen.findByText("bù")).toBeInTheDocument()
    expect(screen.getByText("Not; negation")).toBeInTheDocument()
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
})
