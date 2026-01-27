"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, Check, ChevronLeft, ChevronRightIcon, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { type CategoryNode, type AllLevels } from "@/lib/product-database"

interface TypeFilterAccordionProps {
  categoryTree: CategoryNode[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const levelColors: Record<AllLevels, string> = {
  "Rayon": "bg-blue-100 text-blue-800",
  "Sous-Rayon": "bg-green-100 text-green-800",
  "Regroupement": "bg-amber-100 text-amber-800",
  "Modèle": "bg-violet-100 text-violet-800",
  "Caractéristique": "bg-purple-100 text-purple-800",
  "Valeur": "bg-pink-100 text-pink-800",
}

export function TypeFilterAccordion({ 
  categoryTree, 
  selectedIds, 
  onSelectionChange,
  isCollapsed = false,
  onToggleCollapse
}: TypeFilterAccordionProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [width, setWidth] = useState(288) // 18rem (w-72)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = e.clientX - (resizeRef.current?.getBoundingClientRect().left || 0)
      if (newWidth >= 200 && newWidth <= 600) { // min 200px, max 600px
        setWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedNodes(newExpanded)
  }

  const getAllDescendantIds = (node: CategoryNode): string[] => {
    const ids = [node.id]
    for (const child of node.children) {
      ids.push(...getAllDescendantIds(child))
    }
    return ids
  }

  const toggleSelection = (node: CategoryNode, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelection = new Set(selectedIds)
    const allIds = getAllDescendantIds(node)
    
    const isSelected = selectedIds.has(node.id)
    
    if (isSelected) {
      // Deselect this node and all descendants
      allIds.forEach(id => newSelection.delete(id))
    } else {
      // Select this node and all descendants
      allIds.forEach(id => newSelection.add(id))
    }
    
    onSelectionChange(newSelection)
  }

  const isSelected = (nodeId: string): boolean => {
    return selectedIds.has(nodeId)
  }

  const renderNode = (node: CategoryNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    const nodeIsSelected = isSelected(node.id)

    return (
      <div key={node.id}>
        <div 
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
            depth > 0 && "ml-4"
          )}
          onClick={() => hasChildren && toggleExpanded(node.id)}
        >
          {hasChildren ? (
            <button className="w-4 h-4 flex items-center justify-center text-muted-foreground">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          
          <button
            onClick={(e) => toggleSelection(node, e)}
            className={cn(
              "w-4 h-4 rounded border flex items-center justify-center transition-colors",
              nodeIsSelected && "bg-primary border-primary",
              !nodeIsSelected && "border-border hover:border-primary"
            )}
          >
            {nodeIsSelected && (
              <Check className="w-3 h-3 text-white" />
            )}
          </button>

          <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", levelColors[node.level])}>
            {node.level}
          </span>
          
          <span className="text-sm text-foreground truncate flex-1">
            {node.nameFr}
          </span>
          
          {node.count && (
            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 ml-auto">
              ×{node.count}
            </Badge>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-border ml-4">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const clearAll = () => {
    onSelectionChange(new Set())
  }

  const selectAll = () => {
    const allIds = new Set<string>()
    const collectIds = (nodes: CategoryNode[]) => {
      for (const node of nodes) {
        allIds.add(node.id)
        collectIds(node.children)
      }
    }
    collectIds(categoryTree)
    onSelectionChange(allIds)
  }

  // Collapse button only (shown when collapsed)
  if (isCollapsed) {
    return (
      <div className="bg-card border border-border rounded-lg p-2 flex items-center justify-center">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          title="Afficher les filtres"
        >
          <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    )
  }

  return (
    <div 
      ref={resizeRef}
      className="bg-card border border-border rounded-lg p-4 relative flex-shrink-0"
      style={{ width: `${width}px` }}
    >
      {/* Header with collapse button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            title="Masquer les filtres"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h3 className="font-semibold text-foreground">Filtrer par Type</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={selectAll}
            className="text-xs text-primary hover:underline"
          >
            Tout
          </button>
          <span className="text-muted-foreground">|</span>
          <button 
            onClick={clearAll}
            className="text-xs text-primary hover:underline"
          >
            Aucun
          </button>
        </div>
      </div>
      
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto space-y-0.5 pr-2">
        {categoryTree.map(node => renderNode(node))}
      </div>

      {selectedIds.size > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {selectedIds.size} élément{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group",
          isResizing && "bg-primary"
        )}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}
