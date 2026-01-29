"use client"

import { useState, useMemo, useCallback } from "react"
import { 
  Filter, 
  AlertTriangle, 
  Languages, 
  Loader2, 
  Search, 
  ShoppingCart,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Trash2
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { RequesterTranslationTable } from "@/components/requester-translation-table"
import { TypeFilterAccordion } from "@/components/type-filter-accordion"
import { RequestBasket } from "@/components/request-basket"
import { RequestHistory } from "@/components/request-history"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { 
  productDatabase, 
  buildCategoryTree, 
  getAllUnifiedItems,
  type ProductItem,
  type UnifiedItem 
} from "@/lib/product-database"
import {
  getDraftRequest,
  createDraftRequest,
  addItemToDraft,
  removeItemFromDraft,
  submitDraftRequest,
  getAllRequests,
  isItemInDraft,
  type TranslationItem,
  type ValidationRequest
} from "@/lib/validation-store"

type ViewTab = "translate" | "basket" | "history"

interface TranslationStatus {
  isLoading: boolean
  error: string | null
  translatedItems: Map<string, string>
  translatedNames: Map<string, string>
}

export default function RequesterPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<ViewTab>("translate")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showFilter, setShowFilter] = useState(true)
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false)
  const [showMissingOnly, setShowMissingOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [showModifiedOnly, setShowModifiedOnly] = useState(false)
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus>({
    isLoading: false,
    error: null,
    translatedItems: new Map(),
    translatedNames: new Map()
  })
  
  const categoryTree = useMemo(() => buildCategoryTree(), [])
  const allUnifiedItems = useMemo(() => getAllUnifiedItems(), [])
  
  // Get current draft request
  const draftRequest = useMemo(() => {
    // Force re-computation when refreshKey changes
    void refreshKey
    return getDraftRequest()
  }, [refreshKey])
  
  const draftItemCount = draftRequest?.items.length ?? 0

  // Get all requests for history
  const allRequests = useMemo(() => {
    void refreshKey
    return getAllRequests()
  }, [refreshKey])
  
  // Helper to get all descendants of selected IDs
  const getAllDescendantsOfSelected = useCallback(() => {
    if (selectedIds.size === 0) return new Set<string>()
    
    const result = new Set<string>(selectedIds)
    
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
  
  // Filtered data
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

  // Handle bulk add to basket (add all modified items)
  const handleBulkAddToBasket = useCallback(() => {
    if (itemsWithModifications.length === 0) {
      toast({
        title: "Aucun element modifie",
        description: "Veuillez modifier au moins une traduction avant d'ajouter au panier",
        variant: "destructive"
      })
      return
    }

    let addedCount = 0
    itemsWithModifications.forEach(item => {
      const nameFr = translationStatus.translatedNames?.get(item.id) || item.nameFr || ''
      const descriptionFr = translationStatus.translatedItems?.get(item.id) || item.descriptionFr || ''
      
      if (nameFr || descriptionFr) {
        addItemToDraft({
          itemId: item.id,
          itemType: item.type,
          nameEn: item.nameEn,
          descriptionEn: item.descriptionEn,
          originalNameFr: item.nameFr || '',
          originalDescriptionFr: item.descriptionFr || '',
          proposedNameFr: nameFr,
          proposedDescriptionFr: descriptionFr
        })
        addedCount++
      }
    })

    setRefreshKey(k => k + 1)
    toast({
      title: "Elements ajoutes au panier",
      description: `${addedCount} traduction(s) modifiee(s) ont ete ajoutees a votre demande de validation`,
    })
  }, [itemsWithModifications, translationStatus, toast])

  // Handle adding translation to basket
  const handleAddToBasket = useCallback((item: UnifiedItem, proposedNameFr: string, proposedDescriptionFr: string) => {
    addItemToDraft({
      itemId: item.id,
      itemType: item.type,
      nameEn: item.nameEn,
      descriptionEn: item.descriptionEn,
      originalNameFr: item.nameFr || '',
      originalDescriptionFr: item.descriptionFr || '',
      proposedNameFr,
      proposedDescriptionFr
    })
    setRefreshKey(k => k + 1)
    toast({
      title: "Traduction ajoutee au panier",
      description: `"${item.nameEn}" a ete ajoute a votre demande de validation`,
    })
  }, [toast])

  // Handle removing item from basket
  const handleRemoveFromBasket = useCallback((itemId: string) => {
    removeItemFromDraft(itemId)
    setRefreshKey(k => k + 1)
    toast({
      title: "Traduction retiree",
      description: "L'element a ete retire de votre panier",
    })
  }, [toast])

  // Handle submit request
  const handleSubmitRequest = useCallback(() => {
    const submitted = submitDraftRequest()
    if (submitted) {
      setRefreshKey(k => k + 1)
      toast({
        title: "Demande soumise",
        description: `Votre demande de ${submitted.items.length} traduction(s) a ete envoyee au BU pour validation`,
      })
      setActiveTab("history")
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de soumettre la demande. Assurez-vous d'avoir au moins une traduction dans le panier.",
        variant: "destructive"
      })
    }
  }, [toast])

  // Items with missing translations
  const itemsMissingTranslations = useMemo(() => {
    return allUnifiedItems.filter(item => 
      (!item.nameFr && item.nameEn) || (!item.descriptionFr && item.descriptionEn)
    )
  }, [allUnifiedItems])

  // Items with modifications (translated or edited)
  const itemsWithModifications = useMemo(() => {
    return filteredData.filter(item => 
      translationStatus.translatedNames?.has(item.id) || 
      translationStatus.translatedItems?.has(item.id)
    )
  }, [filteredData, translationStatus])

  // Count missing translations
  const missingTranslationsCount = itemsMissingTranslations.length

  // Auto translate via DeepL
  const handleAutoTranslate = useCallback(async () => {
    if (itemsMissingTranslations.length === 0) {
      setTranslationStatus(prev => ({
        ...prev,
        error: "Aucune traduction manquante"
      }))
      return
    }

    setTranslationStatus(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))

    try {
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
          error: data.error || "Erreur lors de la traduction"
        }))
        return
      }

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
        translatedItems: translatedDescriptions,
        translatedNames
      })

      toast({
        title: "Traduction reussie",
        description: `${translatedNames.size} noms et ${translatedDescriptions.size} descriptions traduits via DeepL`,
      })

    } catch (error) {
      setTranslationStatus(prev => ({
        ...prev,
        isLoading: false,
        error: `Erreur: ${String(error)}`
      }))
    }
  }, [itemsMissingTranslations, toast])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Requester - Traductions" />
        <main className="flex-1 overflow-auto px-8 py-6 bg-background">
          {/* Back link */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour a l'accueil
          </Link>

          {/* Tab navigation */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 mb-6 w-fit">
            <button
              onClick={() => setActiveTab("translate")}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "translate"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Languages className="w-4 h-4" />
              Traduire
            </button>
            <button
              onClick={() => setActiveTab("basket")}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "basket"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Panier
              {draftItemCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {draftItemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === "history"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-4 h-4" />
              Historique
            </button>
          </div>

          {/* Translation tab */}
          {activeTab === "translate" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Catalogue produits ({filteredData.length} elements)
                  </h2>
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
                  {itemsWithModifications.length > 0 && (
                    <button
                      onClick={handleBulkAddToBasket}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Tout ajouter ({itemsWithModifications.length})
                    </button>
                  )}
                  <button
                    onClick={() => setShowMissingOnly(!showMissingOnly)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      showMissingOnly 
                        ? "bg-amber-500 text-white hover:bg-amber-600" 
                        : "bg-card border border-border hover:bg-muted"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Manquantes ({missingTranslationsCount})
                  </button>
                  <button
                    onClick={() => setShowModifiedOnly(!showModifiedOnly)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      showModifiedOnly 
                        ? "bg-blue-600 text-white hover:bg-blue-700" 
                        : "bg-card border border-border hover:bg-muted"
                    }`}
                  >
                    <Languages className="w-4 h-4" />
                    Modifiees ({itemsWithModifications.length})
                  </button>
                  <button
                    onClick={() => setShowFilter(!showFilter)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    {showFilter ? "Masquer filtres" : "Afficher filtres"}
                  </button>
                </div>
              </div>

              {translationStatus.error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
                  <strong>Erreur:</strong> {translationStatus.error}
                </div>
              )}

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
                {showFilter && (
                  <TypeFilterAccordion
                    categoryTree={categoryTree}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    isCollapsed={isFilterCollapsed}
                    onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)}
                  />
                )}
                
                <div className="flex-1 min-w-0 overflow-auto">
                  <RequesterTranslationTable 
                    data={filteredData} 
                    selectedIds={selectedIds} 
                    showMissingOnly={showMissingOnly}
                    showModifiedOnly={showModifiedOnly}
                    translatedNames={translationStatus.translatedNames}
                    translatedDescriptions={translationStatus.translatedItems}
                    searchQuery={searchQuery}
                    onAddToBasket={handleAddToBasket}
                    isItemInBasket={isItemInDraft}
                  />
                </div>
              </div>
            </>
          )}

          {/* Basket tab */}
          {activeTab === "basket" && (
            <RequestBasket 
              draftRequest={draftRequest}
              onRemoveItem={handleRemoveFromBasket}
              onSubmitRequest={handleSubmitRequest}
            />
          )}

          {/* History tab */}
          {activeTab === "history" && (
            <RequestHistory requests={allRequests} />
          )}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
