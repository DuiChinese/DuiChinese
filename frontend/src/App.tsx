import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AuthProvider } from "@/hooks/use-auth"
import { SettingsProvider } from "@/hooks/use-settings"
import { AppShell } from "@/components/AppShell"
import { CharactersPage } from "@/pages/CharactersPage"
import { FlashcardsPage } from "@/pages/FlashcardsPage"
import { LandingPage } from "@/pages/LandingPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { StatsPage } from "@/pages/StatsPage"

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/characters" element={<CharactersPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  )
}

