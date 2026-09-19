/**
 * Text-to-Speech audio helper using Web Speech API (speechSynthesis)
 * with Mandarin Chinese (zh-CN) locale.
 */

export function stopPronunciation(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel()
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

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "zh-CN"
    utterance.rate = speed === "slow" ? 0.6 : 0.85

    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()

    window.speechSynthesis.speak(utterance)
  })
}
