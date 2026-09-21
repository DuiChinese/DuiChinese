import { type FormEvent, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CheckCircle2Icon, CircleAlertIcon, MicIcon, SparklesIcon, UnlockIcon, RotateCcwIcon } from "lucide-react"

import { HanziCard } from "@/components/HanziCard"
import { StudyModeSwitch } from "@/components/StudyModeSwitch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useCharacters } from "@/hooks/use-characters"
import { evaluatePronunciation, loadPracticeAhead, submitReview, unlockNextBatch } from "@/lib/api"
import { canRecognizeSpeech, listenForHanzi, recognitionFallbackHint } from "@/lib/recognition"
import { playPronunciation, stopPronunciation } from "@/lib/speech"
import {
  STUDY_MODES,
  isStudyMode,
  type StudyModeId,
} from "@/lib/study-modes"
import type { Character, ReviewRating } from "@/lib/types"
import { cn } from "cn"

const RATINGS: { rating: ReviewRating; label: string; keyHint: string }[] = [
  { rating: 1, label: "Again", keyHint: "1" },
  { rating: 2, label: "Hard", keyHint: "2" },
  { rating: 3, label: "Good", keyHint: "3" },
  { rating: 4, label: "Easy", keyHint: "4" },
]

type Feedback = {
  ok: boolean
  title: string
  body: string
}

export function FlashcardsPage() {
  const { characters: initialCharacters, loading } = useCharacters("due")
  const [deck, setDeck] = useState<Character[]>([])
  const [params, setParams] = useSearchParams()
  const requestedMode = params.get("mode")
  const mode: StudyModeId = isStudyMode(requestedMode) ? requestedMode : "hanzi"
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [guess, setGuess] = useState("")
  const [listening, setListening] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [sessionReviewCount, setSessionReviewCount] = useState(0)
  const [masterySteps, setMasterySteps] = useState<Record<number, number>>({})
  const [sessionTotal, setSessionTotal] = useState(0)

  // Sync initial characters into active deck
  useEffect(() => {
    if (!loading) {
      setDeck(initialCharacters)
      setIndex(0)
      setSessionTotal(initialCharacters.length)
      setMasterySteps({})
      if (initialCharacters.length === 0) {
        setSessionCompleted(true)
      }
    }
  }, [initialCharacters, loading])

  const character = deck[index]
  const count = deck.length
  const modeMeta = STUDY_MODES.find((item) => item.id === mode) ?? STUDY_MODES[0]
  const masteredCount = Object.values(masterySteps).filter((step) => step >= 2).length
  const totalCards = Math.max(sessionTotal, deck.length + masteredCount)
  const currentStep = character ? (masterySteps[character.id] || 0) : 0

  const resetPrompt = useCallback(() => {
    setFlipped(false)
    setGuess("")
    setFeedback(null)
    setListening(false)
  }, [])

  const setMode = useCallback(
    (next: StudyModeId) => {
      setParams(next === "hanzi" ? {} : { mode: next })
      resetPrompt()
    },
    [resetPrompt, setParams]
  )

  const goTo = useCallback(
    (direction: -1 | 1) => {
      if (count === 0) return
      setIndex((current) => (current + direction + count) % count)
      resetPrompt()
    },
    [count, resetPrompt]
  )

  const rate = useCallback(
    async (rating: ReviewRating) => {
      if (!character) return
      await submitReview(character.id, rating)
      setSessionReviewCount((c) => c + 1)

      // Strict Multi-Pass SRS Learning Protocol:
      // Cards cannot graduate on a single 2-second click.
      // - Rating 1 (Again): Failed card; reset step to 0, placed at end of session.
      // - Rating 2 (Hard): Struggled; reset step to 0, re-queued 2 cards ahead for quick drill.
      // - Rating 3 (Good) & Rating 4 (Easy): Advance step (Step 0 -> Step 1 -> Step 2 Mastered).
      // Card graduates only after achieving 2 confirmed successful reviews.
      const cardId = character.id
      const prevStep = masterySteps[cardId] || 0
      let nextStep = prevStep
      let graduated = false

      if (rating === 1 || rating === 2) {
        // Reset step to 0 on failure or struggle
        nextStep = 0
      } else if (rating === 3 || rating === 4) {
        nextStep = prevStep + 1
        if (nextStep >= 2) {
          graduated = true
        }
      }

      setMasterySteps((prev) => ({
        ...prev,
        [cardId]: nextStep,
      }))

      setDeck((prevDeck) => {
        const remaining = [...prevDeck]
        const [reviewedCard] = remaining.splice(index, 1)

        if (!graduated) {
          if (rating === 1) {
            // Again: re-queue at the end of the queue
            remaining.push(reviewedCard)
          } else if (rating === 2) {
            // Hard: repeat quickly (2 cards ahead or at end)
            if (remaining.length > 2) {
              remaining.splice(2, 0, reviewedCard)
            } else {
              remaining.push(reviewedCard)
            }
          } else {
            // Good / Easy 1st pass: interleaved re-testing (insert 3 cards ahead or at end)
            if (remaining.length > 3) {
              remaining.splice(3, 0, reviewedCard)
            } else {
              remaining.push(reviewedCard)
            }
          }
        }

        if (remaining.length === 0) {
          setSessionCompleted(true)
          return []
        }

        // Adjust index to stay within bounds
        const nextIndex = index >= remaining.length ? 0 : index
        setIndex(nextIndex)
        return remaining
      })

      resetPrompt()
    },
    [character, index, masterySteps, resetPrompt]
  )

  const handlePracticeAhead = useCallback(async () => {
    const ahead = await loadPracticeAhead()
    if (ahead.length > 0) {
      setDeck(ahead)
      setIndex(0)
      setSessionTotal(ahead.length)
      setMasterySteps({})
      setSessionCompleted(false)
      resetPrompt()
    }
  }, [resetPrompt])

  const handleUnlockNext = useCallback(async () => {
    setUnlocking(true)
    try {
      const nextBatch = await unlockNextBatch(7)
      if (nextBatch.length > 0) {
        setDeck(nextBatch)
        setIndex(0)
        setSessionTotal(nextBatch.length)
        setMasterySteps({})
        setSessionCompleted(false)
        resetPrompt()
      }
    } finally {
      setUnlocking(false)
    }
  }, [resetPrompt])

  useEffect(() => {
    if (mode !== "listen" || !character) return
    const handle = window.setTimeout(() => {
      void playPronunciation(character.hanzi)
    }, 220)
    return () => {
      window.clearTimeout(handle)
      stopPronunciation()
    }
  }, [character, mode])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!character) return
      const target = event.target as HTMLElement | null
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return

      if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault()
        setFlipped((value) => !value)
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        goTo(-1)
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        goTo(1)
      } else if (event.key.toLowerCase() === "r") {
        void playPronunciation(
          character.hanzi,
          event.shiftKey ? "slow" : "normal"
        )
      } else if (flipped && ["1", "2", "3", "4"].includes(event.key)) {
        void rate(Number(event.key) as ReviewRating)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [character, flipped, goTo, rate])

  function checkHeardCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!character) return
    const heard = guess.trim()
    const ok = heard === character.hanzi
    setFeedback({
      ok,
      title: ok ? "Correct" : "Not quite",
      body: ok
        ? `${character.hanzi} is ${character.pinyin}.`
        : `The character is ${character.hanzi} (${character.pinyin}).`,
    })
    setFlipped(true)
  }

  async function gradeSpoken(spoken: string) {
    if (!character) return
    const result = await evaluatePronunciation({
      hanzi: character.hanzi,
      pinyin: character.pinyin,
      tone: character.tone,
      spoken,
    })
    setFeedback({
      ok: result.is_match,
      title: result.is_match ? "Heard correctly" : "Try the tone again",
      body: result.feedback_message,
    })
    setFlipped(true)
  }

  function checkSpokenPinyin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void gradeSpoken(guess)
  }

  async function captureSpeech() {
    if (!character) return
    setListening(true)
    setFeedback(null)
    try {
      const spoken = await listenForHanzi()
      await gradeSpoken(spoken)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Voice recognition failed."
      setFeedback({ ok: false, title: "Could not hear you", body: message })
    } finally {
      setListening(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <Skeleton className="h-[19rem] w-full max-w-[34rem] rounded-[1.75rem] bg-card/80" />
      </div>
    )
  }

  // Daily SRS completion screen
  if (sessionCompleted || !character) {
    return (
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
        <div className="flex size-20 items-center justify-center rounded-full border-2 border-primary/40 bg-card/80 shadow-lg">
          <SparklesIcon className="size-10 text-primary" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <h2 className="font-heading text-4xl text-foreground sm:text-5xl">
            That's all for today!
          </h2>
          <p className="max-w-md text-base leading-relaxed text-foreground/90 sm:text-lg">
            You have thoroughly reviewed and consolidated all cards scheduled for today
            respecting the spaced repetition algorithm (multi-pass confirmation).
          </p>
          {sessionReviewCount > 0 ? (
            <p className="rounded-full bg-primary/20 px-4 py-1 text-sm font-medium text-foreground">
              {sessionReviewCount} {sessionReviewCount === 1 ? "review completed" : "reviews completed"} in this session
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            type="button"
            variant="secondary"
            size="pill"
            onClick={handlePracticeAhead}
            className="flex items-center gap-2"
          >
            <RotateCcwIcon className="size-4" />
            Keep reviewing
          </Button>

          <Button
            type="button"
            variant="default"
            size="pill"
            disabled={unlocking}
            onClick={handleUnlockNext}
            className="flex items-center gap-2"
          >
            <UnlockIcon className="size-4" />
            {unlocking ? "Unlocking…" : "Unlock tomorrow's cards (+7)"}
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="flex max-w-xl flex-col items-center gap-2 text-center">
        <StudyModeSwitch value={mode} onChange={setMode} />
        <p className="font-heading text-lg text-foreground/90">{modeMeta.hint}</p>
      </div>

      {/* Session Multi-Pass Consolidation Progress Bar with ZCOOL KuaiLe */}
      <div className="flex w-full max-w-[34rem] flex-col gap-1.5 px-2">
        <div className="flex items-center justify-between font-kuaile text-xs text-foreground/85">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block size-2.5 rounded-full ring-2 ring-background transition-all",
                currentStep === 0
                  ? "bg-[#FECB6D] animate-pulse"
                  : "bg-primary"
              )}
            />
            <span className="tracking-wide">
              {currentStep === 0 ? "Pass 1 of 2: Initial Recall" : "Pass 2 of 2: Consolidation Check"}
            </span>
          </div>
          <span className="text-muted-foreground tracking-wide">
            {masteredCount} of {totalCards} mastered · {count} in queue
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary/80 ring-1 ring-foreground/10 p-0.5">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${Math.round((masteredCount / Math.max(1, totalCards)) * 100)}%` }}
          />
        </div>
      </div>

      <HanziCard
        character={character}
        flipped={flipped}
        mode={mode}
        onFlip={() => setFlipped((value) => !value)}
      />

      {mode === "listen" && !flipped ? (
        <form
          onSubmit={checkHeardCharacter}
          className="flex w-full max-w-md flex-col items-center gap-3"
        >
          <FieldGroup className="w-full">
            <Field>
              <FieldLabel htmlFor="heard-hanzi">Character you heard</FieldLabel>
              <Input
                id="heard-hanzi"
                value={guess}
                onChange={(event) => setGuess(event.target.value)}
                autoComplete="off"
                placeholder="Write the hanzi"
                className="h-12 rounded-full border-transparent bg-secondary px-5 text-center text-xl text-secondary-foreground"
              />
            </Field>
          </FieldGroup>
          <Button type="submit" variant="secondary" size="pill">
            Check
          </Button>
        </form>
      ) : null}

      {mode === "speak" && canRecognizeSpeech() ? (
        <Button
          type="button"
          variant="secondary"
          size="pill"
          disabled={listening}
          onClick={() => void captureSpeech()}
        >
          <MicIcon data-icon="inline-start" />
          {listening ? "Listening…" : "Say it"}
        </Button>
      ) : null}

      {mode === "speak" && !flipped ? (
        <form
          onSubmit={checkSpokenPinyin}
          className="flex w-full max-w-md flex-col items-center gap-3"
        >
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {canRecognizeSpeech()
              ? "Or type the pinyin you said."
              : recognitionFallbackHint()}
          </p>
          <FieldGroup className="w-full">
            <Field>
              <FieldLabel htmlFor="spoken-pinyin">Pinyin you said</FieldLabel>
              <Input
                id="spoken-pinyin"
                value={guess}
                onChange={(event) => setGuess(event.target.value)}
                autoComplete="off"
                placeholder="hao"
                className="h-12 rounded-full border-transparent bg-secondary px-5 text-center text-xl text-secondary-foreground"
              />
            </Field>
          </FieldGroup>
          <Button type="submit" variant="secondary" size="pill">
            Check
          </Button>
        </form>
      ) : null}

      {feedback ? (
        <Alert className="max-w-md rounded-3xl">
          {feedback.ok ? <CheckCircle2Icon /> : <CircleAlertIcon />}
          <AlertTitle>{feedback.title}</AlertTitle>
          <AlertDescription>{feedback.body}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="pill"
            aria-label="Previous"
            className="w-12 h-10 px-0 flex items-center justify-center font-bold text-lg"
            onClick={() => goTo(-1)}
          >
            &lt;
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="pill"
            onClick={() => setFlipped((value) => !value)}
          >
            Turn around
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="pill"
            aria-label="Next"
            className="w-12 h-10 px-0 flex items-center justify-center font-bold text-lg"
            onClick={() => goTo(1)}
          >
            &gt;
          </Button>
        </div>

        {flipped ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {RATINGS.map((item) => (
              <Button
                key={item.rating}
                type="button"
                variant="secondary"
                size="pill"
                aria-label={item.label}
                className="group flex items-center gap-2"
                onClick={() => void rate(item.rating)}
              >
                <span>{item.label}</span>
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-foreground/20 bg-background/60 px-1.5 font-mono text-[11px] font-semibold text-foreground/70 shadow-xs transition-colors group-hover:border-foreground/40 group-hover:text-foreground">
                  {item.keyHint}
                </kbd>
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
