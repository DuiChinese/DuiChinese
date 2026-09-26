import { Ghost, LayoutDashboard, RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface SessionCompletionProps {
  isGhostMode: boolean
  reviewCount: number
  onPracticeAhead: () => void
  onNavigateHome: () => void
}

export function SessionCompletion({
  isGhostMode,
  reviewCount,
  onPracticeAhead,
  onNavigateHome,
}: SessionCompletionProps) {
  const cardCountText =
    reviewCount === 1 ? "1 card" : `${reviewCount} cards`

  return (
    <section className="relative h-full w-full select-none" data-testid="session-completion">
      {/* Center: Completion text centered on the red tapete in glowing yellow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex w-full max-w-lg flex-col items-center gap-3.5 px-4 text-center">
        {isGhostMode ? (
          <>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FECB6D]/20 border border-[#FECB6D]/40 px-3.5 py-1 text-xs font-semibold text-[#FECB6D] font-kuaile tracking-wide">
              <Ghost className="size-3.5" />
              <span>Ghost Practice · FSRS data unaffected</span>
            </div>
            <h2 className="font-heading text-4xl text-[#FECB6D] drop-shadow-sm sm:text-5xl tracking-wide">
              Practice round completed!
            </h2>
            <p className="max-w-md text-base leading-relaxed text-[#F5D7A0] sm:text-lg font-garet">
              You have reviewed {cardCountText} in ghost mode.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-heading text-4xl text-[#FECB6D] drop-shadow-sm sm:text-5xl tracking-wide">
              That's all for today!
            </h2>
            <p className="max-w-md text-base leading-relaxed text-[#F5D7A0] sm:text-lg font-garet">
              You've reviewed all your scheduled characters for today. Keep up the great momentum tomorrow!
            </p>
            {reviewCount > 0 ? (
              <p className="rounded-full bg-[#FECB6D]/20 border border-[#FECB6D]/40 px-4 py-1 text-sm font-medium text-[#FECB6D] shadow-xs font-kuaile">
                {reviewCount} {reviewCount === 1 ? "review completed" : "reviews completed"}
              </p>
            ) : null}
          </>
        )}
      </div>

      {/* Bottom: Focused actions resting comfortably below the red tapete on marble */}
      <div className="absolute top-[78%] left-0 right-0 flex flex-wrap items-center justify-center gap-4 px-4 z-20">
        <Button
          type="button"
          variant="outline"
          size="pill"
          onClick={onPracticeAhead}
          className="flex items-center gap-2 border border-[#960708]/20 shadow-xs bg-[#F5F2EB]/95 text-[#7A0607] hover:bg-[#F5F2EB] font-garet font-medium px-5"
        >
          <RotateCcwIcon className="size-4" />
          {isGhostMode ? "Practicar otra ronda" : "Keep reviewing"}
        </Button>

        <Button
          type="button"
          size="pill"
          onClick={onNavigateHome}
          className="flex items-center gap-2 bg-[#7A0607] text-[#FFF9EE] hover:bg-[#960708] font-garet font-semibold px-6 shadow-sm ring-1 ring-[#FECB6D]/30 transition-transform active:scale-95"
        >
          <LayoutDashboard className="size-4" />
          Dashboard
        </Button>
      </div>
    </section>
  )
}
