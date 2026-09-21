import { useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { LogOutIcon, UserIcon } from "lucide-react"

import { AmbientShadows } from "@/components/AmbientShadows"
import { BrandLogo } from "@/components/BrandLogo"
import { AuthModal } from "@/components/AuthModal"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "cn"

const NAV_LINKS = [
  { to: "/flashcards", label: "Flashcards" },
  { to: "/characters", label: "Characters" },
  { to: "/stats", label: "Stats" },
]

export function AppShell() {
  const location = useLocation()
  const isFlashcards = location.pathname === "/flashcards"
  const { user, signOut, loading } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Student"

  return (
    <div
      className={cn(
        "relative flex min-h-svh flex-col text-foreground",
        isFlashcards && "h-svh max-h-svh overflow-hidden select-none"
      )}
    >
      {/* 1. Rock-solid fixed background */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-0 -z-30",
          isFlashcards ? "bg-flashcard-scene" : "bg-marble-surface"
        )}
      />

      {/* 2. Ambient organic bamboo shadows */}
      <AmbientShadows className="z-15" />

      <header
        data-app-header
        className={cn(
          "relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-4 px-5 sm:px-10",
          isFlashcards ? "absolute top-0 left-0 right-0 py-2.5 z-30" : "py-3"
        )}
      >
        <BrandLogo />
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <nav aria-label="Main" className="flex flex-wrap items-center gap-2 sm:gap-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center justify-center rounded-full px-5 py-1.5 font-kuaile text-sm tracking-wide transition-all shadow-xs",
                    isActive
                      ? "bg-[#7A0607] text-[#FECB6D] ring-2 ring-[#FECB6D]/50 font-bold"
                      : "bg-[#7A0607]/85 text-[#FECB6D] hover:bg-[#7A0607] hover:scale-[1.02]"
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User Auth status in header */}
          {!loading && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#7A0607]/20">
              <div
                title={user.email}
                className="flex items-center gap-1.5 bg-[#7A0607]/90 text-[#FECB6D] px-3 py-1 rounded-full text-xs font-semibold shadow-xs"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="size-5 rounded-full object-cover ring-1 ring-[#FECB6D]/60"
                  />
                ) : (
                  <UserIcon className="size-3.5 text-[#FECB6D]" />
                )}
                <span className="max-w-28 truncate">{displayName}</span>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                title="Sign out"
                className="size-7 flex items-center justify-center rounded-full bg-[#7A0607]/20 text-[#7A0607] hover:bg-[#7A0607]/30 hover:scale-105 transition-all"
              >
                <LogOutIcon className="size-3.5" />
                <span className="sr-only">Sign out</span>
              </button>
            </div>
          ) : !loading ? (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center justify-center rounded-full px-4 py-1.5 font-kuaile text-sm tracking-wide bg-[#FECB6D] text-[#7A0607] hover:bg-[#ffe199] font-bold transition-all shadow-xs hover:scale-[1.02] border border-[#7A0607]/15 ml-1"
            >
              Sign In
            </button>
          ) : null}
        </div>
      </header>

      <main
        className={cn(
          "relative z-10 flex flex-1 flex-col",
          isFlashcards ? "h-svh max-h-svh overflow-hidden px-0 pb-0" : "px-5 pb-12 sm:px-10"
        )}
      >
        <Outlet />
      </main>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
