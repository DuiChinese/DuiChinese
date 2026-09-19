export interface Vec2 {
  x: number
  y: number
}

export interface HanziParticle {
  glyph: string
  x: number
  y: number
  vx: number
  vy: number
  r: number
  size: number
}

export const DESKTOP_HANZI_COUNT = 24

const COMMON_GLYPHS = [
  "你", "好", "我", "们", "的", "是", "不", "在", "有", "个",
  "人", "大", "中", "学", "生", "水", "日", "月", "山", "火",
  "木", "天", "地", "心"
]

export function hanziCountForWidth(width: number): number {
  if (width < 640) return 12
  return DESKTOP_HANZI_COUNT
}

export function createHanziField(
  width: number,
  height: number,
  count: number = DESKTOP_HANZI_COUNT
): HanziParticle[] {
  const safeWidth = Math.max(100, width)
  const safeHeight = Math.max(100, height)

  return Array.from({ length: count }, (_, i) => ({
    glyph: COMMON_GLYPHS[i % COMMON_GLYPHS.length],
    x: Math.random() * safeWidth,
    y: Math.random() * safeHeight,
    vx: (Math.random() - 0.5) * 20,
    vy: (Math.random() - 0.5) * 20,
    r: 16,
    size: 24 + (i % 3) * 6,
  }))
}

export function stepHanziField(
  particles: HanziParticle[],
  width: number,
  height: number,
  dt: number,
  mouse: Vec2 | null
): void {
  const safeWidth = Math.max(100, width)
  const safeHeight = Math.max(100, height)

  for (const particle of particles) {
    particle.x += particle.vx * dt
    particle.y += particle.vy * dt

    if (mouse) {
      const dx = particle.x - mouse.x
      const dy = particle.y - mouse.y
      const dist = Math.hypot(dx, dy)
      if (dist < 100 && dist > 0) {
        particle.x += (dx / dist) * 60 * dt
        particle.y += (dy / dist) * 60 * dt
      }
    }

    if (particle.x < -40) particle.x = safeWidth + 20
    else if (particle.x > safeWidth + 40) particle.x = -20

    if (particle.y < -40) particle.y = safeHeight + 20
    else if (particle.y > safeHeight + 40) particle.y = -20
  }
}
