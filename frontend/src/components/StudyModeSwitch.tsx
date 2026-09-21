import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { STUDY_MODES, type StudyModeId } from "@/lib/study-modes"

type StudyModeSwitchProps = {
  value: StudyModeId
  onChange: (mode: StudyModeId) => void
}

export function StudyModeSwitch({ value, onChange }: StudyModeSwitchProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        if (next[0]) onChange(next[0] as StudyModeId)
      }}
      spacing={2}
      aria-label="Study mode"
      className="flex-wrap justify-center"
    >
      {STUDY_MODES.map((mode) => (
        <ToggleGroupItem
          key={mode.id}
          value={mode.id}
          className="rounded-full px-4 font-kuaile text-xs sm:text-sm text-[#7A0607] hover:bg-[#7A0607]/10 data-[state=on]:bg-[#FECB6D] data-[state=on]:text-[#7A0607] data-[state=on]:shadow-xs"
        >
          {mode.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
