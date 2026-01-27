"use client"

import { useState, useMemo, useCallback } from "react"
import { Filter, AlertTriangle, Languages, Loader2, LayoutList, Layers, Search } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { TranslationTable } from "@/components/translation-table"
import { ValueFirstTable } from "@/components/value-first-table"
import { TypeFilterAccordion } from "@/components/type-filter-accordion"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
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

export default function Translation() {
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showFilter, setShowFilter] = useState(true)
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false)
  const [showMissingOnly, setShowMissingOnly] = useState(false)
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
    
    if (selectedIds.size > 0) {
      const idsToShow = getAllDescendantsOfSelected()
      data = data.filter(item => idsToShow.has(item.id))
    }
    
    if (showMissingOnly) {
      data = data.filter(item => !item.nameFr || !item.descriptionFr)
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      data = data.filter(item => 
        item.nameFr?.toLowerCase().includes(query) ||
        item.nameEn?.toLowerCase().includes(query) ||
        item.descriptionFr?.toLowerCase().includes(query) ||
        item.descriptionEn?.toLowerCase().includes(query)
      )
    }
    
    return data
  }, [selectedIds, showMissingOnly, searchQuery, translationStatus.translatedItems, translationStatus.translatedNames, getAllDescendantsOfSelected])

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
    const items: UnifiedItem[] = []
    const addedChars = new Set<string>()
    const addedVals = new Set<string>()
    
    if (selectedIds.size > 0) {
      // Check if any selected IDs are characteristics or values directly
      allUnifiedItems.forEach(item => {
        if (selectedIds.has(item.id)) {
          if (item.type === "Caractéristique" && !addedChars.has(item.id)) {
            items.push(item)
            addedChars.add(item.id)
          } else if (item.type === "Valeur" && !addedVals.has(item.id)) {
            items.push(item)
            addedVals.add(item.id)
          }
        }
      })
      
      // Add characteristics and values from selected models
      filteredData.forEach(item => {
        if (item.type === "Modèle") {
          const characteristics = allUnifiedItems.filter(
            ui => ui.type === "Caractéristique" && ui.modelIds?.includes(item.id)
          )
          characteristics.forEach(char => {
            if (!addedChars.has(char.id)) {
              items.push(char)
              addedChars.add(char.id)
            }
            
            if (char.characteristicType === "fermé") {
              const values = allUnifiedItems.filter(
                ui => ui.type === "Valeur" && ui.characteristicIds?.includes(char.id)
              )
              values.forEach(val => {
                if (!addedVals.has(val.id)) {
                  items.push(val)
                  addedVals.add(val.id)
                }
              })
            }
          })
        }
      })
    } else {
      // No selection filter - all items would be shown
      return allUnifiedItems
    }
    
    return items
  }, [selectedIds, filteredData, allUnifiedItems])
  
  // Items with missing translations that are VISIBLE in the current filtered table
  const itemsMissingTranslations = useMemo(() => {
    return visibleItemsInTable.filter(item => 
      (!item.nameFr && item.nameEn) || (!item.descriptionFr && item.descriptionEn)
    )
  }, [visibleItemsInTable])
  
  // Count missing translations in currently filtered/visible data
  const missingTranslationsCount = useMemo(() => {
    return itemsMissingTranslations.length
  }, [itemsMissingTranslations])

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
                disabled={translationStatus.isLoading || itemsMissingTranslations.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {translationStatus.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Languages className="w-4 h-4" />
                )}
                Traduire via DeepL ({itemsMissingTranslations.length})
              </button>
              <button
                onClick={() => setShowMissingOnly(!showMissingOnly)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  showMissingOnly 
                    ? "bg-amber-500 text-white hover:bg-amber-600" 
                    : "bg-card border border-border hover:bg-muted"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Traductions manquantes ({missingTranslationsCount})
              </button>
              <button
                onClick={() => {
                  if (showFilter && !isFilterCollapsed) {
                    setIsFilterCollapsed(true)
                  } else if (showFilter && isFilterCollapsed) {
                    setShowFilter(false)
                  } else {
                    setShowFilter(true)
                    setIsFilterCollapsed(false)
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Filter className="w-4 h-4" />
                {!showFilter ? "Afficher filtres" : isFilterCollapsed ? "Masquer filtres" : "Reduire filtres"}
              </button>
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

          <div className="flex gap-4">
            {showFilter && viewMode === "hierarchy" && (
              <TypeFilterAccordion
                categoryTree={categoryTree}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                isCollapsed={isFilterCollapsed}
                onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
              />
            )}
            
            <div className="flex-1 min-w-0 overflow-auto">
              {viewMode === "hierarchy" ? (
                <TranslationTable 
                  data={filteredData} 
                  selectedIds={selectedIds} 
                  showMissingOnly={showMissingOnly}
                  translatedNames={translationStatus.translatedNames}
                  translatedDescriptions={translationStatus.translatedItems}
                  searchQuery={searchQuery}
                />
              ) : (
                <ValueFirstTable 
                  data={filteredValueFirstData} 
                  translatedItems={translationStatus.translatedItems}
                  translatedNames={translationStatus.translatedNames}
                />
              )}
            </div>
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
