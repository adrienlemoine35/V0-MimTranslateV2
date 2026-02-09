"use client"

import * as React from "react"
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
  const variantColors = {
    default: "bg-teal-500",
    amber: "bg-amber-500",
    blue: "bg-blue-600"
  }

  return (
    <button
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors bg-card border border-border hover:bg-muted",
        className
      )}
      aria-pressed={pressed}
    >
      {children}
      
      {/* Toggle Switch */}
      <div 
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
          pressed ? variantColors[variant] : "bg-gray-300"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
            pressed ? "translate-x-6" : "translate-x-0.5"
          )}
        />
      </div>
    </button>
  )
}
