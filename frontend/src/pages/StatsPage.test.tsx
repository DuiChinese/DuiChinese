import { renderAt, screen, userEvent } from "@/test/render"

describe("Stats page", () => {
  it("renders Anki counters in heading cards", async () => {
    renderAt("/stats")

    expect(await screen.findByRole("heading", { name: "Stats" })).toBeInTheDocument()
    expect(await screen.findByText("Due today")).toBeInTheDocument()
    expect(screen.getByText("Reviews")).toBeInTheDocument()
    expect(screen.getByText("Mastered")).toBeInTheDocument()
    expect(screen.getByText("Retention")).toBeInTheDocument()

    // Anki card breakdown
    expect(screen.getByText("Anki Card Distribution")).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Deck distribution progress" })).toBeInTheDocument()
    expect(screen.getAllByText("New").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Learning").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Young").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Mature").length).toBeGreaterThanOrEqual(1)
  })

  it("displays Hanzi and Pinyin table when clicking on a category", async () => {
    const user = userEvent.setup()
    renderAt("/stats")

    // Wait for stats to load and check table headers
    expect(await screen.findByRole("columnheader", { name: "Hanzi" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Pinyin" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Meaning" })).toBeInTheDocument()

    // Click on "New" category card
    const newCards = screen.getAllByRole("button", { name: /new/i })
    if (newCards.length > 0) {
      await user.click(newCards[0])
    }

    expect(screen.getByText(/Words in/i)).toBeInTheDocument()

    // Click on "Mature" category card
    const matureCards = screen.getAllByRole("button", { name: /mature/i })
    if (matureCards.length > 0) {
      await user.click(matureCards[0])
    }

    expect(screen.getByText(/Words in Mature/i)).toBeInTheDocument()
  })
})
