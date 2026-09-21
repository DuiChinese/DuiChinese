import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"

import { HanziCard } from "@/components/HanziCard"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useCharacters } from "@/hooks/use-characters"

const TONE_FILTERS = [
  { value: "all", label: "All" },
  { value: "1", label: "Tone 1" },
  { value: "2", label: "Tone 2" },
  { value: "3", label: "Tone 3" },
  { value: "4", label: "Tone 4" },
  { value: "5", label: "Neutral" },
]

export function CharactersPage() {
  const { characters, loading } = useCharacters("all")
  const [query, setQuery] = useState("")
  const [tone, setTone] = useState("all")
  const [openId, setOpenId] = useState<number | null>(null)

  const unlockedCount = useMemo(
    () => characters.filter((c) => c.is_unlocked).length,
    [characters]
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return characters.filter((character) => {
      const matchesTone = tone === "all" || character.tone === Number(tone)
      const matchesQuery =
        needle.length === 0 ||
        character.hanzi.includes(needle) ||
        character.pinyin.toLowerCase().includes(needle) ||
        character.pinyin_clean.toLowerCase().includes(needle) ||
        character.meaning.toLowerCase().includes(needle)
      return matchesTone && matchesQuery
    })
  }, [characters, query, tone])

  const motivationalMessage = useMemo(() => {
    const pct = Math.round((unlockedCount / Math.max(1, characters.length)) * 100)
    if (pct === 0) return "Start your journey today!"
    if (pct < 10) return "Great start! Keep going!"
    if (pct < 25) return "You are doing great! Keep building momentum!"
    if (pct < 50) return "Fantastic progress! Keep going, you got this!"
    if (pct < 75) return "Over halfway there! You are doing amazing!"
    if (pct < 90) return "Almost there! Keep pushing forward!"
    if (pct < 100) return "So close to the finish line! Final stretch!"
    return "HSK 1 Completed! Outstanding achievement!"
  }, [unlockedCount, characters.length])

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 sm:px-10">
      {/* Clean HSK 1 Progress Tracker (Red & Yellow only) */}
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-2 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-1.5 font-kuaile text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-foreground/90">
              Unlocked: <strong className="text-primary font-bold">{unlockedCount}</strong> / {characters.length}
            </span>
            <span className="hidden sm:inline text-primary/40">•</span>
            <span className="text-primary font-medium tracking-wide">
              {motivationalMessage}
            </span>
          </div>
          <span className="text-primary font-bold tracking-wider ml-auto">
            {Math.round((unlockedCount / Math.max(1, characters.length)) * 100)}%
          </span>
        </div>

        {/* Clean Red & Yellow Progress Bar */}
        <div className="relative flex h-5 w-full items-center overflow-hidden rounded-full bg-[#280405]/15 p-0.5 ring-1 ring-primary/25 dark:bg-[#280405]/50">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.max(3, Math.round((unlockedCount / Math.max(1, characters.length)) * 100))}%` }}
          />
          {/* Milestone Target on the far right */}
          <div className="absolute right-1 flex items-center gap-1 rounded-full bg-[#FECB6D] px-2 py-0.5 font-kuaile text-[11px] font-bold text-[#280405] shadow-xs">
            <span>HSK 1!</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-heading text-4xl">Characters & Vocabulary</h1>
        <p className="font-heading text-lg text-foreground/90">
          Search the official HSK 1 syllabus.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <label className="w-full max-w-md">
          <span className="sr-only">Search characters</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Hanzi, pinyin, or meaning"
            className="h-12 rounded-full border-transparent bg-secondary px-5 text-secondary-foreground placeholder:text-secondary-foreground/55"
          />
        </label>

        <ToggleGroup
          value={[tone]}
          onValueChange={(value) => {
            if (value[0]) setTone(value[0])
          }}
          spacing={2}
          className="flex-wrap justify-center"
        >
          {TONE_FILTERS.map((filter) => (
            <ToggleGroupItem
              key={filter.value}
              value={filter.value}
              className="rounded-full px-4"
            >
              {filter.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-40 rounded-[1.75rem] bg-card/80"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty className="border border-dashed border-primary/40">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>No characters match</EmptyTitle>
            <EmptyDescription>
              Try another pinyin spelling, or clear the tone filter.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((character) => (
            <HanziCard
              key={character.id}
              character={character}
              size="mini"
              showAudio={true}
              locked={!character.is_unlocked}
              flipped={openId === character.id}
              onFlip={() =>
                setOpenId((current) =>
                  current === character.id ? null : character.id
                )
              }
            />
          ))}
        </div>
      )}
    </section>
  )
}
