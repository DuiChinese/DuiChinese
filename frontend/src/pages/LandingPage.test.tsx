import { renderAt, screen } from "@/test/render"

describe("Landing page", () => {
  it("states the aim of the study hall without opening a flashcard", () => {
    renderAt("/")

    expect(screen.getByRole("link", { name: "DuiChinese home" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "好好学习!" })).toBeInTheDocument()
    expect(
      screen.getByText(/study hall for Hanzi/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Anki brings each character back/i)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start reviewing" })).toHaveAttribute(
      "href",
      "/flashcards"
    )

    expect(screen.queryByRole("button", { name: "Turn around" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Listen" })).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Character you heard")).not.toBeInTheDocument()
  })

  it("pins bouncing hanzi under the nav and to the viewport edges", () => {
    renderAt("/")

    const field = document.querySelector(".hanzi-drift")
    expect(field).toHaveClass("fixed", "inset-x-0", "bottom-0")
    expect(field).toHaveStyle({ top: "0px" })
    expect(document.querySelector("[data-app-header]")).toBeInTheDocument()
  })
})
