import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import { AuthProvider } from "@/hooks/use-auth"
import { SettingsProvider } from "@/hooks/use-settings"
import { AppShell } from "@/components/AppShell"
import { CharactersPage } from "@/pages/CharactersPage"
import { FlashcardsPage } from "@/pages/FlashcardsPage"
import { LandingPage } from "@/pages/LandingPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { StatsPage } from "@/pages/StatsPage"

import type { User } from "@supabase/supabase-js"

const MOCK_TEST_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "test@duichinese.com",
  user_metadata: { full_name: "Test Student" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
}

export function renderAt(
  path: string,
  user: User | null = MOCK_TEST_USER,
  isGuest: boolean = false
) {
  return render(
    <AuthProvider initialUser={user} initialIsGuest={isGuest}>
      <SettingsProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/characters" element={<CharactersPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </SettingsProvider>
    </AuthProvider>
  )
}

export { screen, userEvent }
