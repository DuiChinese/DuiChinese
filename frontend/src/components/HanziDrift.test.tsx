import { render, waitFor } from "@testing-library/react"

import { HanziDrift } from "@/components/HanziDrift"
import { DESKTOP_HANZI_COUNT } from "@/lib/hanzi-field"

describe("HanziDrift", () => {
  it("is decorative and fills the hall with many glyphs", async () => {
    render(<HanziDrift />)

    const field = document.querySelector(".hanzi-drift")
    expect(field).toHaveAttribute("aria-hidden", "true")
    await waitFor(() => {
      expect(document.querySelectorAll(".hanzi-drift-glyph").length).toBe(
        DESKTOP_HANZI_COUNT
      )
    })
    expect(field).toHaveClass("fixed", "inset-x-0", "bottom-0")
  })
})
