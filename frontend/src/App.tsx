import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AppShell } from "@/components/AppShell"
import { CharactersPage } from "@/pages/CharactersPage"
import { FlashcardsPage } from "@/pages/FlashcardsPage"
import { LandingPage } from "@/pages/LandingPage"
import { StatsPage } from "@/pages/StatsPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/stats" element={<StatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
