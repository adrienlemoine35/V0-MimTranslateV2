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
  badge?: number
  badgeLabel?: string
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  isSelected = false,
  onClick,
  badge,
  badgeLabel,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-card p-6 rounded-lg border-2 text-left transition-all hover:shadow-md relative",
        isSelected
          ? "border-primary shadow-sm"
          : "border-border hover:border-primary/40"
      )}
    >
      {badge !== undefined && badge > 0 && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
          {badge}
        </div>
      )}
      <div className="mb-4">
        <Icon className="w-6 h-6 text-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>
      {badgeLabel && badge !== undefined && badge > 0 && (
        <div className="text-xs text-amber-600 font-medium mb-2">
          {badge} {badgeLabel}
        </div>
      )}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span>Process details</span>
        <Info className="w-4 h-4" />
      </div>
    </button>
  )
}
