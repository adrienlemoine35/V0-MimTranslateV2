"use client"

import { useState } from "react"
import { Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImportantNotesProps {
  notes: string[]
  className?: string
}

export function ImportantNotes({ notes, className }: ImportantNotesProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-5",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Info className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-3">Important Notes</h4>
          <ul className="space-y-1.5">
            {notes.map((note, index) => (
              <li
                key={index}
                className="text-sm text-foreground flex items-start gap-2"
              >
                <span className="text-foreground">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
