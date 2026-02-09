"use client"

import { X, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"

export interface ColumnConfig {
  id: string
  label: string
  enabled: boolean
  order: number
}

interface ColumnSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  columns: ColumnConfig[]
  onColumnsChange: (columns: ColumnConfig[]) => void
}

export function ColumnSettingsPanel({
  isOpen,
  onClose,
  columns,
  onColumnsChange
}: ColumnSettingsPanelProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    setLocalColumns(columns)
  }, [columns])

  const handleToggle = (id: string) => {
    const updated = localColumns.map(col =>
      col.id === id ? { ...col, enabled: !col.enabled } : col
    )
    setLocalColumns(updated)
    onColumnsChange(updated)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const updated = [...localColumns]
    const [draggedItem] = updated.splice(draggedIndex, 1)
    updated.splice(dropIndex, 0, draggedItem)

    // Update order property
    const reordered = updated.map((col, idx) => ({ ...col, order: idx }))
    
    setLocalColumns(reordered)
    onColumnsChange(reordered)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Paramètres des colonnes
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Cochez pour afficher les colonnes et glissez pour les réorganiser
          </p>

          <div className="space-y-2">
            {localColumns.map((column, index) => (
              <div
                key={column.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 bg-muted rounded-lg border-2 transition-all cursor-move ${
                  draggedIndex === index
                    ? "opacity-50 border-primary"
                    : dragOverIndex === index
                    ? "border-primary"
                    : "border-transparent"
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                
                <input
                  type="checkbox"
                  checked={column.enabled}
                  onChange={() => handleToggle(column.id)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                
                <label className="flex-1 text-sm font-medium text-foreground cursor-pointer select-none">
                  {column.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <Button
            onClick={onClose}
            className="w-full"
          >
            Fermer
          </Button>
        </div>
      </div>
    </>
  )
}
