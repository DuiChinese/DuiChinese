import { useState, type FormEvent } from "react"
import { CircleAlertIcon, CheckCircle2Icon, XIcon, Loader2Icon } from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export interface AuthCardProps {
  onClose?: () => void
  initialTab?: "signin" | "signup" | "forgot"
  title?: string
  subtitle?: string
}

export function AuthCard({
  onClose,
  initialTab = "signin",
  title,
  subtitle,
}: AuthCardProps) {
  const { signInWithGoogle, signInWithPassword, signUpWithPassword, resetPasswordForEmail } = useAuth()
  const [tab, setTab] = useState<"signin" | "signup" | "forgot">(initialTab)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const resetState = () => {
    setError(null)
    setSuccess(null)
    setSubmitting(false)
  }

  const handleGoogleSignIn = async () => {
    try {
      resetState()
      setGoogleLoading(true)
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect with Google.")
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    resetState()
    setSubmitting(true)

    try {
      if (tab === "signin") {
        await signInWithPassword(email.trim(), password)
        if (onClose) onClose()
      } else if (tab === "signup") {
        await signUpWithPassword(email.trim(), password, fullName.trim())
        setSuccess("Account created! Check your email or sign in to continue.")
      } else if (tab === "forgot") {
        await resetPasswordForEmail(email.trim())
        setSuccess("Password reset instructions have been sent to your email.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const headingText =
    tab === "forgot"
      ? "Reset Password"
      : tab === "signup"
      ? "Create Account"
      : title || "Sign In"

  const defaultSubtitle =
    tab === "forgot"
      ? "Enter your email to receive a password reset link."
      : "Save your SRS progress and sync unlocked characters."

  return (
    <div
      className="relative w-full max-w-md rounded-[2.25rem] bg-[#FDFBF7] p-7 sm:p-8 shadow-2xl ring-1 ring-[#960708]/20 text-[#7A0607] overflow-hidden mx-auto"
    >
      {/* Optional Close Button (for modal mode) */}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full bg-[#7A0607]/10 text-[#7A0607] transition-all hover:bg-[#7A0607]/20 hover:scale-105"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-garet text-2xl font-bold tracking-tight text-[#7A0607]">
          {headingText}
        </h2>
        <p className="text-xs text-[#7A0607]/75 mt-1.5 leading-relaxed">
          {subtitle || defaultSubtitle}
        </p>
      </div>

      {/* Feedback Alerts */}
      {error ? (
        <Alert variant="destructive" className="mb-4 py-2 px-3 rounded-xl border-destructive/30">
          <CircleAlertIcon className="size-4" />
          <AlertTitle className="text-xs font-bold">Authentication Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert className="mb-4 py-2 px-3 rounded-xl border-green-600/30 bg-green-50 text-green-800">
          <CheckCircle2Icon className="size-4 text-green-600" />
          <AlertTitle className="text-xs font-bold text-green-900">Success</AlertTitle>
          <AlertDescription className="text-xs">{success}</AlertDescription>
        </Alert>
      ) : null}

      {/* 1. Google 1-Click Button */}
      {tab !== "forgot" ? (
        <>
          <Button
            type="button"
            variant="outline"
            disabled={googleLoading || submitting}
            onClick={handleGoogleSignIn}
            className="w-full h-11 rounded-full border border-[#960708]/20 bg-white font-medium text-sm text-foreground shadow-xs transition-all hover:bg-white/80 hover:shadow-md active:scale-98 flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <Loader2Icon className="size-4 animate-spin text-[#960708]" />
            ) : (
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-[#7A0607]/15" />
            <span className="absolute bg-[#FDFBF7] px-3 font-mono text-[11px] uppercase tracking-wider text-[#7A0607]/60">
              or with email
            </span>
          </div>
        </>
      ) : null}

      {/* 2. Traditional Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {tab === "signup" ? (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="auth-fullname" className="text-xs font-semibold text-[#7A0607]">
                Full Name
              </FieldLabel>
              <Input
                id="auth-fullname"
                type="text"
                required
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-9 rounded-xl border border-[#960708]/20 bg-white/80 px-3 text-sm focus-visible:ring-[#960708]"
              />
            </Field>
          </FieldGroup>
        ) : null}

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="auth-email" className="text-xs font-semibold text-[#7A0607]">
              Email Address
            </FieldLabel>
            <Input
              id="auth-email"
              type="email"
              required
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 rounded-xl border border-[#960708]/20 bg-white/80 px-3 text-sm focus-visible:ring-[#960708]"
            />
          </Field>
        </FieldGroup>

        {tab !== "forgot" ? (
          <FieldGroup>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="auth-password" className="text-xs font-semibold text-[#7A0607]">
                  Password
                </FieldLabel>
                {tab === "signin" ? (
                  <button
                    type="button"
                    onClick={() => {
                      resetState()
                      setTab("forgot")
                    }}
                    className="text-xs text-[#960708] hover:underline font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                ) : null}
              </div>
              <Input
                id="auth-password"
                type="password"
                required
                placeholder="••••••••"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 rounded-xl border border-[#960708]/20 bg-white/80 px-3 text-sm focus-visible:ring-[#960708]"
              />
            </Field>
          </FieldGroup>
        ) : null}

        <Button
          type="submit"
          disabled={submitting || googleLoading}
          className="w-full h-10 mt-1 rounded-full bg-[#7A0607] text-[#FECB6D] hover:bg-[#960708] font-bold text-sm shadow-sm transition-all active:scale-98"
        >
          {submitting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : tab === "signup" ? (
            "Create Account"
          ) : tab === "forgot" ? (
            "Send Reset Link"
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Footer Mode Switcher */}
      <div className="mt-5 text-center text-xs text-[#7A0607]/80">
        {tab === "signin" ? (
          <p>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => {
                resetState()
                setTab("signup")
              }}
              className="font-bold text-[#960708] hover:underline"
            >
              Sign up
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                resetState()
                setTab("signin")
              }}
              className="font-bold text-[#960708] hover:underline"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
