"use client"

import { useState, useMemo, useCallback } from "react"
import { AlertTriangle, Languages, Loader2, LayoutList, Layers, Search, ChevronRight, ChevronDown, Check } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { TranslationTable } from "@/components/translation-table"
import { ValueFirstTable } from "@/components/value-first-table"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  productDatabase, 
  buildCategoryTree, 
  getAllUnifiedItems,
  getValueFirstView,
  type ProductItem,
  type UnifiedItem 
} from "@/lib/product-database"

type ViewMode = "hierarchy" | "value-first"

interface TranslationStatus {
  isLoading: boolean
  error: string | null
  success: string | null
  translatedItems: Map<string, string> // id -> translated descriptionFr
  translatedNames?: Map<string, string> // id -> translated nameFr
}

const levelColors: Record<string, string> = {
  "Rayon": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Sous-Rayon": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Regroupement": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "Modèle": "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  "Caractéristique": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Valeur": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
}

interface MissingFilterTreeProps {
  categoryTree: any[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  itemsMissingTranslations: any[]
}

function MissingFilterTree({ categoryTree, selectedIds, onSelectionChange, itemsMissingTranslations }: MissingFilterTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const missingIds = new Set(itemsMissingTranslations.map(item => item.id))

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedNodes(newExpanded)
  }

  const getAllDescendantIds = (node: any): string[] => {
    const ids = [node.id]
    for (const child of node.children) {
      ids.push(...getAllDescendantIds(child))
    }
    return ids
  }

  const toggleSelection = (node: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelection = new Set(selectedIds)
    const allIds = getAllDescendantIds(node)
    
    const isSelected = selectedIds.has(node.id)
    
    if (isSelected) {
      allIds.forEach(id => newSelection.delete(id))
    } else {
      allIds.forEach(id => newSelection.add(id))
    }
    
    onSelectionChange(newSelection)
  }

  const countMissingInBranch = (node: any): number => {
    let count = missingIds.has(node.id) ? 1 : 0
    for (const child of node.children) {
      count += countMissingInBranch(child)
    }
    return count
  }

  const renderNode = (node: any, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    const isSelected = selectedIds.has(node.id)
    const missingCount = countMissingInBranch(node)
    
    if (missingCount === 0) return null

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
              isSelected && "bg-primary border-primary",
              !isSelected && "border-border hover:border-primary"
            )}
          >
            {isSelected && (
              <Check className="w-3 h-3 text-white" />
            )}
          </button>

          <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", levelColors[node.level])}>
            {node.level}
          </span>
          
          <span className="text-sm text-foreground truncate flex-1">
            {node.nameFr}
          </span>
          
          {missingCount > 0 && (
            <Badge className="text-xs px-1.5 py-0 h-5 ml-auto bg-amber-500 text-white">
              {missingCount}
            </Badge>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-border ml-4">
            {node.children.map((child: any) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {categoryTree.map(node => renderNode(node))}
    </div>
  )
}

export default function Translation() {
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showMissingOnly, setShowMissingOnly] = useState(false)
  const [showMissingFilter, setShowMissingFilter] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("hierarchy")
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus>({
    isLoading: false,
    error: null,
    success: null,
    translatedItems: new Map(),
    translatedNames: new Map()
  })
  
  const categoryTree = useMemo(() => buildCategoryTree(), [])
  const allUnifiedItems = useMemo(() => getAllUnifiedItems(), [])
  const valueFirstData = useMemo(() => getValueFirstView(), [])
  
  // Helper to get all descendants of selected IDs - MUST BE BEFORE filteredData
  const getAllDescendantsOfSelected = useCallback(() => {
    if (selectedIds.size === 0) return new Set<string>()
    
    const result = new Set<string>(selectedIds)
    
    // For each selected ID, add all its descendants by checking parentId chain
    productDatabase.forEach(item => {
      let current: ProductItem | undefined = item
      while (current && current.parentId) {
        if (selectedIds.has(current.parentId)) {
          result.add(item.id)
          break
        }
        current = productDatabase.find(p => p.id === current!.parentId)
      }
    })
    
    return result
  }, [selectedIds])
  
  // Filtered data for hierarchy view
  const filteredData = useMemo(() => {
    let data: ProductItem[] = productDatabase.map(item => {
      const translatedDesc = translationStatus.translatedItems.get(item.id)
      const translatedName = translationStatus.translatedNames?.get(item.id)
      
      if (translatedDesc || translatedName) {
        return { 
          ...item, 
          ...(translatedDesc && { descriptionFr: translatedDesc }),
          ...(translatedName && { nameFr: translatedName })
        }
      }
      return item
    })
    
    // Apply selection filter first (keeps hierarchy intact)
    if (selectedIds.size > 0) {
      const idsToShow = getAllDescendantsOfSelected()
      data = data.filter(item => idsToShow.has(item.id))
    }
    
    // Apply search filter (keeps hierarchy intact)
    // Search also includes characteristics and values
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      
      // Filter product items
      const matchingProductIds = new Set<string>()
      data.forEach(item => {
        if (
          item.nameFr?.toLowerCase().includes(query) ||
          item.nameEn?.toLowerCase().includes(query) ||
          item.descriptionFr?.toLowerCase().includes(query) ||
          item.descriptionEn?.toLowerCase().includes(query)
        ) {
          matchingProductIds.add(item.id)
        }
      })
      
      // Check if any characteristics or values match
      allUnifiedItems.forEach(item => {
        if (item.type === "Caractéristique" || item.type === "Valeur") {
          if (
            item.nameFr?.toLowerCase().includes(query) ||
            item.nameEn?.toLowerCase().includes(query) ||
            item.descriptionFr?.toLowerCase().includes(query) ||
            item.descriptionEn?.toLowerCase().includes(query)
          ) {
            // If a characteristic/value matches, include its parent model(s)
            if (item.type === "Caractéristique" && item.modelIds) {
              item.modelIds.forEach(modelId => matchingProductIds.add(modelId))
            }
            if (item.type === "Valeur" && item.characteristicIds) {
              // Find parent models through characteristics
              item.characteristicIds.forEach(charId => {
                const char = allUnifiedItems.find(ui => ui.id === charId && ui.type === "Caractéristique")
                if (char && char.modelIds) {
                  char.modelIds.forEach(modelId => matchingProductIds.add(modelId))
                }
              })
            }
          }
        }
      })
      
      data = data.filter(item => matchingProductIds.has(item.id))
    }
    
    // DO NOT apply showMissingOnly filter here - it breaks hierarchy
    // The table component will handle highlighting missing translations
    
    return data
  }, [selectedIds, searchQuery, translationStatus.translatedItems, translationStatus.translatedNames, getAllDescendantsOfSelected, allUnifiedItems])

  // Filtered data for value-first view
  const filteredValueFirstData = useMemo(() => {
    let data = valueFirstData
    
    if (showMissingOnly) {
      data = data.filter(({ value }) => !value.nameFr || !value.descriptionFr)
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      data = data.filter(({ value }) => 
        value.nameFr?.toLowerCase().includes(query) ||
        value.nameEn?.toLowerCase().includes(query) ||
        value.descriptionFr?.toLowerCase().includes(query) ||
        value.descriptionEn?.toLowerCase().includes(query)
      )
    }
    
    return data
  }, [valueFirstData, showMissingOnly, searchQuery])

  // Get items that would actually be shown in the table (after selection filter)
  const visibleItemsInTable = useMemo(() => {
    if (viewMode === "value-first") {
      // In value-first view, just return the filtered data
      return filteredValueFirstData.map(({ value }) => value as UnifiedItem)
    }
    
    // In hierarchy view, we need to include all items from filteredData
    // plus their characteristics and values
    const items: UnifiedItem[] = []
    const addedIds = new Set<string>()
    
    // Add all product items from filteredData
    filteredData.forEach(item => {
      if (!addedIds.has(item.id)) {
        items.push(item as UnifiedItem)
        addedIds.add(item.id)
      }
      
      // If it's a Model, add its characteristics and values
      if (item.type === "Modèle") {
        const characteristics = allUnifiedItems.filter(
          ui => ui.type === "Caractéristique" && ui.modelIds?.includes(item.id)
        )
        
        characteristics.forEach(char => {
          if (!addedIds.has(char.id)) {
            items.push(char)
            addedIds.add(char.id)
          }
          
          // Add values for closed characteristics
          if (char.characteristicType === "fermé") {
            const values = allUnifiedItems.filter(
              ui => ui.type === "Valeur" && ui.characteristicIds?.includes(char.id)
            )
            values.forEach(val => {
              if (!addedIds.has(val.id)) {
                items.push(val)
                addedIds.add(val.id)
              }
            })
          }
        })
      }
    })
    
    return items
  }, [viewMode, filteredData, filteredValueFirstData, allUnifiedItems])
  
  // Items with missing translations that are VISIBLE in the current filtered table
  const itemsMissingTranslations = useMemo(() => {
    return visibleItemsInTable.filter(item => 
      (!item.nameFr && item.nameEn) || (!item.descriptionFr && item.descriptionEn)
    )
  }, [visibleItemsInTable])
  
  // Count missing translations in currently filtered/visible data
  const missingTranslationsCount = useMemo(() => {
    if (showMissingOnly) {
      // When filter is active, show the count of items actually missing translations
      return itemsMissingTranslations.length
    }
    // When filter is not active, show total count of missing items in visible data
    return itemsMissingTranslations.length
  }, [itemsMissingTranslations, showMissingOnly])

  const handleAutoTranslate = useCallback(async () => {
    if (itemsMissingTranslations.length === 0) {
      setTranslationStatus(prev => ({
        ...prev,
        error: "Aucune traduction manquante",
        success: null
      }))
      return
    }

    setTranslationStatus(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      success: null
    }))

    try {
      // Collect all texts to translate (both names and descriptions)
      const textsToTranslate: string[] = []
      const translationMap: Array<{ id: string; field: 'nameFr' | 'descriptionFr'; index: number }> = []
      
      itemsMissingTranslations.forEach(item => {
        if (!item.nameFr && item.nameEn) {
          translationMap.push({ id: item.id, field: 'nameFr', index: textsToTranslate.length })
          textsToTranslate.push(item.nameEn)
        }
        if (!item.descriptionFr && item.descriptionEn) {
          translationMap.push({ id: item.id, field: 'descriptionFr', index: textsToTranslate.length })
          textsToTranslate.push(item.descriptionEn)
        }
      })
      
      console.log('[v0] Translating', textsToTranslate.length, 'texts for', itemsMissingTranslations.length, 'items')
      
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: textsToTranslate,
          sourceLang: "EN",
          targetLang: "FR"
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setTranslationStatus(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || "Erreur lors de la traduction",
          success: null
        }))
        return
      }

      console.log('[v0] Received', data.translations.length, 'translations from DeepL')

      // Map translations back to items - store both names and descriptions
      const translatedNames = new Map<string, string>()
      const translatedDescriptions = new Map<string, string>()
      
      translationMap.forEach(({ id, field, index }) => {
        if (data.translations[index]) {
          if (field === 'nameFr') {
            translatedNames.set(id, data.translations[index])
          } else {
            translatedDescriptions.set(id, data.translations[index])
          }
        }
      })

      setTranslationStatus({
        isLoading: false,
        error: null,
        success: null, // No longer used - we use toast instead
        translatedItems: translatedDescriptions, // Keep for backward compatibility
        translatedNames // Add new field
      })

      // Show success toast
      toast({
        title: "Traduction réussie",
        description: `${translatedNames.size} noms et ${translatedDescriptions.size} descriptions traduits avec succès via DeepL`,
      })

    } catch (error) {
      console.log('[v0] Translation error:', error)
      setTranslationStatus(prev => ({
        ...prev,
        isLoading: false,
        error: `Erreur: ${String(error)}`,
        success: null
      }))
    }
  }, [itemsMissingTranslations])
  
  const itemsMissingDescriptionFr = useMemo(() => {
    return allUnifiedItems.filter(item => !item.descriptionFr && item.descriptionEn)
  }, [allUnifiedItems])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Translation" />
        <main className="flex-1 overflow-auto px-8 py-6 bg-background">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                {viewMode === "hierarchy" 
                  ? `Catalogue produits (${filteredData.length} elements)`
                  : `Vue Value First (${filteredValueFirstData.length} valeurs)`
                }
              </h2>
              {/* View Mode Toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode("hierarchy")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === "hierarchy"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                  Hierarchie
                </button>
                <button
                  onClick={() => setViewMode("value-first")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === "value-first"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Value First
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAutoTranslate}
                disabled={translationStatus.isLoading || missingTranslationsCount === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {translationStatus.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Languages className="w-4 h-4" />
                )}
                Traduire via DeepL ({missingTranslationsCount})
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowMissingFilter(!showMissingFilter)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                    showMissingFilter
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-card border border-border hover:bg-muted"
                  )}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Traductions manquantes ({missingTranslationsCount})
                </button>
                {showMissingFilter && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-lg shadow-lg z-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">Filtrer par éléments manquants</h3>
                      <button 
                        onClick={() => setShowMissingFilter(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Sélectionnez les branches à afficher. Seuls les éléments avec traductions manquantes seront visibles.
                    </p>
                    <div className="max-h-96 overflow-y-auto border border-border rounded-lg p-2">
                      {/* Tree with checkboxes will be rendered here */}
                      <MissingFilterTree 
                        categoryTree={categoryTree}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        itemsMissingTranslations={itemsMissingTranslations}
                      />
                    </div>
                    <div className="mt-3 pt-3 border-t flex justify-between">
                      <button
                        onClick={() => {
                          setSelectedIds(new Set())
                          setShowMissingFilter(false)
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Réinitialiser
                      </button>
                      <button
                        onClick={() => setShowMissingFilter(false)}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Error message only - success is now a toast */}
          {translationStatus.error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
              <strong>Erreur:</strong> {translationStatus.error}
            </div>
          )}

          {/* Search bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher dans les noms et descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0 overflow-auto">
            {viewMode === "hierarchy" ? (
              <TranslationTable 
                data={filteredData} 
                selectedIds={selectedIds} 
                showMissingOnly={showMissingOnly}
                translatedNames={translationStatus.translatedNames}
                translatedDescriptions={translationStatus.translatedItems}
                searchQuery={searchQuery}
                categoryTree={categoryTree}
                onSelectionChange={setSelectedIds}
              />
            ) : (
              <ValueFirstTable 
                data={filteredValueFirstData} 
                translatedItems={translationStatus.translatedItems}
                translatedNames={translationStatus.translatedNames}
              />
            )}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
