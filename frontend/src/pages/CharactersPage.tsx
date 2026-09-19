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

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-heading text-4xl">Characters</h1>
        <p className="font-heading text-lg text-foreground/90">
          Search the HSK 1 paper deck.
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
              showAudio={false}
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
