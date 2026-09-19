import "@testing-library/jest-dom/vitest"

vi.stubGlobal(
  "fetch",
  vi.fn(() => Promise.reject(new Error("offline")))
)

class SilentAudio {
  src = ""
  preload = ""
  pause() {}
  removeAttribute() {}
  addEventListener() {}
  removeEventListener() {}
  play() {
    return Promise.reject(new Error("no audio in tests"))
  }
}

vi.stubGlobal("Audio", SilentAudio)
