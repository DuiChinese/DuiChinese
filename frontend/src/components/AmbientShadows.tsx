import { cn } from "cn"

interface AmbientShadowsProps {
  className?: string
}

export function AmbientShadows({ className }: AmbientShadowsProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 overflow-hidden select-none",
        className
      )}
    >
      {/* Sunlight Breathing / Atmospheric Ambient Container */}
      <div className="relative h-full w-full ambient-sunlight-breathe">
        {/* Layer 1: Main bamboo canopy & expansive culms (coherent top-right lighting) */}
        <img
          src="/assets/bamboo-shadow-1.png"
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right-top ambient-bamboo-sway-slow opacity-50 select-none"
        />

        {/* Layer 2: Delicate fluttering foreground foliage */}
        <img
          src="/assets/bamboo-shadow-2.png"
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right-top ambient-bamboo-flutter opacity-45 select-none"
        />
      </div>
    </div>
  )
}
