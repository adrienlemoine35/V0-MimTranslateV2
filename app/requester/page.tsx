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
  Trash2,
  Settings,
  X,
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { RequesterTranslationTable } from "@/components/requester-translation-table"
import { RequestBasket } from "@/components/request-basket"
import { RequestHistory } from "@/components/request-history"
import { ColumnSettingsPanel, type ColumnConfig } from "@/components/column-settings-panel"
import { ToggleButton } from "@/components/ui/toggle-button"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
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
  const [selectedRayonIds, setSelectedRayonIds] = useState<Set<string>>(new Set())
  const [pendingRayonIds, setPendingRayonIds] = useState<Set<string>>(new Set())
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [showMissingOnly, setShowMissingOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [showModifiedOnly, setShowModifiedOnly] = useState(false)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([
    { id: 'name-es', label: 'Name ES', enabled: false, order: 0 },
    { id: 'name-it', label: 'Name IT', enabled: false, order: 1 },
    { id: 'description-es', label: 'Description ES', enabled: false, order: 2 },
    { id: 'description-it', label: 'Description IT', enabled: false, order: 3 },
  ])
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus>({
    isLoading: false,
    error: null,
    translatedItems: new Map(),
    translatedNames: new Map()
  })
  
  const categoryTree = useMemo(() => buildCategoryTree(), [])
  const allUnifiedItems = useMemo(() => getAllUnifiedItems(), [])
  
  // Extract top-level Rayons
  const rayons = useMemo(() => categoryTree.filter(node => node.level === "Rayon"), [categoryTree])
  
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
  
  // Get all descendant IDs for the selected Rayons
  const getAllDescendantsOfRayons = useCallback(() => {
    if (selectedRayonIds.size === 0) return new Set<string>()
    
    const result = new Set<string>(selectedRayonIds)
    
    productDatabase.forEach(item => {
      let current: ProductItem | undefined = item
      while (current && current.parentId) {
        if (selectedRayonIds.has(current.parentId)) {
          result.add(item.id)
          break
        }
        current = productDatabase.find(p => p.id === current!.parentId)
      }
    })
    
    return result
  }, [selectedRayonIds])
  
  // Store original values before any translation (including characteristics and values)
  const originalValues = useMemo(() => {
    const map = new Map<string, { nameFr: string; descriptionFr: string }>()
    // Add product items
    productDatabase.forEach(item => {
      map.set(item.id, {
        nameFr: item.nameFr || '',
        descriptionFr: item.descriptionFr || ''
      })
    })
    // Add all characteristics and values from unified items
    allUnifiedItems.forEach(item => {
      if (!map.has(item.id)) {
        map.set(item.id, {
          nameFr: item.nameFr || '',
          descriptionFr: item.descriptionFr || ''
        })
      }
    })
    return map
  }, [allUnifiedItems])

  // Filtered data based on selected Rayons
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
    
    if (selectedRayonIds.size > 0) {
      const idsToShow = getAllDescendantsOfRayons()
      data = data.filter(item => idsToShow.has(item.id))
    }
    
    return data
  }, [selectedRayonIds, translationStatus.translatedItems, translationStatus.translatedNames, getAllDescendantsOfRayons])

  // selectedIds passed to table (derived from rayon filter)
  const selectedIds = useMemo(() => {
    if (selectedRayonIds.size === 0) return new Set<string>()
    return getAllDescendantsOfRayons()
  }, [selectedRayonIds, getAllDescendantsOfRayons])

  // Items with modifications (translated or edited) - must be defined before handleBulkAddToBasket
  // Count all modified items from the entire database, not just filtered data
  const itemsWithModifications = useMemo(() => {
    const allData = productDatabase.map(item => {
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
    
    return allData.filter(item => 
      translationStatus.translatedNames?.has(item.id) || 
      translationStatus.translatedItems?.has(item.id)
    )
  }, [translationStatus])

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
      const original = originalValues.get(item.id)
      
      if (nameFr || descriptionFr) {
        addItemToDraft({
          itemId: item.id,
          itemType: item.type,
          nameEn: item.nameEn,
          descriptionEn: item.descriptionEn,
          originalNameFr: original?.nameFr || '',
          originalDescriptionFr: original?.descriptionFr || '',
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
  }, [itemsWithModifications, translationStatus, toast, originalValues])

  // Handle adding translation to basket
  const handleAddToBasket = useCallback((item: UnifiedItem, proposedNameFr: string, proposedDescriptionFr: string) => {
    const original = originalValues.get(item.id)
    addItemToDraft({
      itemId: item.id,
      itemType: item.type,
      nameEn: item.nameEn,
      descriptionEn: item.descriptionEn,
      originalNameFr: original?.nameFr || '',
      originalDescriptionFr: original?.descriptionFr || '',
      proposedNameFr,
      proposedDescriptionFr
    })
    setRefreshKey(k => k + 1)
    toast({
      title: "Traduction ajoutee au panier",
      description: `"${item.nameEn}" a ete ajoute a votre demande de validation`,
    })
  }, [toast, originalValues])

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
        const errorMessage = data.error || "Erreur lors de la traduction"
        setTranslationStatus(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }))
        toast({
          title: "Erreur de traduction",
          description: errorMessage,
          variant: "destructive"
        })
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
      const errorMessage = `Erreur: ${String(error)}`
      setTranslationStatus(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      toast({
        title: "Erreur de traduction",
        description: errorMessage,
        variant: "destructive"
      })
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
                    {`Catalogue produits (${filteredData.length} elements)`}
                  </h2>
                  {selectedRayonIds.size > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {selectedRayonIds.size} rayon{selectedRayonIds.size > 1 ? "s" : ""} filtre{selectedRayonIds.size > 1 ? "s" : ""}
                    </span>
                  )}
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
                  <ToggleButton
                    pressed={showMissingOnly}
                    onPressedChange={(value) => {
                      setShowMissingOnly(value)
                      if (value) setShowModifiedOnly(false)
                    }}
                    variant="amber"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Manquantes uniquement ({missingTranslationsCount})
                  </ToggleButton>
                  <ToggleButton
                    pressed={showModifiedOnly}
                    onPressedChange={(value) => {
                      setShowModifiedOnly(value)
                      if (value) setShowMissingOnly(false)
                    }}
                    variant="blue"
                  >
                    <Languages className="w-4 h-4" />
                    Modifiees uniquement ({itemsWithModifications.length})
                  </ToggleButton>
                  <button
                    onClick={() => {
                      setPendingRayonIds(new Set(selectedRayonIds))
                      setShowFilterDrawer(true)
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors",
                      selectedRayonIds.size > 0 && "border-primary text-primary"
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    Afficher filtres
                    {selectedRayonIds.size > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full leading-none">
                        {selectedRayonIds.size}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowColumnSettings(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Parametres
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
                    onRemoveFromBasket={handleRemoveFromBasket}
                    onBulkAddToBasket={handleBulkAddToBasket}
                    isItemInBasket={isItemInDraft}
                    modifiedItemsCount={itemsWithModifications.length}
                    columnConfig={columnConfig}
                  />
                </div>
              </div>

              {/* Rayon Filter Drawer */}
              {showFilterDrawer && (
                <>
                  <div
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={() => setShowFilterDrawer(false)}
                  />
                  <div className="fixed right-0 top-0 h-full w-1/2 bg-card border-l border-border shadow-xl z-50 flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b border-border">
                      <h2 className="text-lg font-semibold text-foreground">Filtrer par Rayon</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilterDrawer(false)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Selectionnez un ou plusieurs rayons pour filtrer le tableau.
                      </p>
                      <div className="space-y-2">
                        {rayons.map(rayon => (
                          <label
                            key={rayon.id}
                            className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={pendingRayonIds.has(rayon.id)}
                              onChange={() => {
                                setPendingRayonIds(prev => {
                                  const next = new Set(prev)
                                  if (next.has(rayon.id)) {
                                    next.delete(rayon.id)
                                  } else {
                                    next.add(rayon.id)
                                  }
                                  return next
                                })
                              }}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                            />
                            <span className="flex-1 text-sm font-medium text-foreground">
                              {rayon.nameFr}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="p-6 border-t border-border flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setPendingRayonIds(new Set())}
                      >
                        Tout effacer
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setSelectedRayonIds(new Set(pendingRayonIds))
                          setShowFilterDrawer(false)
                        }}
                      >
                        Valider
                      </Button>
                    </div>
                  </div>
                </>
              )}
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
      <ColumnSettingsPanel 
        isOpen={showColumnSettings}
        onClose={() => setShowColumnSettings(false)}
        columns={columnConfig}
        onColumnsChange={setColumnConfig}
      />
    </div>
  )
}
