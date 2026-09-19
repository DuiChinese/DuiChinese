import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(process.cwd())

describe("brand assets", () => {
  it("exposes named public icons instead of scratch SVGs", () => {
    const html = readFileSync(resolve(root, "index.html"), "utf8")

    expect(html).toContain('rel="icon" href="/favicon.svg"')
    expect(html).toContain('rel="apple-touch-icon" href="/apple-touch-icon.svg"')
    expect(html).toContain('rel="manifest" href="/site.webmanifest"')
    expect(html).toContain("family=Noto+Sans+TC:wght@700")
    expect(html).not.toContain("Noto+Serif+SC")

    expect(existsSync(resolve(root, "public/favicon.svg"))).toBe(true)
    expect(existsSync(resolve(root, "public/apple-touch-icon.svg"))).toBe(true)
    expect(existsSync(resolve(root, "public/site.webmanifest"))).toBe(true)
    expect(existsSync(resolve(root, "public/assets/logo.svg"))).toBe(true)
    expect(existsSync(resolve(root, "public/assets/card-frame.jpg"))).toBe(true)

    expect(existsSync(resolve(root, "src/assets"))).toBe(false)
    expect(existsSync(resolve(root, "../2.svg"))).toBe(false)
    expect(existsSync(resolve(root, "../3.svg"))).toBe(false)
    expect(existsSync(resolve(root, "../test_logo.svg"))).toBe(false)
  })
})
