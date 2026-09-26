import { renderAt, screen, userEvent } from "@/test/render"
import { saveLocalFSRSMap } from "@/lib/api"
import { createPrelearnedCard } from "@/lib/fsrs-engine"

describe("Stats page", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders Anki counters in heading cards", async () => {
    renderAt("/stats")

    expect(await screen.findByRole("heading", { name: "Stats" })).toBeInTheDocument()
    expect(await screen.findByText("Due today")).toBeInTheDocument()
    expect(screen.getByText("Reviews")).toBeInTheDocument()
    expect(screen.getByText("Mastered")).toBeInTheDocument()
    expect(screen.getByText("Retention")).toBeInTheDocument()
    expect(screen.getByText("Daily Streak")).toBeInTheDocument()

    // Anki card breakdown
    expect(screen.getByText("Anki Card Distribution")).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Deck distribution progress" })).toBeInTheDocument()
    expect(screen.getAllByText("New").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Learning").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Young").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("Mature").length).toBeGreaterThanOrEqual(1)
  })

  it("displays Hanzi and Pinyin table when clicking on a category with words", async () => {
    const user = userEvent.setup()
    saveLocalFSRSMap({
      1: createPrelearnedCard(1),
    })

    renderAt("/stats")

    // Click on "Mature" category card
    const matureCards = await screen.findAllByRole("button", { name: /mature/i })
    expect(matureCards.length).toBeGreaterThan(0)
    await user.click(matureCards[0])

    // Wait for table to display with headers
    expect(await screen.findByRole("columnheader", { name: "Hanzi" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Pinyin" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Meaning" })).toBeInTheDocument()
    expect(screen.getByText(/Words in Mature/i)).toBeInTheDocument()
  })
})
