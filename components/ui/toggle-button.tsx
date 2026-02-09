import { cn } from "@/lib/utils"

interface ToggleButtonProps {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  children: React.ReactNode
  variant?: "default" | "amber" | "blue"
  className?: string
}

export function ToggleButton({ 
  pressed, 
  onPressedChange, 
  children, 
  variant = "default",
  className 
}: ToggleButtonProps) {
  const variantStyles = {
    default: pressed 
      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
      : "bg-card border border-border hover:bg-muted",
    amber: pressed 
      ? "bg-amber-500 text-white hover:bg-amber-600 border-amber-500" 
      : "bg-card border border-border hover:bg-muted",
    blue: pressed 
      ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600" 
      : "bg-card border border-border hover:bg-muted"
  }

  return (
    <button
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
        variantStyles[variant],
        className
      )}
      aria-pressed={pressed}
    >
      {children}
    </button>
  )
}
