/**
 * Text-to-Speech audio helper using Web Speech API (speechSynthesis)
 * with Mandarin Chinese (zh-CN) locale.
 *
 * Smooths utterance boundaries by appending sentence-final punctuation
 * and prioritizing natural Mandarin voices (e.g. Ting-Ting on macOS / Google on Chrome)
 * to avoid abrupt audio buffer truncation (pops/clicks/petardazos).
 */

let cachedVoices: SpeechSynthesisVoice[] = []

function initVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  cachedVoices = window.speechSynthesis.getVoices()
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices()
    }
  }
}

initVoices()

function getBestChineseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices()
  }

  // 1. Prioritize premium/natural Mandarin Chinese voices
  const preferred = cachedVoices.find(
    (v) =>
      (v.lang === "zh-CN" || v.lang.startsWith("zh")) &&
      (v.name.includes("Ting-Ting") ||
        v.name.includes("Google") ||
        v.name.includes("Natural") ||
        v.name.includes("Premium") ||
        v.name.includes("Sinji") ||
        v.name.includes("Mei-Jia"))
  )
  if (preferred) return preferred

  // 2. Fallback to any zh-CN or zh voice
  return (
    cachedVoices.find(
      (v) => v.lang === "zh-CN" || v.lang === "zh_CN" || v.lang.startsWith("zh")
    ) || null
  )
}

export function stopPronunciation(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel()
    }
  }
}

export function playPronunciation(
  text: string,
  speed: "normal" | "slow" = "normal"
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve()
      return
    }

    stopPronunciation()

    // Adding full-stop punctuation '。' ensures the audio synthesis engine
    // applies a natural cadence release rather than abruptly cutting off the waveform
    // at the peak of rising tone contours (e.g. 3rd tone '你'), which causes audio popping.
    const cleanText = text.trim()
    const textToSpeak = cleanText.endsWith("。") ? cleanText : `${cleanText}。`

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = "zh-CN"
    utterance.rate = speed === "slow" ? 0.65 : 0.85

    const voice = getBestChineseVoice()
    if (voice) {
      utterance.voice = voice
    }

    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()

    window.speechSynthesis.speak(utterance)
  })
}
