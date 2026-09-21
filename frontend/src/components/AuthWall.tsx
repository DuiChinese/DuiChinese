import { AuthCard } from "@/components/AuthCard"

interface AuthWallProps {
  title?: string
  description?: string
}

export function AuthWall({
  title,
  description,
}: AuthWallProps) {
  return (
    <div className="w-full flex items-center justify-center animate-in fade-in duration-300">
      <AuthCard title={title} subtitle={description} />
    </div>
  )
}
