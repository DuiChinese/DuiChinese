import { describe, expect, it, vi } from "vitest"
import { renderAt, screen, userEvent } from "@/test/render"
import * as api from "@/lib/api"

describe("SettingsPage", () => {
  it("renders Settings page with all configuration sections in English", () => {
    renderAt("/settings")

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument()
    expect(screen.getByText("Appearance & Atmosphere")).toBeInTheDocument()
    expect(screen.getByText("Audio & Pronunciation")).toBeInTheDocument()
    expect(screen.getByText("Study Goals")).toBeInTheDocument()
    expect(screen.getByText("Danger Zone")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /reset account progress/i })
    ).toBeInTheDocument()
  })

  it("toggles ambient shadows setting when clicking the switch", async () => {
    const user = userEvent.setup()
    renderAt("/settings")

    const switchBtn = screen.getByRole("switch", {
      name: /toggle ambient bamboo shadows/i,
    })
    expect(switchBtn).toHaveAttribute("aria-checked", "true")

    // Click to disable shadows
    await user.click(switchBtn)
    expect(switchBtn).toHaveAttribute("aria-checked", "false")

    // Click again to re-enable
    await user.click(switchBtn)
    expect(switchBtn).toHaveAttribute("aria-checked", "true")
  })

  it("updates speech speed and card goals", async () => {
    const user = userEvent.setup()
    renderAt("/settings")

    // Change speech speed to slow
    const slowBtn = screen.getByRole("button", { name: /slow \(0\.75x\)/i })
    await user.click(slowBtn)
    expect(slowBtn).toHaveClass("bg-[#7A0607]")

    // Change daily goal to 14
    const goal14Btn = screen.getByRole("button", { name: /14/i })
    await user.click(goal14Btn)
    expect(goal14Btn).toHaveClass("bg-[#7A0607]")
  })

  it("opens confirmation dialog with warning before resetting progress, can cancel", async () => {
    const user = userEvent.setup()
    renderAt("/settings")

    const resetBtn = screen.getByRole("button", {
      name: /reset account progress/i,
    })
    await user.click(resetBtn)

    // Dialog should appear with clear warning text
    expect(
      screen.getByRole("heading", { name: "Reset All Progress?" })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/this action cannot be undone/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/srs history:/i)).toBeInTheDocument()

    // Clicking Cancel closes modal
    const cancelBtn = screen.getByRole("button", { name: /cancel/i })
    await user.click(cancelBtn)

    expect(
      screen.queryByRole("heading", { name: "Reset All Progress?" })
    ).not.toBeInTheDocument()
  })

  it("confirms progress reset and shows success feedback", async () => {
    const user = userEvent.setup()
    const resetSpy = vi.spyOn(api, "resetUserProgress").mockResolvedValue({
      ok: true,
      message: "Progress reset successfully.",
    })

    renderAt("/settings")

    // Open dialog
    await user.click(
      screen.getByRole("button", { name: /reset account progress/i })
    )

    // Confirm reset
    const confirmBtn = screen.getByRole("button", {
      name: /yes, reset all progress/i,
    })
    await user.click(confirmBtn)

    expect(resetSpy).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByText("Progress reset successfully.")
    ).toBeInTheDocument()

    resetSpy.mockRestore()
  })

  it("displays guest mode indicator when visiting as guest", () => {
    renderAt("/settings", null, true)

    expect(screen.getByText(/guest mode:/i)).toBeInTheDocument()
  })
})
