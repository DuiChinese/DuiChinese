import { Link } from "react-router-dom"

type BrandLogoProps = {
  compact?: boolean
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <Link
      to="/"
      aria-label="DuiChinese home"
      className="inline-flex shrink-0 items-center"
    >
      <img
        src="/assets/logo.svg"
        alt="DuiChinese"
        className={compact ? "h-11 w-auto" : "h-14 w-auto sm:h-16"}
      />
    </Link>
  )
}
