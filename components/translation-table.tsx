"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type ProductItem, type AllLevels, getCharacteristicsForModel, getValuesForCharacteristic, type Characteristic, type CharacteristicValue, getAllCharacteristics, getAllValues, getModelCountForValue } from "@/lib/product-database"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

const levelColors: Record<AllLevels, string> = {
  "Rayon": "bg-blue-100 text-blue-800",
  "Sous-Rayon": "bg-green-100 text-green-800",
  "Regroupement": "bg-amber-100 text-amber-800",
  "Modèle": "bg-violet-100 text-violet-800",
  "Caractéristique": "bg-purple-100 text-purple-800",
  "Valeur": "bg-pink-100 text-pink-800",
}

interface TranslationTableProps {
  data: ProductItem[]
  selectedIds?: Set<string>
  showMissingOnly?: boolean
  translatedNames?: Map<string, string>
  translatedDescriptions?: Map<string, string>
  searchQuery?: string
}

export function TranslationTable({ data, selectedIds, showMissingOnly = false, translatedNames, translatedDescriptions, searchQuery = "" }: TranslationTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nameFr' | 'descriptionFr' } | null>(null)
  const [editedValues, setEditedValues] = useState<Map<string, { nameFr?: string; descriptionFr?: string }>>(new Map())
  
  const handleCellClick = (id: string, field: 'nameFr' | 'descriptionFr') => {
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

  const getDisplayValue = (item: ProductItem | Characteristic | CharacteristicValue, field: 'nameFr' | 'descriptionFr') => {
    // Priority: 1. User edited values, 2. DeepL translations, 3. Original values
    const edited = editedValues.get(item.id)
    if (edited && edited[field] !== undefined) {
      return edited[field]
    }
    
    // Check for DeepL translations
    if (field === 'nameFr' && translatedNames?.has(item.id)) {
      return translatedNames.get(item.id)
    }
    if (field === 'descriptionFr' && translatedDescriptions?.has(item.id)) {
      return translatedDescriptions.get(item.id)
    }
    
    return item[field]
  }

  // Get all characteristics and values
  const allCharacteristics = getAllCharacteristics()
  const allValues = getAllValues()
  
  // Create a map to track characteristics and values appearances
  const characteristicCounts = new Map<string, number>()
  const valueCounts = new Map<string, number>()
  
  // Count all characteristics by model count and values by model count
  allCharacteristics.forEach((char) => {
    characteristicCounts.set(char.id, char.modelIds.length)
  })
  allValues.forEach((val) => {
    valueCounts.set(val.id, getModelCountForValue(val.id))
  })

  // Flatten the data - DEDUPLICATE characteristics and values (show each only once)
  const flattenedData: Array<{
    item: ProductItem | Characteristic | CharacteristicValue
    type: AllLevels
    indent: number
    count?: number
  }> = []

  // Track which characteristics and values we've already added to avoid duplicates
  const addedCharacteristics = new Set<string>()
  const addedValues = new Set<string>()

  // If selectedIds contains characteristics or values directly, show them first
  if (selectedIds && selectedIds.size > 0) {
    // Check if any selected IDs are characteristics
    const selectedCharacteristics = allCharacteristics.filter(char => selectedIds.has(char.id))
    selectedCharacteristics.forEach(char => {
      if (!addedCharacteristics.has(char.id)) {
        flattenedData.push({
          item: char,
          type: "Caractéristique",
          indent: 0,
          count: characteristicCounts.get(char.id)
        })
        addedCharacteristics.add(char.id)
      }
      
      // Add values for this characteristic if they're also selected
      if (char.characteristicType === "fermé") {
        const values = getValuesForCharacteristic(char.id)
        const selectedValuesForChar = values.filter(val => selectedIds.has(val.id))
        selectedValuesForChar.forEach(val => {
          if (!addedValues.has(val.id)) {
            flattenedData.push({
              item: val,
              type: "Valeur",
              indent: 1,
              count: valueCounts.get(val.id)
            })
            addedValues.add(val.id)
          }
        })
      }
    })
    
    // Check if any selected IDs are values without their characteristic being selected
    const selectedValues = allValues.filter(val => 
      selectedIds.has(val.id) && !val.characteristicIds.some(cId => selectedIds.has(cId))
    )
    selectedValues.forEach(val => {
      if (!addedValues.has(val.id)) {
        flattenedData.push({
          item: val,
          type: "Valeur",
          indent: 0,
          count: valueCounts.get(val.id)
        })
        addedValues.add(val.id)
      }
    })
  }

  // Add regular hierarchy data (ProductItems with DEDUPLICATED characteristics/values)
  data.forEach((item) => {
    flattenedData.push({ item, type: item.type, indent: 0 })
    
    if (item.type === "Modèle") {
      const characteristics = getCharacteristicsForModel(item.id)
      characteristics.forEach((char) => {
        // Only add characteristic if not already added
        if (!addedCharacteristics.has(char.id)) {
          flattenedData.push({ 
            item: char, 
            type: "Caractéristique", 
            indent: 1,
            count: characteristicCounts.get(char.id)
          })
          addedCharacteristics.add(char.id)
        }
        
        // Only show values for closed characteristics
        if (char.characteristicType === "fermé") {
          const values = getValuesForCharacteristic(char.id)
          values.forEach((val) => {
            // Only add value if not already added
            if (!addedValues.has(val.id)) {
              flattenedData.push({ 
                item: val, 
                type: "Valeur", 
                indent: 2,
                count: valueCounts.get(val.id)
              })
              addedValues.add(val.id)
            }
          })
        }
      })
    }
  })

  // Apply filters: missing translations and search
  let finalData = flattenedData
  
  // Apply missing translations filter if enabled - check ORIGINAL values, not displayed values
  if (showMissingOnly) {
    finalData = finalData.filter(({ item }) => {
      // Check the original item values, not the translated/displayed ones
      return !item.nameFr || !item.descriptionFr
    })
  }
  
  // Apply search filter on all fields
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    finalData = finalData.filter(({ item }) => {
      const nameFr = getDisplayValue(item, 'nameFr') || ''
      const descFr = getDisplayValue(item, 'descriptionFr') || ''
      
      return (
        nameFr.toLowerCase().includes(query) ||
        item.nameEn?.toLowerCase().includes(query) ||
        descFr.toLowerCase().includes(query) ||
        item.descriptionEn?.toLowerCase().includes(query) ||
        item.id?.toLowerCase().includes(query)
      )
    })
  }

  // Sort: items with missing translations come first
  finalData = finalData.sort((a, b) => {
    const aMissing = !a.item.nameFr || !a.item.descriptionFr
    const bMissing = !b.item.nameFr || !b.item.descriptionFr
    if (aMissing && !bMissing) return -1
    if (!aMissing && bMissing) return 1
    return 0
  })

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold text-foreground w-32">Type</TableHead>
            <TableHead className="font-semibold text-foreground w-24">ID</TableHead>
            <TableHead className="font-semibold text-foreground">Name FR</TableHead>
            <TableHead className="font-semibold text-foreground">Name EN</TableHead>
            <TableHead className="font-semibold text-foreground">Description FR</TableHead>
            <TableHead className="font-semibold text-foreground">Description EN</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {finalData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Aucun élément ne correspond aux filtres sélectionnés
              </TableCell>
            </TableRow>
          ) : (
            finalData.map(({ item, type, indent, count }, index) => {
              const hasMissingTranslation = !item.nameFr || !item.descriptionFr
              const isShared = count && count > 1
              
              return (
                <TableRow 
                  key={`${item.id}-${index}`} 
                  className={cn(
                    "hover:bg-muted/30", 
                    hasMissingTranslation && "bg-amber-50",
                    indent === 1 && "bg-purple-50/30",
                    indent === 2 && "bg-pink-50/30"
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs px-2 py-1 rounded font-medium whitespace-nowrap", levelColors[type])}>
                        {type}
                      </span>
                      {isShared && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                          ×{count}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    <span style={{ paddingLeft: `${indent * 1.5}rem` }}>{item.id}</span>
                  </TableCell>
                  <TableCell 
                    className={cn("font-medium cursor-pointer", !getDisplayValue(item, 'nameFr') && "bg-amber-200 text-amber-700 italic")}
                    onClick={() => handleCellClick(item.id, 'nameFr')}
                  >
                    {editingCell?.id === item.id && editingCell?.field === 'nameFr' ? (
                      <input
                        type="text"
                        autoFocus
                        className="w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-1"
                        style={{ paddingLeft: `${indent * 1.5}rem` }}
                        value={getDisplayValue(item, 'nameFr') || ''}
                        onChange={(e) => handleCellChange(item.id, 'nameFr', e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCellBlur()
                          if (e.key === 'Escape') handleCellBlur()
                        }}
                      />
                    ) : (
                      <span style={{ paddingLeft: `${indent * 1.5}rem` }}>
                        {getDisplayValue(item, 'nameFr') || "Traduction manquante"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{item.nameEn}</TableCell>
                  <TableCell 
                    className={cn("max-w-xs text-sm cursor-pointer", !getDisplayValue(item, 'descriptionFr') && "bg-amber-200 text-amber-700 italic")}
                    onClick={() => handleCellClick(item.id, 'descriptionFr')}
                  >
                    {editingCell?.id === item.id && editingCell?.field === 'descriptionFr' ? (
                      <textarea
                        autoFocus
                        rows={2}
                        className="w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-1 resize-none"
                        value={getDisplayValue(item, 'descriptionFr') || ''}
                        onChange={(e) => handleCellChange(item.id, 'descriptionFr', e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') handleCellBlur()
                        }}
                      />
                    ) : (
                      <div className="truncate">
                        {getDisplayValue(item, 'descriptionFr') || "Traduction manquante"}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{item.descriptionEn}</TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
