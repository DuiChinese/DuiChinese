import { renderAt, screen } from "@/test/render"

describe("Stats page", () => {
  it("renders Anki counters in heading cards", async () => {
    renderAt("/stats")

    expect(await screen.findByRole("heading", { name: "Stats" })).toBeInTheDocument()
    expect(await screen.findByText("Due today")).toBeInTheDocument()
    expect(screen.getByText("Reviews")).toBeInTheDocument()
    expect(screen.getByText("Mastered")).toBeInTheDocument()
    expect(screen.getByText("Retention")).toBeInTheDocument()
  })
})
