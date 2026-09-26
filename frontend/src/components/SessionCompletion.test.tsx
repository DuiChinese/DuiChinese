import { render, screen, userEvent } from "@/test/render"
import { describe, it, expect, vi } from "vitest"
import { SessionCompletion } from "@/components/SessionCompletion"

describe("SessionCompletion component", () => {
  it("renders official daily session completion state when isGhostMode is false", async () => {
    const user = userEvent.setup()
    const onPracticeAhead = vi.fn()
    const onNavigateHome = vi.fn()

    render(
      <SessionCompletion
        isGhostMode={false}
        reviewCount={10}
        onPracticeAhead={onPracticeAhead}
        onNavigateHome={onNavigateHome}
      />
    )

    // Title and congratulatory message
    expect(screen.getByRole("heading", { name: "That's all for today!" })).toBeInTheDocument()
    expect(
      screen.getByText("You've reviewed all your scheduled characters for today. Keep up the great momentum tomorrow!")
    ).toBeInTheDocument()
    expect(screen.getByText("10 reviews completed")).toBeInTheDocument()

    // Action buttons
    const keepReviewingBtn = screen.getByRole("button", { name: "Keep reviewing" })
    const dashboardBtn = screen.getByRole("button", { name: "Dashboard" })
    expect(keepReviewingBtn).toBeInTheDocument()
    expect(dashboardBtn).toBeInTheDocument()

    // Secondary button triggers practice ahead
    await user.click(keepReviewingBtn)
    expect(onPracticeAhead).toHaveBeenCalledTimes(1)

    // Primary button navigates home
    await user.click(dashboardBtn)
    expect(onNavigateHome).toHaveBeenCalledTimes(1)
  })

  it("renders ghost practice round completion state when isGhostMode is true", async () => {
    const user = userEvent.setup()
    const onPracticeAhead = vi.fn()
    const onNavigateHome = vi.fn()

    render(
      <SessionCompletion
        isGhostMode={true}
        reviewCount={5}
        onPracticeAhead={onPracticeAhead}
        onNavigateHome={onNavigateHome}
      />
    )

    // Title and ghost mode message
    expect(screen.getByRole("heading", { name: "Practice round completed!" })).toBeInTheDocument()
    expect(screen.getByText("You have reviewed 5 cards in ghost mode.")).toBeInTheDocument()
    expect(screen.getByText(/Ghost Practice · FSRS data unaffected/i)).toBeInTheDocument()

    // Action buttons
    const practiceAnotherBtn = screen.getByRole("button", { name: "Practicar otra ronda" })
    const dashboardBtn = screen.getByRole("button", { name: "Dashboard" })
    expect(practiceAnotherBtn).toBeInTheDocument()
    expect(dashboardBtn).toBeInTheDocument()

    // Secondary button triggers another practice round
    await user.click(practiceAnotherBtn)
    expect(onPracticeAhead).toHaveBeenCalledTimes(1)

    // Primary button navigates home
    await user.click(dashboardBtn)
    expect(onNavigateHome).toHaveBeenCalledTimes(1)
  })

  it("handles singular card text correctly in both modes", () => {
    const { rerender } = render(
      <SessionCompletion
        isGhostMode={false}
        reviewCount={1}
        onPracticeAhead={vi.fn()}
        onNavigateHome={vi.fn()}
      />
    )
    expect(screen.getByText("1 review completed")).toBeInTheDocument()

    rerender(
      <SessionCompletion
        isGhostMode={true}
        reviewCount={1}
        onPracticeAhead={vi.fn()}
        onNavigateHome={vi.fn()}
      />
    )
    expect(screen.getByText("You have reviewed 1 card in ghost mode.")).toBeInTheDocument()
  })
})
