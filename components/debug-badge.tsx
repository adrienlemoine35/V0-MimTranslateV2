"use client"

import { Badge } from "@/components/ui/badge"
import { Bug } from "lucide-react"

export function DebugBadge() {
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development'
  
  if (!isDev) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <Badge 
        variant="destructive" 
        className="px-3 py-1.5 text-xs font-semibold shadow-lg flex items-center gap-1.5"
      >
        <Bug className="size-3.5" />
        DEBUG MODE
      </Badge>
    </div>
  )
}
