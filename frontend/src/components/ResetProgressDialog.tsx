import { useEffect } from "react"
import { AlertTriangle, Loader2, RotateCcw, X } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ResetProgressDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isResetting: boolean
}

export function ResetProgressDialog({
  isOpen,
  onClose,
  onConfirm,
  isResetting,
}: ResetProgressDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isResetting) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, isResetting, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isResetting) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-red-500/30 bg-[#FFFDF9] dark:bg-[#1a1412] p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isResetting}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors disabled:opacity-50"
        >
          <X className="size-5" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h3
              id="reset-dialog-title"
              className="text-xl font-bold font-kuaile tracking-wide text-red-700 dark:text-red-400"
            >
              Reset All Progress?
            </h3>
            <p className="text-xs text-stone-500 font-garet">This action cannot be undone</p>
          </div>
        </div>

        {/* Warning Content */}
        <div className="space-y-3 text-sm text-stone-700 dark:text-stone-300 font-garet">
          <p>
            Resetting your account will permanently clear all accumulated learning data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
            <li>
              <strong>SRS History:</strong> All reviews and retention levels in the spaced repetition system will be deleted.
            </li>
            <li>
              <strong>Characters:</strong> You will return to <em>Day 1</em> with only the first 7 characters unlocked.
            </li>
            <li>
              <strong>Statistics:</strong> Mature cards, active streaks, and study stats will be reset to zero.
            </li>
          </ul>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 text-xs text-amber-800 dark:text-amber-300">
            💡 We recommend this only if you want to relearn the HSK 1 curriculum from scratch.
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isResetting}
            className="w-full sm:w-auto font-garet border-stone-300 dark:border-stone-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isResetting}
            className="w-full sm:w-auto font-garet font-medium bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
          >
            {isResetting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="size-4" />
                Yes, reset all progress
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
