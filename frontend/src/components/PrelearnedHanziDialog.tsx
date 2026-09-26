import { useState, useMemo, useEffect } from "react"
import { Search, CheckCircle2, Sparkles, X, Loader2 } from "lucide-react"
import { HSK1_CHARACTERS } from "@/data/hsk1"
import { prelearnCards } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface PrelearnedHanziDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (count: number) => void
}

export function PrelearnedHanziDialog({
  open,
  onOpenChange,
  onSaved,
}: PrelearnedHanziDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) {
        onOpenChange(false)
      }
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, isSaving, onOpenChange])

  const filteredCharacters = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return HSK1_CHARACTERS
    return HSK1_CHARACTERS.filter(
      (c) =>
        c.hanzi.includes(q) ||
        c.pinyin.toLowerCase().includes(q) ||
        c.pinyin_clean.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      filteredCharacters.forEach((c) => next.add(c.id))
      return next
    })
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleSave = async () => {
    if (selectedIds.size === 0) {
      onOpenChange(false)
      return
    }

    setIsSaving(true)
    try {
      const res = await prelearnCards(Array.from(selectedIds))
      onSaved?.(res.prelearned_count)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prelearn-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onOpenChange(false)
        }
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-[2rem] bg-[#FDFBF7] border border-[#7A0607]/20 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
          aria-label="Close dialog"
          className="absolute top-5 right-5 text-[#7A0607]/50 hover:text-[#7A0607] transition-colors disabled:opacity-50"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="space-y-1.5 pb-2 pr-8">
          <div className="flex items-center gap-2 text-[#7A0607]">
            <Sparkles className="size-5" />
            <h3 id="prelearn-dialog-title" className="font-heading text-xl">
              Pre-learned Characters (Onboarding)
            </h3>
          </div>
          <p className="font-garet text-xs text-[#7A0607]/75">
            Select characters you already know from previous study. They will be marked as <strong>Mature</strong> with scheduled intervals between 21 and 35 days, bypassing initial drills.
          </p>
        </div>

        {/* Toolbar: Search, Select All, Clear */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-2 border-y border-[#7A0607]/10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#7A0607]/50 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Hanzi, pinyin, or English..."
              className="pl-9 h-9 text-xs rounded-full bg-[#EADFCF]/40 border-[#7A0607]/15 text-[#7A0607] placeholder:text-[#7A0607]/40"
            />
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={selectAllFiltered}
              className="text-xs font-garet border-[#7A0607]/20 text-[#7A0607]"
            >
              Select Shown ({filteredCharacters.length})
            </Button>
            {selectedIds.size > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={clearSelection}
                className="text-xs font-garet text-[#7A0607]/70"
              >
                Clear
              </Button>
            ) : null}
            <Badge
              variant="secondary"
              className="bg-[#FECB6D]/30 border border-[#7A0607]/20 text-[#7A0607] font-mono text-xs"
            >
              {selectedIds.size} selected
            </Badge>
          </div>
        </div>

        {/* Grid of Characters */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 min-h-[220px]">
          {filteredCharacters.map((char) => {
            const isSelected = selectedIds.has(char.id)
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => toggleSelect(char.id)}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#7A0607] text-[#FFF9EE] border-[#7A0607] shadow-sm scale-[1.01]"
                    : "bg-white/80 hover:bg-[#F5EFE4] text-[#7A0607] border-[#7A0607]/15"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-hanzi text-2xl font-bold">{char.hanzi}</span>
                  <div
                    className={`size-4 rounded-full border flex items-center justify-center text-[10px] ${
                      isSelected
                        ? "border-[#FECB6D] bg-[#FECB6D] text-[#7A0607]"
                        : "border-[#7A0607]/30"
                    }`}
                  >
                    {isSelected ? "✓" : ""}
                  </div>
                </div>
                <div className="mt-1">
                  <div className={`text-xs font-pinyin font-medium ${isSelected ? "text-[#FECB6D]" : "text-[#7A0607]"}`}>
                    {char.pinyin}
                  </div>
                  <div className={`text-[11px] font-garet line-clamp-1 opacity-80`}>
                    {char.meaning}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#7A0607]/10 flex flex-col sm:flex-row sm:justify-between items-center gap-3">
          <div className="text-xs text-[#7A0607]/70 font-garet">
            {selectedIds.size === 0
              ? "Select characters to mark as mature"
              : `Ready to pre-learn ${selectedIds.size} ${selectedIds.size === 1 ? "character" : "characters"}`}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="rounded-full border-[#7A0607]/20 text-[#7A0607]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || selectedIds.size === 0}
              className="rounded-full bg-[#7A0607] text-[#FFF9EE] hover:bg-[#960708] font-garet font-medium shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-1.5" />
                  Save Pre-learned ({selectedIds.size})
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
