import { useEffect, useRef } from "react"

import {
  createHanziField,
  hanziCountForWidth,
  type HanziParticle,
  stepHanziField,
  type Vec2,
} from "@/lib/hanzi-field"

function prefersReducedMotion() {
  return Boolean(
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  )
}

export function HanziDrift() {
  const layerRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<HTMLSpanElement[]>([])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return

    let width = layer.clientWidth || 800
    let height = layer.clientHeight || 600
    let particles: HanziParticle[] = []
    let mouse: Vec2 | null = null
    let frame = 0
    let last = performance.now()
    const quiet = prefersReducedMotion()

    function paint() {
      const nodes = nodesRef.current
      for (let index = 0; index < particles.length; index += 1) {
        const node = nodes[index]
        const particle = particles[index]
        if (!node || !particle) continue
        node.style.transform = `translate3d(${particle.x - particle.r}px, ${particle.y - particle.r}px, 0)`
        node.style.fontSize = `${particle.size}px`
      }
    }

    function spawn() {
      width = layer.clientWidth || 800
      height = layer.clientHeight || 600
      const count = quiet ? 12 : hanziCountForWidth(width)
      particles = createHanziField(width, height, count)
      layer.replaceChildren()
      nodesRef.current = particles.map((particle) => {
        const node = document.createElement("span")
        node.className =
          "hanzi-drift-glyph font-hanzi font-bold text-primary/25"
        node.textContent = particle.glyph
        node.style.fontSize = `${particle.size}px`
        layer.appendChild(node)
        return node
      })
      paint()
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.033)
      last = now
      if (!quiet) {
        stepHanziField(particles, width, height, dt, mouse)
        paint()
      }
      frame = window.requestAnimationFrame(tick)
    }

    function onPointerMove(event: PointerEvent) {
      const box = layer.getBoundingClientRect()
      mouse = {
        x: event.clientX - box.left,
        y: event.clientY - box.top,
      }
    }

    function onPointerLeave() {
      mouse = null
    }

    spawn()
    frame = window.requestAnimationFrame(tick)
    const observer =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => spawn())
        : null
    observer?.observe(layer)
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerleave", onPointerLeave)

    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerleave", onPointerLeave)
    }
  }, [])

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="hanzi-drift pointer-events-none absolute inset-0 overflow-hidden select-none"
    />
  )
}
