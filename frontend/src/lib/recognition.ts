/**
 * Web Speech API recognition helper for spoken Mandarin practice.
 */

export function canRecognizeSpeech(): boolean {
  if (typeof window === "undefined") return false
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  )
}

export function recognitionFallbackHint(): string {
  return "Speech recognition is not available in your browser. You can type the pinyin you said."
}

export function listenForHanzi(_expectedHanzi?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!canRecognizeSpeech()) {
      reject(new Error("Speech recognition not supported"))
      return
    }

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition

    const recognition = new SpeechRecognition()
    recognition.lang = "zh-CN"
    recognition.interimResults = false
    recognition.maxAlternatives = 3

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim()
      resolve(transcript)
    }

    recognition.onerror = (event: any) => {
      reject(new Error(event.error || "Speech recognition error"))
    }

    recognition.start()
  })
}
