export type StudyModeId = "hanzi" | "meaning" | "listen" | "speak"

export interface StudyMode {
  id: StudyModeId
  label: string
  hint: string
  description?: string
}

export const STUDY_MODES: StudyMode[] = [
  { id: "hanzi", label: "Hanzi", hint: "See the Hanzi, recall pinyin & meaning", description: "See Hanzi, recall pinyin & meaning" },
  { id: "meaning", label: "Meaning", hint: "See the meaning, recall Hanzi & pinyin", description: "See meaning, recall Hanzi & pinyin" },
  { id: "listen", label: "Listen", hint: "Hear the pronunciation, recall the character", description: "Hear audio, identify Hanzi" },
  { id: "speak", label: "Speak", hint: "Speak the character out loud to test tone accuracy", description: "Read Hanzi, practice pronunciation" },
]

export function isStudyMode(value: unknown): value is StudyModeId {
  return typeof value === "string" && ["hanzi", "meaning", "listen", "speak"].includes(value)
}
