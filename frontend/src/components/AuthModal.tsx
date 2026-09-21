import { AuthCard } from "@/components/AuthCard"

export interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: "signin" | "signup" | "forgot"
  title?: string
  subtitle?: string
}

export function AuthModal({
  isOpen,
  onClose,
  initialTab = "signin",
  title,
  subtitle,
}: AuthModalProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
        <AuthCard
          onClose={onClose}
          initialTab={initialTab}
          title={title}
          subtitle={subtitle}
        />
      </div>
    </div>
  )
}
