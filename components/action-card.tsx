'use client';

import { cn } from "@/lib/utils"
import { Info } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface ActionCardProps {
  icon: LucideIcon
  title: string
  description: string
  isSelected?: boolean
  onClick?: () => void
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  isSelected = false,
  onClick,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-card p-6 rounded-lg border-2 text-left transition-all hover:shadow-md",
        isSelected
          ? "border-primary shadow-sm"
          : "border-border hover:border-primary/40"
      )}
    >
      <div className="mb-4">
        <Icon className="w-6 h-6 text-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span>Process details</span>
        <Info className="w-4 h-4" />
      </div>
    </button>
  )
}
