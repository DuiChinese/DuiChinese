import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { HanziCard } from "@/components/HanziCard"
import { HSK1_CHARACTERS } from "@/data/hsk1"

describe("HanziCard", () => {
  it("keeps pinyin hidden until the card is flipped", async () => {
    const user = userEvent.setup()
    const onFlip = vi.fn()

    const { rerender } = render(
      <HanziCard character={HSK1_CHARACTERS[0]} flipped={false} onFlip={onFlip} />
    )

    expect(screen.getByText("不")).toHaveClass("font-hanzi", "font-bold")
    const frame = document.querySelector('img[src="/assets/card-frame.jpg"]')
    expect(frame).toBeInTheDocument()
    expect(frame).toHaveAttribute("width", "1024")
    expect(frame).toHaveAttribute("height", "819")
    expect(screen.getByRole("button", { name: "Play Mandarin pronunciation for 不" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Play Mandarin slowly for 不" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "不" }))
    expect(onFlip).toHaveBeenCalled()

    rerender(
      <HanziCard character={HSK1_CHARACTERS[0]} flipped onFlip={onFlip} />
    )
    const pinyinEl = screen.getByText("bù")
    expect(pinyinEl).toBeInTheDocument()
    expect(pinyinEl).toHaveClass("font-pinyin")
  })
})
