import { NavLink, Outlet, useLocation } from "react-router-dom"

import { BrandLogo } from "@/components/BrandLogo"
import { cn } from "cn"

const NAV_LINKS = [
  { to: "/flashcards", label: "Flashcards" },
  { to: "/characters", label: "Characters" },
  { to: "/stats", label: "Stats" },
]

export function AppShell() {
  const location = useLocation()
  const isFlashcards = location.pathname === "/flashcards"

  return (
    <div
      className={cn(
        "flex flex-col text-foreground",
        isFlashcards
          ? "h-svh max-h-svh overflow-hidden bg-flashcard-scene select-none"
          : "min-h-svh bg-marble-surface"
      )}
    >
      <header
        data-app-header
        className={cn(
          "relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-4 px-5 sm:px-10",
          isFlashcards ? "absolute top-0 left-0 right-0 py-2.5 z-30" : "py-3"
        )}
      >
        <BrandLogo />
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
      </header>
      <main
        className={cn(
          "flex flex-1 flex-col",
          isFlashcards ? "h-svh max-h-svh overflow-hidden px-0 pb-0" : "px-5 pb-12 sm:px-10"
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}
