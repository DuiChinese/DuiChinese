import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AuthWall } from "@/components/AuthWall"
import { AuthModal } from "@/components/AuthModal"
import { AuthProvider } from "@/hooks/use-auth"

describe("Authentication UI", () => {
  it("renders AuthWall directly with Google and email form in English", () => {
    render(
      <AuthProvider initialUser={null}>
        <AuthWall />
      </AuthProvider>
    )

    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it("renders AuthModal with sign in, sign up, and forgot password options in English", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(
      <AuthProvider initialUser={null}>
        <AuthModal isOpen={true} onClose={onClose} />
      </AuthProvider>
    )

    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()

    // Switch to create account
    await user.click(screen.getByRole("button", { name: /sign up/i }))
    expect(screen.getByRole("heading", { name: "Create Account" })).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()

    // Switch to forgot password
    await user.click(screen.getByRole("button", { name: /sign in/i }))
    await user.click(screen.getByText(/forgot password\?/i))
    expect(screen.getByRole("heading", { name: "Reset Password" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument()

    // Close modal
    await user.click(screen.getByRole("button", { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
