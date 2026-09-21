import { renderAt, screen, userEvent } from "@/test/render"

describe("Characters page", () => {
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

  it("distinguishes unlocked characters from locked ones in gray", async () => {
    renderAt("/characters")

    // Expect unlocked count counter to be visible
    expect(await screen.findByText(/Unlocked:/i)).toBeInTheDocument()

    // Characters beyond the first 7 are locked
    const lockedIndicators = await screen.findAllByText("locked")
    expect(lockedIndicators.length).toBeGreaterThan(0)
  })
})

