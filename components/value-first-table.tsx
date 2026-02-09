"use client"

import React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, Link2 } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import type { ValueFirstView, Characteristic, ProductItem } from "@/lib/product-database"

interface ValueFirstTableProps {
  data: ValueFirstView[]
  translatedItems?: Map<string, string>
  translatedNames?: Map<string, string>
}

const levelColors: Record<string, string> = {
  "Valeur": "bg-pink-100 text-pink-800",
  "Caractéristique": "bg-purple-100 text-purple-800",
  "Modèle": "bg-violet-100 text-violet-800",
}

export function ValueFirstTable({ data, translatedItems = new Map(), translatedNames = new Map() }: ValueFirstTableProps) {
  const [expandedValues, setExpandedValues] = useState<Set<string>>(new Set())
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nameFr' | 'descriptionFr' } | null>(null)
  const [editedValues, setEditedValues] = useState<Map<string, { nameFr?: string; descriptionFr?: string }>>(new Map())

  const handleCellClick = (id: string, field: 'nameFr' | 'descriptionFr', e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCell({ id, field })
  }

  const handleCellChange = (id: string, field: 'nameFr' | 'descriptionFr', value: string) => {
    setEditedValues(prev => {
      const next = new Map(prev)
      const current = next.get(id) || {}
      next.set(id, { ...current, [field]: value })
      return next
    })
  }

  const handleCellBlur = () => {
    setEditingCell(null)
  }

  const getDisplayValue = (item: any, field: 'nameFr' | 'descriptionFr') => {
    // Priority: 1. User edited values, 2. DeepL translations, 3. Original values
    const edited = editedValues.get(item.id)
    if (edited && edited[field] !== undefined) {
      return edited[field]
    }
    
    // Check for DeepL translations
    if (field === 'nameFr' && translatedNames?.has(item.id)) {
      return translatedNames.get(item.id)
    }
    if (field === 'descriptionFr' && translatedItems?.has(item.id)) {
      return translatedItems.get(item.id)
    }
    
    return item[field]
  }

  const toggleExpand = (valueId: string) => {
    setExpandedValues(prev => {
      const next = new Set(prev)
      if (next.has(valueId)) {
        next.delete(valueId)
      } else {
        next.add(valueId)
      }
      return next
    })
  }

  const getTranslatedDescription = (id: string, original: string) => {
    return translatedItems.get(id) || original
  }

  // Sort: values with missing translations come first
  const sortedData = [...data].sort((a, b) => {
    const aMissing = !a.value.nameFr || !a.value.descriptionFr
    const bMissing = !b.value.nameFr || !b.value.descriptionFr
    if (aMissing && !bMissing) return -1
    if (!aMissing && bMissing) return 1
    return 0
  })

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10"></TableHead>
            <TableHead className="w-24">Type</TableHead>
            <TableHead className="w-24">ID</TableHead>
            <TableHead>Name FR</TableHead>
            <TableHead>Name EN</TableHead>
            <TableHead>Description FR</TableHead>
            <TableHead>Description EN</TableHead>
            <TableHead className="w-20">Liens</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Aucune valeur trouvee
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map(({ value, characteristics, models }) => {
              const isExpanded = expandedValues.has(value.id)
              const hasMissingTranslation = !value.nameFr || !value.descriptionFr
              const descFr = getTranslatedDescription(value.id, value.descriptionFr)
              
              return (
                <>
                  {/* Value Row */}
                  <TableRow 
                    key={value.id} 
                    className={cn(
                      "hover:bg-muted/30 cursor-pointer",
                      hasMissingTranslation && "bg-amber-50"
                    )}
                    onClick={() => toggleExpand(value.id)}
                  >
                    <TableCell>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs px-2 py-1 rounded font-medium", levelColors["Valeur"])}>
                          Valeur
                        </span>
                        {models.length > 1 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                            ×{models.length}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">{value.id}</TableCell>
                    <TableCell 
                      className={cn("font-medium cursor-pointer", !getDisplayValue(value, 'nameFr') && "bg-amber-200 text-amber-700 italic")}
                      onClick={(e) => handleCellClick(value.id, 'nameFr', e)}
                    >
                      {editingCell?.id === value.id && editingCell?.field === 'nameFr' ? (
                        <input
                          type="text"
                          autoFocus
                          className="w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-1"
                          value={getDisplayValue(value, 'nameFr') || ''}
                          onChange={(e) => handleCellChange(value.id, 'nameFr', e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellBlur()
                            if (e.key === 'Escape') handleCellBlur()
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        getDisplayValue(value, 'nameFr') || "Traduction manquante"
                      )}
                    </TableCell>
                    <TableCell>{value.nameEn}</TableCell>
                    <TableCell 
                      className={cn("max-w-xs text-sm cursor-pointer", !getDisplayValue(value, 'descriptionFr') && "bg-amber-200 text-amber-700 italic")}
                      onClick={(e) => handleCellClick(value.id, 'descriptionFr', e)}
                    >
                      {editingCell?.id === value.id && editingCell?.field === 'descriptionFr' ? (
                        <textarea
                          autoFocus
                          rows={2}
                          className="w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-1 resize-none"
                          value={getDisplayValue(value, 'descriptionFr') || ''}
                          onChange={(e) => handleCellChange(value.id, 'descriptionFr', e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') handleCellBlur()
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="truncate">
                          {getDisplayValue(value, 'descriptionFr') || "Traduction manquante"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{value.descriptionEn}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Link2 className="w-3 h-3" />
                        {characteristics.length}C / {models.length}M
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded: Characteristics */}
                  {isExpanded && characteristics.map((char: Characteristic) => {
                    const charHasMissing = !char.nameFr || !char.descriptionFr
                    const charDescFr = getTranslatedDescription(char.id, char.descriptionFr)
                    const isCharShared = char.modelIds.length > 1
                    
                    return (
                      <TableRow 
                        key={`${value.id}-${char.id}`} 
                        className={cn("bg-purple-50/30", charHasMissing && "bg-amber-50")}
                      >
                        <TableCell className="pl-6">
                          <div className="w-4 h-4 border-l-2 border-b-2 border-purple-300 rounded-bl" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs px-2 py-1 rounded font-medium", levelColors["Caractéristique"])}>
                              Caract.
                            </span>
                            {isCharShared && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                                ×{char.modelIds.length}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">{char.id}</TableCell>
                        <TableCell 
                          className={cn("font-medium cursor-pointer", !getDisplayValue(char, 'nameFr') && "bg-amber-200 text-amber-700 italic")}
                          onClick={(e) => handleCellClick(char.id, 'nameFr', e)}
                        >
                          {editingCell?.id === char.id && editingCell?.field === 'nameFr' ? (
                            <input
                              type="text"
                              autoFocus
                              className="w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-1"
                              value={getDisplayValue(char, 'nameFr') || ''}
                              onChange={(e) => handleCellChange(char.id, 'nameFr', e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellBlur()
                                if (e.key === 'Escape') handleCellBlur()
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            getDisplayValue(char, 'nameFr') || "Traduction manquante"
                          )}
                        </TableCell>
                        <TableCell>{char.nameEn}</TableCell>
                        <TableCell 
                          className={cn("max-w-xs text-sm cursor-pointer", !getDisplayValue(char, 'descriptionFr') && "bg-amber-200 text-amber-700 italic")}
                          onClick={(e) => handleCellClick(char.id, 'descriptionFr', e)}
                        >
                          {editingCell?.id === char.id && editingCell?.field === 'descriptionFr' ? (
                            <textarea
                              autoFocus
                              rows={2}
                              className="w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-1 resize-none"
                              value={getDisplayValue(char, 'descriptionFr') || ''}
                              onChange={(e) => handleCellChange(char.id, 'descriptionFr', e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') handleCellBlur()
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="truncate">
                              {getDisplayValue(char, 'descriptionFr') || "Traduction manquante"}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">{char.descriptionEn}</TableCell>
                        <TableCell>
                          <span className="text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                            {char.characteristicType}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {/* Expanded: Models */}
                  {isExpanded && models.slice(0, 5).map((model: ProductItem) => (
                    <TableRow 
                      key={`${value.id}-${model.id}`} 
                      className="bg-violet-50/30"
                    >
                      <TableCell className="pl-6">
                        <div className="w-4 h-4 border-l-2 border-b-2 border-violet-300 rounded-bl" />
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-xs px-2 py-1 rounded font-medium", levelColors["Modèle"])}>
                          Modele
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">{model.id}</TableCell>
                      <TableCell className="font-medium text-sm">{model.nameFr || model.nameEn}</TableCell>
                      <TableCell className="text-sm">{model.nameEn}</TableCell>
                      <TableCell colSpan={2} className="text-xs text-muted-foreground">
                        {model.path.join(" > ")}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))}
                  
                  {isExpanded && models.length > 5 && (
                    <TableRow className="bg-violet-50/30">
                      <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-2">
                        + {models.length - 5} autres modeles lies...
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
