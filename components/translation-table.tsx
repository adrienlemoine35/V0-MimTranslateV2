"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type ProductItem, type AllLevels, getCharacteristicsForModel, getValuesForCharacteristic, type Characteristic, type CharacteristicValue, type CategoryNode, characteristicsDatabase, valuesDatabase } from "@/lib/product-database"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useState, useMemo } from "react"
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react"

const levelColors: Record<AllLevels, string> = {
  "Rayon": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Sous-Rayon": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Regroupement": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "Modèle": "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  "Caractéristique": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Valeur": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
}

type SortField = 'type' | 'id' | 'nameFr' | 'nameEn' | 'descriptionFr' | 'descriptionEn'
type SortOrder = 'asc' | 'desc' | null

interface TranslationTableProps {
  data: ProductItem[]
  selectedIds?: Set<string>
  showMissingOnly?: boolean
  translatedNames?: Map<string, string>
  translatedDescriptions?: Map<string, string>
  searchQuery?: string
  categoryTree: CategoryNode[]
  onSelectionChange: (ids: Set<string>) => void
}

interface HierarchyRow {
  item: ProductItem | Characteristic | CharacteristicValue
  type: AllLevels
  depth: number
  hasChildren: boolean
  manyToManyCount?: number // For characteristics and values
  parentRowId?: string
}

export function TranslationTable({ 
  data, 
  selectedIds = new Set(), 
  showMissingOnly = false, 
  translatedNames, 
  translatedDescriptions, 
  searchQuery = "", 
  categoryTree, 
  onSelectionChange 
}: TranslationTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nameFr' | 'descriptionFr' } | null>(null)
  const [editedValues, setEditedValues] = useState<Map<string, { nameFr?: string; descriptionFr?: string }>>(new Map())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)
  
  // Filter states for each column
  const [typeFilters, setTypeFilters] = useState<Set<AllLevels>>(new Set())
  const [showTypeFilter, setShowTypeFilter] = useState(false)

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
    const edited = editedValues.get(item.id)
    if (edited && edited[field] !== undefined) {
      return edited[field]
    }
    
    if (field === 'nameFr' && translatedNames?.has(item.id)) {
      return translatedNames.get(item.id)
    }
    if (field === 'descriptionFr' && translatedDescriptions?.has(item.id)) {
      return translatedDescriptions.get(item.id)
    }
    
    return item[field]
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else if (sortOrder === 'desc') {
        setSortField(null)
        setSortOrder(null)
      }
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const toggleTypeFilter = (type: AllLevels) => {
    const newFilters = new Set(typeFilters)
    if (newFilters.has(type)) {
      newFilters.delete(type)
    } else {
      newFilters.add(type)
    }
    setTypeFilters(newFilters)
  }

  const clearTypeFilters = () => {
    setTypeFilters(new Set())
  }

  const selectAllTypes = () => {
    setTypeFilters(new Set(["Rayon", "Sous-Rayon", "Regroupement", "Modèle", "Caractéristique", "Valeur"]))
  }

  // Build hierarchical structure
  const hierarchicalData = useMemo(() => {
    const rows: HierarchyRow[] = []

    // Build hierarchy from product data
    const buildHierarchy = (items: ProductItem[], parentId: string | null = null, depth: number = 0) => {
      const children = items.filter(item => item.parentId === parentId)
      
      children.forEach(item => {
        const hasChildren = items.some(i => i.parentId === item.id) || item.type === "Modèle"
        
        rows.push({
          item,
          type: item.type,
          depth,
          hasChildren,
          parentRowId: parentId || undefined
        })

        // If expanded, show children
        if (expandedRows.has(item.id)) {
          // Regular hierarchy children
          buildHierarchy(items, item.id, depth + 1)
          
          // If it's a Modèle, add characteristics
          if (item.type === "Modèle") {
            const characteristics = getCharacteristicsForModel(item.id)
            
            characteristics.forEach(char => {
              const manyToManyCount = char.modelIds.length
              const charHasChildren = char.characteristicType === "fermé"
              
              rows.push({
                item: char,
                type: "Caractéristique",
                depth: depth + 1,
                hasChildren: charHasChildren,
                manyToManyCount: manyToManyCount > 1 ? manyToManyCount : undefined,
                parentRowId: item.id
              })
              
              // If characteristic is expanded and closed type, show values
              if (expandedRows.has(char.id) && char.characteristicType === "fermé") {
                const values = getValuesForCharacteristic(char.id)
                
                values.forEach(val => {
                  const valueManyToManyCount = val.characteristicIds.length
                  
                  rows.push({
                    item: val,
                    type: "Valeur",
                    depth: depth + 2,
                    hasChildren: false,
                    manyToManyCount: valueManyToManyCount > 1 ? valueManyToManyCount : undefined,
                    parentRowId: char.id
                  })
                })
              }
            })
          }
        }
      })
    }

    buildHierarchy(data)
    return rows
  }, [data, expandedRows])

  // Apply filters and sorting
  const processedData = useMemo(() => {
    let result = [...hierarchicalData]

    // Apply "missing translations only" filter
    if (showMissingOnly) {
      result = result.filter(row => 
        !getDisplayValue(row.item, 'nameFr') || !getDisplayValue(row.item, 'descriptionFr')
      )
    }

    // Apply type filter
    if (typeFilters.size > 0) {
      result = result.filter(row => typeFilters.has(row.type))
    }

    // Apply sorting
    if (sortField && sortOrder) {
      result.sort((a, b) => {
        let aVal: any
        let bVal: any

        if (sortField === 'type') {
          aVal = a.type
          bVal = b.type
        } else if (sortField === 'id') {
          aVal = a.item.id
          bVal = b.item.id
        } else if (sortField === 'nameFr') {
          aVal = getDisplayValue(a.item, 'nameFr') || ''
          bVal = getDisplayValue(b.item, 'nameFr') || ''
        } else if (sortField === 'nameEn') {
          aVal = a.item.nameEn || ''
          bVal = b.item.nameEn || ''
        } else if (sortField === 'descriptionFr') {
          aVal = getDisplayValue(a.item, 'descriptionFr') || ''
          bVal = getDisplayValue(b.item, 'descriptionFr') || ''
        } else if (sortField === 'descriptionEn') {
          aVal = a.item.descriptionEn || ''
          bVal = b.item.descriptionEn || ''
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }

        return 0
      })
    }

    return result
  }, [hierarchicalData, typeFilters, sortField, sortOrder, showMissingOnly, getDisplayValue])

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-30" />
    }
    if (sortOrder === 'asc') {
      return <ArrowUp className="w-3 h-3 ml-1 inline text-primary" />
    }
    if (sortOrder === 'desc') {
      return <ArrowDown className="w-3 h-3 ml-1 inline text-primary" />
    }
    return null
  }

  const allTypes: AllLevels[] = ["Rayon", "Sous-Rayon", "Regroupement", "Modèle", "Caractéristique", "Valeur"]

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold text-foreground w-64">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => handleSort('type')}
                  className="flex items-center hover:text-primary transition-colors"
                >
                  Type
                  {getSortIcon('type')}
                </button>
                <button
                  onClick={() => setShowTypeFilter(!showTypeFilter)}
                  className={cn(
                    "text-xs px-2 py-1 rounded hover:bg-muted transition-colors",
                    typeFilters.size > 0 && "bg-primary text-primary-foreground"
                  )}
                >
                  <Filter className="w-3 h-3" />
                </button>
              </div>
            </TableHead>
            <TableHead className="font-semibold text-foreground w-32">
              <button 
                onClick={() => handleSort('id')}
                className="flex items-center hover:text-primary transition-colors"
              >
                ID
                {getSortIcon('id')}
              </button>
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              <button 
                onClick={() => handleSort('nameFr')}
                className="flex items-center hover:text-primary transition-colors"
              >
                Name FR
                {getSortIcon('nameFr')}
              </button>
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              <button 
                onClick={() => handleSort('nameEn')}
                className="flex items-center hover:text-primary transition-colors"
              >
                Name EN
                {getSortIcon('nameEn')}
              </button>
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              <button 
                onClick={() => handleSort('descriptionFr')}
                className="flex items-center hover:text-primary transition-colors"
              >
                Description FR
                {getSortIcon('descriptionFr')}
              </button>
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              <button 
                onClick={() => handleSort('descriptionEn')}
                className="flex items-center hover:text-primary transition-colors"
              >
                Description EN
                {getSortIcon('descriptionEn')}
              </button>
            </TableHead>
          </TableRow>
          {showTypeFilter && (
            <TableRow>
              <TableCell colSpan={6} className="p-4 bg-muted/30 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Filtrer par Type</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={selectAllTypes}
                      className="text-xs text-primary hover:underline"
                    >
                      Tout
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button 
                      onClick={clearTypeFilters}
                      className="text-xs text-primary hover:underline"
                    >
                      Aucun
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleTypeFilter(type)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-md font-medium transition-all",
                        levelColors[type],
                        typeFilters.has(type) ? "ring-2 ring-primary ring-offset-2" : "opacity-50 hover:opacity-100"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {typeFilters.size > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {typeFilters.size} type{typeFilters.size > 1 ? 's' : ''} sélectionné{typeFilters.size > 1 ? 's' : ''}
                  </div>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {processedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Aucun élément ne correspond aux filtres sélectionnés
              </TableCell>
            </TableRow>
          ) : (
            processedData.map((row, index) => {
              const hasMissingTranslation = !row.item.nameFr || !row.item.descriptionFr
              const isExpanded = expandedRows.has(row.item.id)
              
              return (
                <TableRow 
                  key={`${row.item.id}-${index}`}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    hasMissingTranslation && "bg-amber-50/50 dark:bg-amber-950/20"
                  )}
                >
                  <TableCell>
                    <div 
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${row.depth * 1.5}rem` }}
                    >
                      {row.hasChildren ? (
                        <button
                          onClick={() => toggleExpanded(row.item.id)}
                          className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <span className="w-4" />
                      )}
                      <span className={cn("text-xs px-2 py-1 rounded font-medium whitespace-nowrap", levelColors[row.type])}>
                        {row.type}
                      </span>
                      {row.manyToManyCount && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-1.5 py-0 h-5 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                          title={`Cette ${row.type.toLowerCase()} est partagée par ${row.manyToManyCount} éléments`}
                        >
                          ×{row.manyToManyCount}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {row.item.id}
                  </TableCell>
                  <TableCell 
                    className={cn(
                      "font-medium cursor-pointer relative",
                      !getDisplayValue(row.item, 'nameFr') && "bg-amber-200 text-amber-700 italic dark:bg-amber-900 dark:text-amber-200"
                    )}
                    onClick={() => handleCellClick(row.item.id, 'nameFr')}
                  >
                    {editingCell?.id === row.item.id && editingCell?.field === 'nameFr' ? (
                      <div className="relative">
                        <input
                          type="text"
                          autoFocus
                          className="w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-1"
                          value={getDisplayValue(row.item, 'nameFr') || ''}
                          onChange={(e) => handleCellChange(row.item.id, 'nameFr', e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellBlur()
                            if (e.key === 'Escape') handleCellBlur()
                          }}
                        />
                        {row.manyToManyCount && (
                          <div className="absolute -top-12 left-0 bg-orange-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 w-max">
                            <span className="text-base">⚠️</span>
                            <span className="font-medium">
                              Attention : Cette modification impactera {row.manyToManyCount} lignes liées
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      getDisplayValue(row.item, 'nameFr') || "Traduction manquante"
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.item.nameEn}
                  </TableCell>
                  <TableCell 
                    className={cn(
                      "max-w-xs text-sm cursor-pointer relative",
                      !getDisplayValue(row.item, 'descriptionFr') && "bg-amber-200 text-amber-700 italic dark:bg-amber-900 dark:text-amber-200"
                    )}
                    onClick={() => handleCellClick(row.item.id, 'descriptionFr')}
                  >
                    {editingCell?.id === row.item.id && editingCell?.field === 'descriptionFr' ? (
                      <div className="relative">
                        <textarea
                          autoFocus
                          rows={2}
                          className="w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-1 resize-none"
                          value={getDisplayValue(row.item, 'descriptionFr') || ''}
                          onChange={(e) => handleCellChange(row.item.id, 'descriptionFr', e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') handleCellBlur()
                          }}
                        />
                        {row.manyToManyCount && (
                          <div className="absolute -top-12 left-0 bg-orange-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 w-max">
                            <span className="text-base">⚠️</span>
                            <span className="font-medium">
                              Attention : Cette modification impactera {row.manyToManyCount} lignes liées
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="truncate">
                        {getDisplayValue(row.item, 'descriptionFr') || "Traduction manquante"}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {row.item.descriptionEn}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
