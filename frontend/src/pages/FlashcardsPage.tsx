import { type FormEvent, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { CheckCircle2Icon, CircleAlertIcon, MicIcon } from "lucide-react"

import { HanziCard } from "@/components/HanziCard"
import { StudyModeSwitch } from "@/components/StudyModeSwitch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useCharacters } from "@/hooks/use-characters"
import { evaluatePronunciation, submitReview } from "@/lib/api"
import { canRecognizeSpeech, listenForHanzi, recognitionFallbackHint } from "@/lib/recognition"
import { playPronunciation, stopPronunciation } from "@/lib/speech"
import {
  STUDY_MODES,
  isStudyMode,
  type StudyModeId,
} from "@/lib/study-modes"
import type { ReviewRating } from "@/lib/types"

const RATINGS: { rating: ReviewRating; label: string }[] = [
  { rating: 1, label: "Again" },
  { rating: 2, label: "Hard" },
  { rating: 3, label: "Medium" },
  { rating: 4, label: "Easy" },
]

type Feedback = {
  ok: boolean
  title: string
  body: string
}

export function FlashcardsPage() {
  const { characters, loading } = useCharacters("due")
  const [params, setParams] = useSearchParams()
  const requestedMode = params.get("mode")
  const mode: StudyModeId = isStudyMode(requestedMode) ? requestedMode : "hanzi"
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [guess, setGuess] = useState("")
  const [listening, setListening] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const character = characters[index]
  const count = characters.length
  const modeMeta = STUDY_MODES.find((item) => item.id === mode) ?? STUDY_MODES[0]

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
      goTo(1)
    },
    [character, goTo]
  )

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

  if (!character) {
    return (
      <p className="m-auto font-heading text-2xl">No cards in this deck yet.</p>
    )
  }

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="flex max-w-xl flex-col items-center gap-2 text-center">
        <StudyModeSwitch value={mode} onChange={setMode} />
        <p className="font-heading text-lg text-foreground/90">{modeMeta.hint}</p>
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
            onClick={() => goTo(-1)}
          >
            Previous
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
            onClick={() => goTo(1)}
          >
            Next
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
                onClick={() => void rate(item.rating)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
