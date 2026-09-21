import { Link } from "react-router-dom"

type BrandLogoProps = {
  compact?: boolean
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <Link
      to="/"
      aria-label="DuiChinese home"
      className="inline-flex shrink-0 items-center transition-transform hover:opacity-90"
    >
      <img
        src="/assets/logo.svg"
        alt="DuiChinese"
        className={compact ? "h-8 w-auto" : "h-10 w-auto sm:h-12"}
      />
    </Link>
  )
}
