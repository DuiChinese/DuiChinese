import { renderAt, screen, userEvent } from "@/test/render"
import { saveLocalFSRSMap } from "@/lib/api"
import { createInitialUserCard, createPrelearnedCard } from "@/lib/fsrs-engine"

describe("Characters page", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("lists HSK characters and filters by search", async () => {
    const user = userEvent.setup()
    renderAt("/characters")

    expect(await screen.findByText("不")).toBeInTheDocument()
    expect(screen.getByText("学")).toBeInTheDocument()

    await user.type(
      screen.getByRole("textbox", { name: "Search characters" }),
      "hao"
    )

    expect(screen.getByText("好")).toBeInTheDocument()
    expect(screen.queryByText("不")).not.toBeInTheDocument()
  })

  it("starts completely locked (0 / 200 unlocked) in fresh state", async () => {
    renderAt("/characters")

    // Expect unlocked counter to show 0
    expect(await screen.findByText(/Unlocked:/i)).toBeInTheDocument()
    expect(screen.getByText("0")).toBeInTheDocument()
    expect(screen.getByText("Start your journey today!")).toBeInTheDocument()

    // Cards have locked indicators
    const lockedIndicators = await screen.findAllByText("locked")
    expect(lockedIndicators.length).toBeGreaterThan(0)
  })

  it("dynamically unlocks characters when they have active FSRS progress (state !== 0)", async () => {
    // Character 1 has active learning progress (state: 1)
    const card1 = createInitialUserCard(1)
    card1.state = 1
    card1.reps = 1

    // Character 2 is pre-learned (state: 2)
    const card2 = createPrelearnedCard(2)

    saveLocalFSRSMap({ 1: card1, 2: card2 })

    renderAt("/characters")

    expect(await screen.findByText(/Unlocked:/i)).toBeInTheDocument()
    // Counter shows 2 unlocked
    expect(screen.getByText("2")).toBeInTheDocument()
  })
})

