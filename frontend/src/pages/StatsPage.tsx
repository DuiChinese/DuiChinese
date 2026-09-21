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
import { useCharacters } from "@/hooks/use-characters"
import { loadStats } from "@/lib/api"
import { playPronunciation } from "@/lib/speech"
import type { CategoryCharacterItem, Stats } from "@/lib/types"

type CategoryKey = "new" | "learning" | "young" | "mature"

interface CategoryMeta {
  key: CategoryKey
  label: string
  subtitle: string
  hint: string
  badgeVariant: "default" | "secondary" | "outline"
  colorClass: string
  borderClass: string
  barClass: string
  icon: typeof BookOpenIcon
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: "new",
    label: "New",
    subtitle: "Never reviewed",
    hint: "Words waiting to enter your study queue",
    badgeVariant: "default",
    colorClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-l-blue-500",
    barClass: "bg-blue-500",
    icon: BookOpenIcon,
  },
  {
    key: "learning",
    label: "Learning",
    subtitle: "Intraday steps",
    hint: "Words in initial learning or relearning after a lapse",
    badgeVariant: "secondary",
    colorClass: "text-amber-600 dark:text-amber-400",
    borderClass: "border-l-amber-500",
    barClass: "bg-amber-500",
    icon: TimerIcon,
  },
  {
    key: "young",
    label: "Young",
    subtitle: "Interval < 21 days",
    hint: "Graduated cards recently reviewed with interval under 21 days",
    badgeVariant: "outline",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    borderClass: "border-l-emerald-400",
    barClass: "bg-emerald-400",
    icon: FlameIcon,
  },
  {
    key: "mature",
    label: "Mature",
    subtitle: "Interval ≥ 21 days",
    hint: "Consolidated long-term memories with interval of 21 days or more",
    badgeVariant: "default",
    colorClass: "text-emerald-800 dark:text-emerald-300",
    borderClass: "border-l-emerald-700",
    barClass: "bg-emerald-700",
    icon: CheckCircle2Icon,
  },
]

export function StatsPage() {
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

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 pb-16">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-4xl">Stats</h1>
        <p className="font-heading text-lg text-foreground/90">
          FSRS Spaced Repetition & Anki Card Distribution
        </p>
      </div>

      {stats ? (
        <>
          {/* Anki Card Distribution Stacked Bar */}
          <Card className="rounded-[1.75rem] ring-1 ring-foreground/10 overflow-hidden shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-xl font-heading text-card-foreground">
                    Anki Card Distribution
                  </CardTitle>
                  <CardDescription>
                    Total of {stats.total_characters} characters in deck · Click a category to view Hanzi
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1 font-mono text-xs">
                  <BrainIcon className="h-3 w-3" /> FSRS Model
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Stacked Progress Bar with ZCOOL KuaiLe typography */}
              <div
                role="progressbar"
                aria-label="Deck distribution progress"
                className="flex h-8 w-full overflow-hidden rounded-full bg-black/15 p-0.5 cursor-pointer ring-1 ring-foreground/10"
              >
                {CATEGORIES.map((cat, idx) => {
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
                  const isFirst = idx === 0
                  const isLast = idx === CATEGORIES.length - 1
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      style={{ width: `${p}%` }}
                      className={`h-full ${cat.barClass} flex items-center justify-center font-kuaile text-xs text-white/95 drop-shadow-xs transition-opacity hover:opacity-90 ${
                        isFirst ? "rounded-l-full" : ""
                      } ${isLast ? "rounded-r-full" : ""} ${
                        selectedCategory === cat.key ? "ring-2 ring-foreground" : "opacity-95"
                      }`}
                      title={`${cat.label}: ${count} (${p}%)`}
                    >
                      {p >= 12 ? (
                        <span className="truncate px-1 tracking-wide">{cat.label} {p}%</span>
                      ) : p >= 7 ? (
                        <span className="tracking-wide">{p}%</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              {/* Legend with interactive buttons & ZCOOL KuaiLe */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
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
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-left transition-all ${
                        isSelected
                          ? "bg-foreground/10 font-semibold ring-1 ring-foreground/20"
                          : "hover:bg-foreground/5 opacity-85"
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${cat.barClass} shrink-0`} />
                      <span className="font-kuaile text-sm text-card-foreground tracking-wide">{cat.label}:</span>
                      <span className="font-kuaile text-sm text-muted-foreground ml-auto">
                        {count} ({pct(count)}%)
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
                  onClick={() => setSelectedCategory(cat.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelectedCategory(cat.key)
                    }
                  }}
                  className={`rounded-[1.75rem] cursor-pointer transition-all border-l-4 ${
                    cat.borderClass
                  } ${
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-md bg-card"
                      : "opacity-85 hover:opacity-100 hover:scale-[1.01]"
                  }`}
                >
                  <CardHeader className="pb-1">
                    <div className="flex items-center justify-between">
                      <CardDescription className={`${cat.colorClass} font-semibold uppercase text-xs tracking-wider`}>
                        {cat.label}
                      </CardDescription>
                      <Icon className={`h-4 w-4 ${cat.colorClass} opacity-80`} />
                    </div>
                    <CardTitle className="font-heading text-4xl text-card-foreground">
                      {count}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{cat.subtitle}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Hanzi Category Word Explorer Table */}
          <Card className="rounded-[1.75rem] ring-1 ring-foreground/10 overflow-hidden shadow-sm">
            <CardHeader className="border-b border-foreground/10 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-card border ${activeMeta.borderClass}`}>
                    <activeMeta.icon className={`h-5 w-5 ${activeMeta.colorClass}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl font-heading text-card-foreground">
                        Words in {activeMeta.label}
                      </CardTitle>
                      <Badge variant="outline" className="font-mono">
                        {categoryWords.length} hanzi
                      </Badge>
                    </div>
                    <CardDescription>{activeMeta.hint}</CardDescription>
                  </div>
                </div>

                {/* Filter and Category Tabs Switcher */}
                <div className="flex items-center gap-3">
                  <div className="relative w-44 sm:w-52">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search Hanzi..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="pl-8 h-9 text-xs rounded-full bg-secondary/50 text-secondary-foreground"
                    />
                  </div>

                  <Tabs
                    value={selectedCategory}
                    onValueChange={(val) => setSelectedCategory(val as CategoryKey)}
                    className="hidden sm:block"
                  >
                    <TabsList className="h-9 rounded-full bg-secondary/40 p-1">
                      {CATEGORIES.map((cat) => (
                        <TabsTrigger
                          key={cat.key}
                          value={cat.key}
                          className="rounded-full px-3 text-xs data-[state=active]:bg-card data-[state=active]:text-card-foreground"
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
                    <TableRow className="border-b border-foreground/10 bg-muted/20 hover:bg-transparent">
                      <TableHead className="w-16 text-center font-semibold">#</TableHead>
                      <TableHead className="w-28 font-semibold">Hanzi</TableHead>
                      <TableHead className="w-36 font-semibold">Pinyin</TableHead>
                      <TableHead className="font-semibold">Meaning</TableHead>
                      <TableHead className="w-28 text-right font-semibold">Interval</TableHead>
                      <TableHead className="w-20 text-center font-semibold">Audio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWords.map((word, index) => (
                      <TableRow
                        key={word.id || index}
                        className="border-b border-foreground/5 transition-colors hover:bg-muted/30"
                      >
                        {/* Index */}
                        <TableCell className="text-center text-xs text-muted-foreground font-mono">
                          {index + 1}
                        </TableCell>

                        {/* Hanzi */}
                        <TableCell className="font-hanzi text-2xl font-bold text-card-foreground">
                          {word.hanzi}
                        </TableCell>

                        {/* Pinyin */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-pinyin font-medium text-foreground/90 text-base tracking-wide">
                              {word.pinyin}
                            </span>
                            {word.tone && (
                              <Badge
                                variant="secondary"
                                className="h-4 px-1.5 text-[10px] font-semibold uppercase"
                              >
                                T{word.tone}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Meaning */}
                        <TableCell className="text-sm text-muted-foreground font-sans">
                          {word.meaning}
                        </TableCell>

                        {/* Interval / FSRS days */}
                        <TableCell className="text-right font-mono text-xs">
                          {(word.interval_days ?? 0) > 0 ? (
                            <span className="font-medium text-card-foreground">
                              {word.interval_days}d
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">New</span>
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
                            className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary"
                          >
                            <Volume2Icon className="h-4 w-4" />
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
                      <EmptyTitle className="text-lg">No words found</EmptyTitle>
                      <EmptyDescription>
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

          {/* FSRS Performance & Study Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Due Today */}
            <Card className="rounded-[1.75rem] ring-1 ring-foreground/10">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription>Due today</CardDescription>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="font-heading text-4xl text-card-foreground">
                  {stats.due_today_count}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Cards waiting on the desk</p>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="rounded-[1.75rem] ring-1 ring-foreground/10">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription>Reviews</CardDescription>
                  <TargetIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="font-heading text-4xl text-card-foreground">
                  {stats.total_reviews}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Times you turned a card</p>
              </CardContent>
            </Card>

            {/* Retention */}
            <Card className="rounded-[1.75rem] ring-1 ring-foreground/10">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription>Retention</CardDescription>
                  <SparklesIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="font-heading text-4xl text-card-foreground">
                  {stats.retention_rate}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Share of ratings 3 and 4</p>
              </CardContent>
            </Card>

            {/* Mastered / FSRS Stability */}
            <Card className="rounded-[1.75rem] ring-1 ring-foreground/10">
              <CardHeader className="pb-1">
                <div className="flex items-center justify-between">
                  <CardDescription>Mastered</CardDescription>
                  <BrainIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="font-heading text-4xl text-card-foreground">
                  {stats.mature_count ?? stats.mastered_count}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
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
