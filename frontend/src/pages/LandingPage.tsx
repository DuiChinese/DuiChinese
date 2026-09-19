import { Link } from "react-router-dom"

import { HanziDrift } from "@/components/HanziDrift"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export function LandingPage() {
  return (
    <section className="relative flex flex-1 flex-col items-center justify-center py-8">
      <HanziDrift />

      <div className="relative z-10 flex max-w-xl flex-col items-center gap-8 px-2 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-heading text-5xl leading-tight text-foreground sm:text-6xl">
            好好学习!
          </h1>
          <p className="max-w-md text-base leading-relaxed text-foreground/90 sm:text-lg">
            DuiChinese is a study hall for Hanzi. You look, listen, and speak.
            Anki brings each character back when you are about to forget it.
          </p>
        </div>

        <Link
          to="/flashcards"
          className={cn(buttonVariants({ variant: "default", size: "pill" }))}
        >
          Start reviewing
        </Link>
      </div>
    </section>
  )
}
