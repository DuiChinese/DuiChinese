import { useEffect, useMemo, useState } from "react"
import {
  BookOpenIcon,
  BrainIcon,
  CalendarIcon,
  CheckCircle2Icon,
  FlameIcon,
  SearchIcon,
  SparklesIcon,
  TargetIcon,
  TimerIcon,
  Volume2Icon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthWall } from "@/components/AuthWall"
import { useAuth } from "@/hooks/use-auth"
import { useCharacters } from "@/hooks/use-characters"
import { loadStats } from "@/lib/api"
import { toChineseNumeral } from "@/lib/chinese-numerals"
import { playPronunciation } from "@/lib/speech"
import type { CategoryCharacterItem, Stats } from "@/lib/types"

type CategoryKey = "new" | "learning" | "young" | "mature"

interface CategoryMeta {
  key: CategoryKey
  label: string
  subtitle: string
  hint: string
  colorClass: string
  borderClass: string
  barClass: string
  accentBgClass: string
  icon: typeof BookOpenIcon
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: "new",
    label: "New",
    subtitle: "Never reviewed",
    hint: "Words waiting to enter your study queue",
    colorClass: "text-[#9E7B58]",
    borderClass: "border-l-[#9E7B58]",
    barClass: "bg-[#9E7B58]",
    accentBgClass: "bg-[#9E7B58]/12 text-[#805D3D]",
    icon: BookOpenIcon,
  },
  {
    key: "learning",
    label: "Learning",
    subtitle: "Intraday steps",
    hint: "Words in initial learning or relearning after a lapse",
    colorClass: "text-[#D97706]",
    borderClass: "border-l-[#D97706]",
    barClass: "bg-[#D97706]",
    accentBgClass: "bg-[#D97706]/15 text-[#B45309]",
    icon: TimerIcon,
  },
  {
    key: "young",
    label: "Young",
    subtitle: "Interval < 21 days",
    hint: "Graduated cards recently reviewed with interval under 21 days",
    colorClass: "text-[#B9472E]",
    borderClass: "border-l-[#B9472E]",
    barClass: "bg-[#B9472E]",
    accentBgClass: "bg-[#B9472E]/15 text-[#9A351E]",
    icon: FlameIcon,
  },
  {
    key: "mature",
    label: "Mature",
    subtitle: "Interval ≥ 21 days",
    hint: "Consolidated long-term memories with interval of 21 days or more",
    colorClass: "text-[#7A0607]",
    borderClass: "border-l-[#7A0607]",
    barClass: "bg-[#7A0607]",
    accentBgClass: "bg-[#7A0607]/15 text-[#7A0607]",
    icon: CheckCircle2Icon,
  },
]

export function StatsPage() {
  const { user, loading: authLoading, isGuest } = useAuth()
  const { characters, loading: loadingCharacters } = useCharacters("all")
  const [stats, setStats] = useState<Stats | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("new")
  const [filterQuery, setFilterQuery] = useState("")

  useEffect(() => {
    if (loadingCharacters) return
    let active = true
    loadStats(characters).then((data) => {
      if (active) {
        setStats(data)
        // Auto-select category with cards
        if (data.learning_count > 0) setSelectedCategory("learning")
        else if (data.young_count > 0) setSelectedCategory("young")
        else if (data.mature_count > 0) setSelectedCategory("mature")
        else setSelectedCategory("new")
      }
    })
    return () => {
      active = false
    }
  }, [characters, loadingCharacters])

  const total = stats ? Math.max(1, stats.total_characters) : 1
  const pct = (val: number) => Math.round((val / total) * 100)

  const activeMeta = CATEGORIES.find((c) => c.key === selectedCategory) ?? CATEGORIES[0]

  // Retrieve words for selected category
  const categoryWords = useMemo<CategoryCharacterItem[]>(() => {
    if (!stats?.categories) return []
    return stats.categories[selectedCategory] || []
  }, [stats, selectedCategory])

  // Filter words by search query
  const filteredWords = useMemo(() => {
    if (!filterQuery.trim()) return categoryWords
    const q = filterQuery.toLowerCase().trim()
    return categoryWords.filter(
      (w) =>
        w.hanzi.includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q)
    )
  }, [categoryWords, filterQuery])

  if (!authLoading && !user && !isGuest) {
    return (
      <section className="relative flex flex-1 min-h-[calc(100svh-6rem)] w-full items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <AuthWall />
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 pb-16 sm:px-10">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-4xl text-[#7A0607]">Stats</h1>
        <p className="font-heading text-lg text-[#7A0607]/85">
          FSRS Spaced Repetition & Anki Card Distribution
        </p>

        {isGuest ? (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#FECB6D]/30 border border-[#7A0607]/20 px-4 py-1 font-kuaile text-xs text-[#7A0607]">
            <span className="font-bold">Guest Mode:</span>
            <span>Progress is stored locally in this browser.</span>
          </div>
        ) : null}
      </div>

      {stats ? (
        <>
          {/* Daily Streak Card */}
          <Card className="rounded-[1.75rem] ring-1 ring-[#7A0607]/15 overflow-hidden shadow-sm bg-[#F5F2EB]/95">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-xl font-heading text-[#7A0607]">
                    Daily Streak
                  </CardTitle>
                  <CardDescription className="text-[#7A0607]/75 text-xs sm:text-sm">
                    Keep your daily study habit alive
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-1 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Flame Icon without frame */}
                <img
                  src="/assets/streak-flame.png"
                  alt="Streak Flame"
                  className="size-8 sm:size-9 object-contain flame-icon-pulse shrink-0"
                />
                <div className="flex items-baseline gap-2">
                  <span
                    aria-label={`Streak: ${stats.current_streak || 0} days`}
                    className="font-kuaile text-3xl sm:text-4xl text-[#7A0607] select-none font-bold leading-none"
                  >
                    {toChineseNumeral(stats.current_streak || 0)}
                  </span>
                  <span className="font-garet text-xs sm:text-sm text-[#7A0607]/70 font-medium">
                    ({stats.current_streak || 0} {stats.current_streak === 1 ? "day" : "days"})
                  </span>
                </div>
              </div>

              {/* Daily Motivational Chinese Proverb */}
              <div className="rounded-xl bg-[#FFF9EE]/80 dark:bg-stone-900/40 border border-[#7A0607]/15 py-1.5 px-3 text-left sm:text-right shrink-0">
                <div className="font-hanzi text-xs sm:text-sm text-[#7A0607] font-bold tracking-wide">
                  持之以恒，金石可镂
                </div>
                <div className="font-garet text-[11px] text-[#7A0607]/70 italic mt-0.5">
                  "Perseverance carves through metal and stone"
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anki Card Distribution Card with Redesigned Warm Progress Bar */}
          <Card className="rounded-[1.75rem] ring-1 ring-[#7A0607]/15 overflow-hidden shadow-sm bg-[#F5F2EB]/95">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-xl font-heading text-[#7A0607]">
                    Anki Card Distribution
                  </CardTitle>
                  <CardDescription className="text-[#7A0607]/75 text-xs sm:text-sm">
                    Total of {stats.total_characters} characters in deck · Click a category to view Hanzi
                  </CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className="gap-1 font-mono text-xs bg-[#FECB6D]/30 text-[#7A0607] border border-[#7A0607]/20"
                >
                  <BrainIcon className="h-3 w-3" /> FSRS Model
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Sleek, polished progress bar */}
              <div
                role="progressbar"
                aria-label="Deck distribution progress"
                className="flex h-7 w-full overflow-hidden rounded-full bg-[#EADFCF]/60 p-1 ring-1 ring-[#7A0607]/15 shadow-inner gap-1"
              >
                {CATEGORIES.map((cat) => {
                  const count =
                    cat.key === "new"
                      ? stats.new_count
                      : cat.key === "learning"
                      ? stats.learning_count
                      : cat.key === "young"
                      ? stats.young_count
                      : stats.mature_count
                  const p = pct(count)
                  if (p <= 0) return null
                  const isSelected = selectedCategory === cat.key
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      style={{ width: `${p}%` }}
                      className={`h-full ${cat.barClass} rounded-full flex items-center justify-center font-kuaile text-[11px] sm:text-xs text-[#FFFDF8] transition-all hover:brightness-110 cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-[#7A0607] ring-offset-1 font-bold shadow-xs brightness-105"
                          : "opacity-95 hover:opacity-100"
                      }`}
                      title={`${cat.label}: ${count} (${p}%)`}
                    >
                      {p >= 10 ? (
                        <span className="truncate px-1 tracking-wide">{p}%</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              {/* Legend with interactive category buttons in warm tones */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {CATEGORIES.map((cat) => {
                  const count =
                    cat.key === "new"
                      ? stats.new_count
                      : cat.key === "learning"
                      ? stats.learning_count
                      : cat.key === "young"
                      ? stats.young_count
                      : stats.mature_count
                  const isSelected = selectedCategory === cat.key
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-2xl text-left transition-all border ${
                        isSelected
                          ? "bg-[#FDFBF7] font-semibold border-[#7A0607]/40 ring-2 ring-[#7A0607]/20 shadow-sm"
                          : "bg-[#F5F2EB]/60 border-transparent hover:bg-[#F5F2EB] opacity-90 hover:opacity-100"
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${cat.barClass} shrink-0 shadow-xs`} />
                      <span className="font-kuaile text-sm text-[#7A0607] tracking-wide">{cat.label}:</span>
                      <span className="font-kuaile text-xs sm:text-sm text-[#7A0607]/75 ml-auto font-medium">
                        {count} <span className="text-[11px] opacity-75">({pct(count)}%)</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Interactive Anki Category Cards (Clickable) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              const count =
                cat.key === "new"
                  ? stats.new_count
                  : cat.key === "learning"
                  ? stats.learning_count
                  : cat.key === "young"
                  ? stats.young_count
                  : stats.mature_count
              const isSelected = selectedCategory === cat.key

              return (
                <Card
                  key={cat.key}
                  role="button"
                  tabIndex={0}
                  aria-label={cat.label}
                  onClick={() => setSelectedCategory(cat.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelectedCategory(cat.key)
                    }
                  }}
                  className={`rounded-[1.75rem] cursor-pointer transition-all border-l-4 shadow-sm ${
                    cat.borderClass
                  } ${
                    isSelected
                      ? "ring-2 ring-[#7A0607] ring-offset-2 scale-[1.02] shadow-md bg-[#FDFBF7]"
                      : "bg-[#F5F2EB]/90 opacity-90 hover:opacity-100 hover:scale-[1.01] hover:bg-[#F5F2EB]"
                  }`}
                >
                  <CardHeader className="pb-1">
                    <div className="flex items-center justify-between">
                      <span className={`${cat.colorClass} font-kuaile font-bold text-xs tracking-wider uppercase`}>
                        {cat.label}
                      </span>
                      <div className={`p-1.5 rounded-lg ${cat.accentBgClass}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <CardTitle className="font-heading text-4xl text-[#7A0607]">
                      {count}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-[#7A0607]/70 font-medium">{cat.subtitle}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Hanzi Category Word Explorer Table */}
          <Card className="rounded-[1.75rem] ring-1 ring-[#7A0607]/15 overflow-hidden shadow-sm bg-[#F5F2EB]/95">
            <CardHeader className="border-b border-[#7A0607]/10 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-card border ${activeMeta.borderClass} ${activeMeta.accentBgClass}`}>
                    <activeMeta.icon className={`h-5 w-5 ${activeMeta.colorClass}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl font-heading text-[#7A0607]">
                        Words in {activeMeta.label}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="font-mono text-xs border-[#7A0607]/20 bg-[#F5F2EB] text-[#7A0607]"
                      >
                        {categoryWords.length} hanzi
                      </Badge>
                    </div>
                    <CardDescription className="text-[#7A0607]/75">{activeMeta.hint}</CardDescription>
                  </div>
                </div>

                {/* Filter and Category Tabs Switcher */}
                <div className="flex items-center gap-3">
                  <div className="relative w-44 sm:w-52">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7A0607]/60 pointer-events-none" />
                    <Input
                      placeholder="Search Hanzi..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="pl-8 h-9 text-xs rounded-full bg-[#EADFCF]/40 border-[#7A0607]/15 text-[#7A0607] focus-visible:ring-[#7A0607]/30 placeholder:text-[#7A0607]/50"
                    />
                  </div>

                  <Tabs
                    value={selectedCategory}
                    onValueChange={(val) => setSelectedCategory(val as CategoryKey)}
                    className="hidden sm:block"
                  >
                    <TabsList className="h-9 rounded-full bg-[#EADFCF]/60 p-1 border border-[#7A0607]/10">
                      {CATEGORIES.map((cat) => (
                        <TabsTrigger
                          key={cat.key}
                          value={cat.key}
                          className="rounded-full px-3 text-xs font-kuaile text-[#7A0607] data-[state=active]:bg-[#FECB6D] data-[state=active]:text-[#7A0607] data-[state=active]:font-bold data-[state=active]:shadow-xs"
                        >
                          {cat.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredWords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#7A0607]/10 bg-[#EADFCF]/25 hover:bg-transparent">
                      <TableHead className="w-16 text-center font-semibold text-[#7A0607]">#</TableHead>
                      <TableHead className="w-28 font-semibold text-[#7A0607]">Hanzi</TableHead>
                      <TableHead className="w-36 font-semibold text-[#7A0607]">Pinyin</TableHead>
                      <TableHead className="font-semibold text-[#7A0607]">Meaning</TableHead>
                      <TableHead className="w-28 text-right font-semibold text-[#7A0607]">Interval</TableHead>
                      <TableHead className="w-20 text-center font-semibold text-[#7A0607]">Audio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWords.map((word, index) => (
                      <TableRow
                        key={word.id || index}
                        className="border-b border-[#7A0607]/5 transition-colors hover:bg-[#EADFCF]/20"
                      >
                        {/* Index */}
                        <TableCell className="text-center text-xs text-[#7A0607]/60 font-mono">
                          {index + 1}
                        </TableCell>

                        {/* Hanzi */}
                        <TableCell className="font-hanzi text-2xl font-bold text-[#7A0607]">
                          {word.hanzi}
                        </TableCell>

                        {/* Pinyin */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-pinyin font-medium text-[#7A0607] text-base tracking-wide">
                              {word.pinyin}
                            </span>
                            {word.tone && (
                              <Badge
                                variant="secondary"
                                className="h-4 px-1.5 text-[10px] font-semibold uppercase bg-[#FECB6D]/30 text-[#7A0607] border border-[#7A0607]/15"
                              >
                                T{word.tone}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Meaning */}
                        <TableCell className="text-sm text-[#7A0607]/80 font-sans">
                          {word.meaning}
                        </TableCell>

                        {/* Interval / FSRS days */}
                        <TableCell className="text-right font-mono text-xs">
                          {word.formatted_interval ? (
                            <span className="font-semibold text-[#7A0607]">
                              {word.formatted_interval}
                            </span>
                          ) : (word.interval_days ?? 0) > 0 ? (
                            <span className="font-semibold text-[#7A0607]">
                              {word.interval_days}d
                            </span>
                          ) : (
                            <span className="text-[#7A0607]/60 italic">New</span>
                          )}
                        </TableCell>

                        {/* Audio Button */}
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => void playPronunciation(word.hanzi)}
                            title={`Listen to ${word.hanzi}`}
                            className="size-7 rounded-full bg-[#FECB6D] text-[#7A0607] hover:bg-[#ffe199] shadow-xs transition-transform hover:scale-110 active:scale-95 border border-[#7A0607]/15 mx-auto flex items-center justify-center p-0"
                          >
                            <Volume2Icon className="size-3.5" />
                            <span className="sr-only">Pronounce {word.hanzi}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 px-4">
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle className="text-lg text-[#7A0607]">No words found</EmptyTitle>
                      <EmptyDescription className="text-[#7A0607]/70">
                        {filterQuery
                          ? `No Hanzi matched "${filterQuery}" in the ${activeMeta.label} category.`
                          : `There are currently no Hanzi characters in the ${activeMeta.label} category.`}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              )}
            </CardContent>
          </Card>

          {/* FSRS Performance & Study Metrics Grid with Warm Chinese Palette */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Streak */}
            <Card className="rounded-[1.75rem] ring-1 ring-[#7A0607]/10 bg-[#F5F2EB]/90 shadow-sm col-span-2 sm:col-span-1">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-[#7A0607]/75 font-medium">Streak</CardDescription>
                  <img
                    src="/assets/streak-flame.png"
                    alt="Streak flame"
                    className="size-5 object-contain inline-block flame-icon-pulse"
                  />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="font-heading text-4xl text-[#7A0607] font-bold">
                    {toChineseNumeral(stats.current_streak || 0)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[#7A0607]/70">
                  {stats.current_streak || 0} {stats.current_streak === 1 ? "day" : "days"} consecutive
                </p>
              </CardContent>
            </Card>

            {/* Due Today */}
            <Card className="rounded-[1.75rem] ring-1 ring-[#7A0607]/10 bg-[#F5F2EB]/90 shadow-sm">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-[#7A0607]/75 font-medium">Due today</CardDescription>
                  <div className="p-1.5 rounded-lg bg-[#D97706]/15 text-[#D97706]">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="font-heading text-4xl text-[#7A0607]">
                  {stats.due_today_count}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[#7A0607]/70">Cards waiting on the desk</p>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="rounded-[1.75rem] ring-1 ring-[#7A0607]/10 bg-[#F5F2EB]/90 shadow-sm">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-[#7A0607]/75 font-medium">Reviews</CardDescription>
                  <div className="p-1.5 rounded-lg bg-[#B9472E]/15 text-[#B9472E]">
                    <TargetIcon className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="font-heading text-4xl text-[#7A0607]">
                  {stats.total_reviews}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[#7A0607]/70">Times you turned a card</p>
              </CardContent>
            </Card>

            {/* Retention */}
            <Card className="rounded-[1.75rem] ring-1 ring-[#7A0607]/10 bg-[#F5F2EB]/90 shadow-sm">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-[#7A0607]/75 font-medium">Retention</CardDescription>
                  <div className="p-1.5 rounded-lg bg-[#FECB6D]/40 text-[#7A0607]">
                    <SparklesIcon className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="font-heading text-4xl text-[#7A0607]">
                  {stats.retention_rate}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[#7A0607]/70">Share of ratings 3 and 4</p>
              </CardContent>
            </Card>

            {/* Mastered / FSRS Stability */}
            <Card className="rounded-[1.75rem] ring-1 ring-[#7A0607]/10 bg-[#F5F2EB]/90 shadow-sm">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-[#7A0607]/75 font-medium">Mastered</CardDescription>
                  <div className="p-1.5 rounded-lg bg-[#7A0607]/15 text-[#7A0607]">
                    <BrainIcon className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="font-heading text-4xl text-[#7A0607]">
                  {stats.mature_count ?? stats.mastered_count}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[#7A0607]/70">
                  {stats.average_stability
                    ? `FSRS Stability ~${stats.average_stability}d`
                    : "Long-term consolidated"}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
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
