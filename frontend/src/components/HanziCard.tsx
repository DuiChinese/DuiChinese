import { SnailIcon, Volume2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { playPronunciation } from "@/lib/speech"
import type { StudyModeId } from "@/lib/study-modes"
import type { Character } from "@/lib/types"
import { cn } from "cn"

export const CARD_FRAME_SRC = "/assets/card-frame.jpg"
export const CARD_FRAME_WIDTH = 1024
export const CARD_FRAME_HEIGHT = 819

type HanziCardProps = {
  character: Character
  flipped?: boolean
  onFlip?: () => void
  size?: "hero" | "mini"
  showAudio?: boolean
  mode?: StudyModeId
  locked?: boolean
}

export function HanziCard({
  character,
  flipped = false,
  onFlip,
  size = "hero",
  showAudio = true,
  mode = "hanzi",
  locked = false,
}: HanziCardProps) {
  const isHero = size === "hero"
  const hideHanzi = !flipped && (mode === "meaning" || mode === "listen")
  const showReading = flipped || (mode === "meaning" && !flipped)
  const cardName = locked
    ? `${character.hanzi} (locked)`
    : hideHanzi
      ? mode === "listen"
        ? "Listen card"
        : character.pinyin
      : character.hanzi

  const hanziLength = character.hanzi.length
  const hanziSizeClass = isHero
    ? hanziLength <= 1
      ? "text-7xl sm:text-8xl"
      : hanziLength === 2
        ? "text-5xl sm:text-6xl"
        : "text-3xl sm:text-4xl"
    : hanziLength <= 1
      ? "text-5xl"
      : hanziLength === 2
        ? "text-3xl sm:text-4xl"
        : "text-2xl sm:text-3xl"

  return (
    <div
      className={cn(
        "relative transition-all duration-300",
        isHero ? "w-full max-w-[34rem]" : "w-full",
        locked && "grayscale-[65%] opacity-70 contrast-90 hover:opacity-95"
      )}
    >
      <Card
        role={onFlip ? "button" : undefined}
        tabIndex={onFlip ? 0 : undefined}
        aria-label={cardName}
        aria-pressed={onFlip ? flipped : undefined}
        onClick={onFlip}
        onKeyDown={(event) => {
          if (!onFlip) return
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onFlip()
          }
        }}
        className={cn(
          "relative gap-0 overflow-hidden rounded-[12px] bg-transparent p-0 py-0 ring-0 cursor-pointer",
          isHero && "shadow-[0_10px_0_0_rgba(70,0,0,0.28)]"
        )}
      >
        <CardHeader className="sr-only">
          <CardTitle>Flashcard</CardTitle>
          <CardDescription>Spaced repetition card</CardDescription>
        </CardHeader>
        <img
          src={CARD_FRAME_SRC}
          alt=""
          width={CARD_FRAME_WIDTH}
          height={CARD_FRAME_HEIGHT}
          draggable={false}
          className="pointer-events-none block h-auto w-full select-none"
        />
        {locked ? (
          <div className="absolute top-3 left-3 z-10 flex items-center rounded-full border border-[#FECB6D]/30 bg-[#280405]/85 px-2.5 py-0.5 shadow-sm backdrop-blur-sm">
            <span className="font-kuaile text-xs tracking-wider text-[#FECB6D]">
              locked
            </span>
          </div>
        ) : null}

        <CardContent className="absolute inset-[11%] flex items-center justify-center p-0 sm:inset-[12%]">
          <div className="relative flex flex-col items-center text-center">
            {hideHanzi && !showReading ? (
              <span className="font-heading text-3xl text-card-foreground sm:text-4xl">
                Listen
              </span>
            ) : null}
            {hideHanzi ? null : (
              <span
                className={cn(
                  "font-hanzi font-bold leading-none text-card-foreground tracking-normal",
                  hanziSizeClass
                )}
              >
                {character.hanzi}
              </span>
            )}
            {showReading ? (
              <div className="mt-2 flex flex-col items-center gap-1 sm:mt-3">
                <span
                  className={cn(
                    "font-pinyin font-medium tracking-wide text-card-foreground",
                    isHero ? "text-3xl sm:text-4xl" : "text-xl"
                  )}
                >
                  {character.pinyin}
                </span>
                <span
                  className={cn(
                    "text-muted-foreground font-sans",
                    isHero ? "text-base sm:text-lg" : "text-sm"
                  )}
                >
                  {character.meaning}
                </span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {showAudio ? (
        <div
          className={cn(
            "absolute z-20 flex flex-col gap-2",
            isHero ? "-right-14 top-5" : "-right-3 -top-3"
          )}
        >
          <Button
            type="button"
            size={isHero ? "icon-audio" : "icon-sm"}
            aria-label={
              mode === "listen"
                ? "Play Mandarin pronunciation"
                : `Play Mandarin pronunciation for ${character.hanzi}`
            }
            className={isHero ? undefined : "size-9 rounded-full"}
            onClick={(event) => {
              event.stopPropagation()
              void playPronunciation(character.hanzi, "normal")
            }}
          >
            <Volume2Icon />
          </Button>
          <Button
            type="button"
            size={isHero ? "icon-audio" : "icon-sm"}
            aria-label={
              mode === "listen"
                ? "Play Mandarin slowly"
                : `Play Mandarin slowly for ${character.hanzi}`
            }
            className={isHero ? undefined : "size-9 rounded-full"}
            onClick={(event) => {
              event.stopPropagation()
              void playPronunciation(character.hanzi, "slow")
            }}
          >
            <SnailIcon />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
