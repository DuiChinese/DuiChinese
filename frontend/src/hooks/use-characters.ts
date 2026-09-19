import { useEffect, useState } from "react"

import { loadCharacters, loadDueCharacters } from "@/lib/api"
import type { Character } from "@/lib/types"

export function useCharacters(mode: "all" | "due" = "all") {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loader = mode === "due" ? loadDueCharacters : loadCharacters

    loader()
      .then((data) => {
        if (active) setCharacters(data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [mode])

  return { characters, loading }
}
