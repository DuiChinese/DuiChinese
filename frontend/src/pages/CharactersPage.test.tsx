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
})
