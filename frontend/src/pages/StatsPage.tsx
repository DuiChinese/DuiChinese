import { useEffect, useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCharacters } from "@/hooks/use-characters"
import { loadStats } from "@/lib/api"
import type { Stats } from "@/lib/types"

export function StatsPage() {
  const { characters, loading: loadingCharacters } = useCharacters("all")
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (loadingCharacters) return
    let active = true
    loadStats(characters).then((data) => {
      if (active) setStats(data)
    })
    return () => {
      active = false
    }
  }, [characters, loadingCharacters])

  const cards = stats
    ? [
        {
          label: "Due today",
          value: String(stats.due_today_count),
          hint: "Cards waiting on the desk",
        },
        {
          label: "Reviews",
          value: String(stats.total_reviews),
          hint: "Times you turned a card",
        },
        {
          label: "Mastered",
          value: String(stats.mastered_count),
          hint: "Rated medium or easy",
        },
        {
          label: "Retention",
          value: `${stats.retention_rate}%`,
          hint: "Share of ratings 3 and 4",
        },
      ]
    : []

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-heading text-4xl">Stats</h1>
        <p className="font-heading text-lg text-foreground/90">
          Anki memory, counted in gold.
        </p>
      </div>

      {stats ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {cards.map((item) => (
            <Card key={item.label} className="rounded-[1.75rem] ring-0">
              <CardHeader>
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="font-heading text-5xl">
                  {item.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{item.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-40 rounded-[1.75rem] bg-card/80"
            />
          ))}
        </div>
      )}
    </section>
  )
}
