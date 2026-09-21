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
      ? "text-6xl sm:text-7xl"
      : hanziLength === 2
        ? "text-4xl sm:text-5xl"
        : "text-2xl sm:text-3xl"
    : hanziLength <= 1
      ? "text-5xl"
      : hanziLength === 2
        ? "text-3xl sm:text-4xl"
        : "text-2xl sm:text-3xl"

  return (
    <div
      className={cn(
        "relative transition-all duration-300",
        isHero ? "w-full max-w-[18.5rem] sm:max-w-[21rem] md:max-w-[23rem]" : "w-full",
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
          if (event.key === "Enter" || event.key === " " || event.code === "Space") {
            event.preventDefault()
            event.stopPropagation()
            onFlip()
          }
        }}
        className={cn(
          "relative gap-0 overflow-hidden rounded-[12px] bg-transparent p-0 py-0 ring-0 cursor-pointer",
          isHero
            ? "shadow-[0_6px_20px_rgba(25,2,3,0.35),0_18px_36px_-6px_rgba(30,4,5,0.45),0_1px_3px_rgba(0,0,0,0.15)] transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(25,2,3,0.40),0_24px_48px_-8px_rgba(30,4,5,0.55)]"
            : "shadow-[0_6px_20px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:-translate-y-0.5"
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
              <div className="mt-2 flex flex-col items-center gap-1 sm:mt-2.5">
                <span
                  className={cn(
                    "font-pinyin font-medium tracking-wide text-card-foreground",
                    isHero ? "text-xl sm:text-2xl" : "text-lg"
                  )}
                >
                  {character.pinyin}
                </span>
                <span
                  className={cn(
                    "text-muted-foreground font-sans",
                    isHero ? "text-xs sm:text-sm max-w-[14rem] sm:max-w-[16rem]" : "text-xs max-w-[11rem]"
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
            isHero ? "-right-12 top-1/2 -translate-y-1/2 sm:-right-14" : "-right-3 -top-3"
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
            className={
              isHero
                ? "size-10 sm:size-11 rounded-full bg-[#FECB6D] text-[#7A0607] hover:bg-[#ffe199] shadow-md border border-[#7A0607]/20 transition-all hover:scale-110 active:scale-95"
                : "size-9 rounded-full bg-[#FECB6D] text-[#7A0607] hover:bg-[#ffe199] shadow-md border border-[#7A0607]/20 transition-all hover:scale-110 active:scale-95"
            }
            onClick={(event) => {
              event.stopPropagation()
              void playPronunciation(character.hanzi, "normal")
            }}
          >
            <Volume2Icon className="size-4 sm:size-5" />
          </Button>
          <Button
            type="button"
            size={isHero ? "icon-audio" : "icon-sm"}
            aria-label={
              mode === "listen"
                ? "Play Mandarin slowly"
                : `Play Mandarin slowly for ${character.hanzi}`
            }
            className={
              isHero
                ? "size-10 sm:size-11 rounded-full bg-[#FECB6D] text-[#7A0607] hover:bg-[#ffe199] shadow-md border border-[#7A0607]/20 transition-all hover:scale-110 active:scale-95"
                : "size-9 rounded-full bg-[#FECB6D] text-[#7A0607] hover:bg-[#ffe199] shadow-md border border-[#7A0607]/20 transition-all hover:scale-110 active:scale-95"
            }
            onClick={(event) => {
              event.stopPropagation()
              void playPronunciation(character.hanzi, "slow")
            }}
          >
            <SnailIcon className="size-4 sm:size-5" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}
