import { NavLink, Outlet } from "react-router-dom"

import { BrandLogo } from "@/components/BrandLogo"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

const NAV_LINKS = [
  { to: "/flashcards", label: "Flashcards" },
  { to: "/characters", label: "Characters" },
  { to: "/stats", label: "Stats" },
]

export function AppShell() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-4 px-5 py-5 sm:gap-6 sm:px-10">
        <BrandLogo />
        <nav aria-label="Main" className="flex flex-wrap items-center gap-3">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  buttonVariants({ variant: "default", size: "nav" }),
                  isActive && "ring-2 ring-primary-foreground/20"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex flex-1 flex-col px-5 pb-12 sm:px-10">
        <Outlet />
      </main>
    </div>
  )
}
