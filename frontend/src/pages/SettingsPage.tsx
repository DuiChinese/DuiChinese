import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Target,
  Trees,
  UserCheck,
  UserX,
  Volume2,
} from "lucide-react"

import { ResetProgressDialog } from "@/components/ResetProgressDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useSettings } from "@/hooks/use-settings"
import { resetUserProgress } from "@/lib/api"
import { playPronunciation } from "@/lib/speech"

export function SettingsPage() {
  const { settings, updateSetting } = useSettings()
  const { user, isGuest } = useAuth()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false)

  const handleTestAudio = async () => {
    setIsPlayingTestAudio(true)
    try {
      await playPronunciation("你好", settings.speechSpeed)
    } finally {
      setIsPlayingTestAudio(false)
    }
  }

  const handleConfirmReset = async () => {
    setIsResetting(true)
    try {
      const res = await resetUserProgress()
      setIsDialogOpen(false)
      setFeedbackMessage(res.message || "Progress reset successfully.")
      // Auto-hide feedback after 5 seconds
      setTimeout(() => setFeedbackMessage(null), 5000)
    } catch {
      setFeedbackMessage("Failed to reset progress. Please try again.")
    } finally {
      setIsResetting(false)
    }
  }

  const CARD_GOALS = [7, 10, 14, 21]

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-16 animate-fade-in">
      {/* Title & Introduction */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-4xl text-[#7A0607]">Settings</h1>
        <p className="font-heading text-lg text-[#7A0607]/85">
          Visual appearance, audio, study goals, and account data
        </p>

        {isGuest ? (
          <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#FECB6D]/30 border border-[#7A0607]/20 px-4 py-1 font-kuaile text-xs text-[#7A0607]">
            <UserX className="size-3.5" />
            <span className="font-bold">Guest Mode:</span>
            <span>Your preferences and progress are stored locally in this browser.</span>
          </div>
        ) : (
          <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 px-4 py-1 font-kuaile text-xs text-emerald-800 dark:text-emerald-300">
            <UserCheck className="size-3.5" />
            <span>Signed in as <strong>{user?.email}</strong></span>
          </div>
        )}
      </div>

      {/* Feedback Banner if progress was recently reset */}
      {feedbackMessage ? (
        <div
          role="status"
          className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-md transition-all"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-garet font-medium">{feedbackMessage}</span>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            Close
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Visual & Atmosphere Card */}
        <Card className="rounded-[1.75rem] ring-1 ring-[#7A0607]/15 overflow-hidden shadow-sm bg-[#F5F2EB]/95">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#FECB6D]/30 text-[#7A0607]">
                  <Trees className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-heading text-[#7A0607]">
                    Appearance & Atmosphere
                  </CardTitle>
                  <CardDescription className="text-xs text-[#7A0607]/75">
                    Aesthetic effects and ambient lighting
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {/* Ambient Shadows Toggle */}
            <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-sm text-[#7A0607]">
                    Bamboo Shadows
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-kuaile border-[#7A0607]/20 text-[#7A0607]"
                  >
                    Ambient
                  </Badge>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 font-garet leading-relaxed">
                  Subtle organic shadows cast from the upper-right corner with gentle swaying motion.
                </p>
              </div>

              {/* Accessible Switch Button */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.shadowsEnabled}
                aria-label="Toggle ambient bamboo shadows"
                onClick={() => updateSetting("shadowsEnabled", !settings.shadowsEnabled)}
                className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A0607] focus-visible:ring-offset-2 ${
                  settings.shadowsEnabled ? "bg-[#7A0607]" : "bg-stone-300 dark:bg-stone-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] ${
                    settings.shadowsEnabled ? "translate-x-6 text-[#7A0607]" : "translate-x-0 text-stone-400"
                  }`}
                >
                  {settings.shadowsEnabled ? "✓" : "✕"}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Audio & Speech Speed Card */}
        <Card className="rounded-[1.75rem] ring-1 ring-[#7A0607]/15 overflow-hidden shadow-sm bg-[#F5F2EB]/95">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#FECB6D]/30 text-[#7A0607]">
                <Volume2 className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-heading text-[#7A0607]">
                  Audio & Pronunciation
                </CardTitle>
                <CardDescription className="text-xs text-[#7A0607]/75">
                  Mandarin Chinese voice synthesis speed
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm text-[#7A0607]">
                  Speech Speed
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleTestAudio}
                  disabled={isPlayingTestAudio}
                  aria-label="Play test audio"
                  className="font-garet text-xs border-[#7A0607]/20 text-[#7A0607] hover:bg-[#FECB6D]/20 gap-1.5"
                >
                  <Play className="size-3 fill-current" />
                  {isPlayingTestAudio ? "Playing..." : "Test: 你好"}
                </Button>
              </div>

              {/* Segmented Speed Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateSetting("speechSpeed", "normal")}
                  className={`py-2 px-3 rounded-xl text-xs font-garet font-medium transition-all border text-center ${
                    settings.speechSpeed === "normal"
                      ? "bg-[#7A0607] text-white border-[#7A0607] shadow-sm"
                      : "bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <div className="font-bold">Normal (1.0x)</div>
                  <div className="text-[10px] opacity-80">Natural conversation</div>
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting("speechSpeed", "slow")}
                  className={`py-2 px-3 rounded-xl text-xs font-garet font-medium transition-all border text-center ${
                    settings.speechSpeed === "slow"
                      ? "bg-[#7A0607] text-white border-[#7A0607] shadow-sm"
                      : "bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100"
                  }`}
                >
                  <div className="font-bold">Slow (0.75x)</div>
                  <div className="text-[10px] opacity-80">Clear tone distinction</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Daily Study Goal Card */}
        <Card className="rounded-[1.75rem] ring-1 ring-[#7A0607]/15 overflow-hidden shadow-sm bg-[#F5F2EB]/95">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#FECB6D]/30 text-[#7A0607]">
                <Target className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-heading text-[#7A0607]">
                  Study Goals
                </CardTitle>
                <CardDescription className="text-xs text-[#7A0607]/75">
                  Recommended daily cards per study session
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm text-[#7A0607]">
                  Daily Card Target
                </span>
                <span className="font-kuaile text-xs text-[#7A0607] font-bold">
                  {settings.dailyCardGoal} cards / day
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {CARD_GOALS.map((goal) => {
                  const isSelected = settings.dailyCardGoal === goal
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => updateSetting("dailyCardGoal", goal)}
                      className={`py-2 px-2 rounded-xl text-xs font-garet font-medium transition-all border text-center ${
                        isSelected
                          ? "bg-[#7A0607] text-white border-[#7A0607] shadow-sm scale-102"
                          : "bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      <div className="font-bold text-sm">{goal}</div>
                      <div className="text-[10px] opacity-80">{goal === 7 ? "Ideal" : "Cards"}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Danger Zone Card (Reset account progress with prior warning dialog) */}
        <Card className="rounded-[1.75rem] border-2 border-red-500/25 overflow-hidden shadow-sm bg-red-50/40 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-heading text-red-700 dark:text-red-400">
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-xs text-red-600/80 dark:text-red-400/80">
                    Destructive data and progress management
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-stone-900/80 border border-red-200 dark:border-red-900/50 space-y-3">
              <div className="space-y-1">
                <h4 className="font-heading text-sm text-red-800 dark:text-red-300">
                  Reset All Progress
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 font-garet leading-relaxed">
                  Permanently wipes all SRS reviews, intervals, and streaks. You will return to Day 1 with only the first 7 characters unlocked.
                </p>
              </div>

              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDialogOpen(true)}
                className="w-full font-garet font-medium bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              >
                <RotateCcw className="size-4" />
                Reset Account Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog before destructive reset */}
      <ResetProgressDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmReset}
        isResetting={isResetting}
      />
    </div>
  )
}
