import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import { AppShell } from "@/components/AppShell"
import { CharactersPage } from "@/pages/CharactersPage"
import { FlashcardsPage } from "@/pages/FlashcardsPage"
import { LandingPage } from "@/pages/LandingPage"
import { StatsPage } from "@/pages/StatsPage"

export function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

export { screen, userEvent }
