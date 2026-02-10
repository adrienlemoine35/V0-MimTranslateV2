"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { 
  ArrowLeft,
  Clock,
  CheckCircle2,
  Eye,
  FileText,
  Inbox,
  Table,
  Filter,
  AlertTriangle,
  Languages,
  Loader2,
  Search,
  Settings
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { BURequestReview } from "@/components/bu-request-review"
import { RequesterTranslationTable, levelColors } from "@/components/requester-translation-table"
import { ValueFirstTable } from "@/components/value-first-table"
import { TypeFilterAccordion } from "@/components/type-filter-accordion"
import { ColumnSettingsPanel, type ColumnConfig } from "@/components/column-settings-panel"
import { ToggleButton } from "@/components/ui/toggle-button"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  getPendingRequestsForBU,
  getCompletedRequests,
  getRequestById,
  updateItemByBU,
  completeRequest,
  type ValidationRequest,
  type ItemStatus
} from "@/lib/validation-store"
import { 
  productDatabase, 
  buildCategoryTree,
  getAllUnifiedItems,
  getValueFirstView
} from "@/lib/product-database"

type ViewTab = "pending" | "completed" | "normal"
type ViewMode = "hierarchy" | "value-first"

export default function BUPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<ViewTab>("normal")
  const [viewMode, setViewMode] = useState<ViewMode>("hierarchy")
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showFilter, setShowFilter] = useState(true)
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false)
  const [showMissingOnly, setShowMissingOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showModifiedOnly, setShowModifiedOnly] = useState(false)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([
    { id: 'name-es', label: 'Name ES', enabled: false, order: 0 },
    { id: 'name-it', label: 'Name IT', enabled: false, order: 1 },
    { id: 'description-es', label: 'Description ES', enabled: false, order: 2 },
    { id: 'description-it', label: 'Description IT', enabled: false, order: 3 },
  ])
  
  // Status tracking for BU
  const [deeplTranslatedIds, setDeeplTranslatedIds] = useState<Set<string>>(new Set())
  const [validatedIds, setValidatedIds] = useState<Set<string>>(new Set())
  const [translationStatus, setTranslationStatus] = useState<{
    isLoading: boolean
    translatedNames: Map<string, string>
    translatedItems: Map<string, string>
    error: string | null
  }>({
    isLoading: false,
    translatedNames: new Map(),
    translatedItems: new Map(),
    error: null,
  })
  const [pendingSubTab, setPendingSubTab] = useState<"requests" | "validations">("requests")
  const [isClient, setIsClient] = useState(false)
  
  const categoryTree = useMemo(() => buildCategoryTree(), [])
  const allUnifiedItems = useMemo(() => getAllUnifiedItems(), [])
  const valueFirstData = useMemo(() => getValueFirstView(), [])

  // Ensure client-side only rendering for localStorage-dependent data
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Helper to get all descendants of selected IDs
  const getAllDescendantsOfSelected = useCallback(() => {
    if (selectedIds.size === 0) return new Set<string>()
    
    const result = new Set<string>(selectedIds)
    
    productDatabase.forEach(item => {
      let current = item
      while (current && current.parentId) {
        if (selectedIds.has(current.parentId)) {
          result.add(item.id)
          break
        }
        const parent = productDatabase.find(p => p.id === current!.parentId)
        if (!parent) break
        current = parent
      }
    })
    
    return result
  }, [selectedIds])
  
  // Filtered data
  const filteredData = useMemo(() => {
    let data = [...productDatabase]
    
    if (selectedIds.size > 0) {
      const idsToShow = getAllDescendantsOfSelected()
      data = data.filter(item => idsToShow.has(item.id))
    }
    
    return data
  }, [selectedIds, getAllDescendantsOfSelected])
  
  // Filtered data for value-first view
  const filteredValueFirstData = useMemo(() => {
    let data = valueFirstData
    
    if (showMissingOnly) {
      data = data.filter(({ value }) => !value.nameFr || !value.descriptionFr)
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      data = data.filter(({ value }) => 
        value.nameFr?.toLowerCase().includes(query) ||
        value.nameEn?.toLowerCase().includes(query) ||
        value.descriptionFr?.toLowerCase().includes(query) ||
        value.descriptionEn?.toLowerCase().includes(query) ||
        value.id?.toLowerCase().includes(query)
      )
    }
    
    return data
  }, [valueFirstData, showMissingOnly, searchQuery])
  
  // Items with missing translations
  const itemsMissingTranslations = useMemo(() => {
    return allUnifiedItems.filter(item => 
      (!item.nameFr && item.nameEn) || (!item.descriptionFr && item.descriptionEn)
    )
  }, [allUnifiedItems])

  const missingTranslationsCount = itemsMissingTranslations.length

  // Get requests (only on client to avoid hydration mismatch)
  const pendingRequests = useMemo(() => {
    if (!isClient) return []
    void refreshKey
    return getPendingRequestsForBU()
  }, [refreshKey, isClient])

  const completedRequests = useMemo(() => {
    if (!isClient) return []
    void refreshKey
    return getCompletedRequests()
  }, [refreshKey, isClient])



  // Handle updating an item
  const handleUpdateItem = useCallback((
    itemId: string, 
    finalNameFr: string, 
    finalDescriptionFr: string, 
    status: ItemStatus
  ) => {
    // Find which request contains this item
    const allRequests = [...getPendingRequestsForBU(), ...getCompletedRequests()]
    const request = allRequests.find(r => r.items.some(item => item.id === itemId))
    if (!request) return
    
    updateItemByBU(request.id, itemId, finalNameFr, finalDescriptionFr, status)
    setRefreshKey(k => k + 1)
  }, [])

  // Handle completing the request - now needs requestId passed in
  const handleCompleteRequest = useCallback((requestId: string, comment?: string) => {
    const completed = completeRequest(requestId, comment)
    if (completed) {
      toast({
        title: "Demande finalisee",
        description: "La demande a ete traitee et le Requester a ete notifie",
      })
      setRefreshKey(k => k + 1)
    } else {
      toast({
        title: "Erreur",
        description: "Toutes les traductions doivent etre traitees avant de finaliser la demande",
        variant: "destructive"
      })
    }
  }, [toast])

  // DeepL translation for BU
  const handleAutoTranslate = useCallback(async () => {
    setTranslationStatus(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const textsToTranslate = itemsMissingTranslations.flatMap(item => {
        const texts: { id: string; text: string; field: 'name' | 'description' }[] = []
        if (!item.nameFr && item.nameEn) {
          texts.push({ id: item.id, text: item.nameEn, field: 'name' })
        }
        if (!item.descriptionFr && item.descriptionEn) {
          texts.push({ id: item.id, text: item.descriptionEn, field: 'description' })
        }
        return texts
      })

      if (textsToTranslate.length === 0) {
        setTranslationStatus(prev => ({ ...prev, isLoading: false }))
        return
      }

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: textsToTranslate.map(t => t.text),
          targetLang: 'FR',
          sourceLang: 'EN',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || "Erreur lors de la traduction"
        setTranslationStatus(prev => ({ ...prev, isLoading: false, error: errorMessage }))
        toast({ title: "Erreur de traduction", description: errorMessage, variant: "destructive" })
        return
      }

      const translations = data.translations as string[]
      const newTranslatedNames = new Map(translationStatus.translatedNames)
      const newTranslatedItems = new Map(translationStatus.translatedItems)
      const newDeeplIds = new Set(deeplTranslatedIds)

      textsToTranslate.forEach((item, index) => {
        if (item.field === 'name') {
          newTranslatedNames.set(item.id, translations[index])
        } else {
          newTranslatedItems.set(item.id, translations[index])
        }
        newDeeplIds.add(item.id)
      })

      setTranslationStatus({
        isLoading: false,
        translatedNames: newTranslatedNames,
        translatedItems: newTranslatedItems,
        error: null,
      })
      setDeeplTranslatedIds(newDeeplIds)

      toast({
        title: "Traduction terminee",
        description: `${translations.length} texte(s) traduit(s) via DeepL`,
      })
    } catch (error) {
      const errorMessage = `Erreur: ${String(error)}`
      setTranslationStatus(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      toast({ title: "Erreur de traduction", description: errorMessage, variant: "destructive" })
    }
  }, [itemsMissingTranslations, translationStatus.translatedNames, translationStatus.translatedItems, deeplTranslatedIds, toast])

  // Validate a single item
  const handleValidateItem = useCallback((itemId: string) => {
    setValidatedIds(prev => new Set(prev).add(itemId))
  }, [])

  // Compute to-verify items
  const toVerifyItems = useMemo(() => {
    return allUnifiedItems.filter(item => {
      if (!item.nameFr && !translationStatus.translatedNames.has(item.id)) return false
      if (!item.descriptionFr && !translationStatus.translatedItems.has(item.id)) return false
      if (validatedIds.has(item.id)) return false
      return deeplTranslatedIds.has(item.id)
    })
  }, [allUnifiedItems, deeplTranslatedIds, validatedIds, translationStatus])

  // Bulk validate all "to-verify" items
  const handleBulkValidate = useCallback(() => {
    setValidatedIds(prev => {
      const next = new Set(prev)
      toVerifyItems.forEach(item => next.add(item.id))
      return next
    })
    toast({
      title: "Validation en lot",
      description: `${toVerifyItems.length} traduction(s) validee(s)`,
    })
  }, [toVerifyItems, toast])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="BU - Validation des traductions" />
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
                  onClick={() => setActiveTab("normal")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                    activeTab === "normal"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Table className="w-4 h-4" />
                  Tableau
                </button>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                    activeTab === "pending"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  A traiter
                  {(pendingRequests.length + toVerifyItems.length) > 0 && (
                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {pendingRequests.length + toVerifyItems.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
                    activeTab === "completed"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Traitees
                  {completedRequests.length > 0 && (
                    <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {completedRequests.length}
                    </span>
                  )}
                </button>
              </div>

              {activeTab === "normal" ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <h2 className="text-lg font-semibold text-foreground">
                        {viewMode === "hierarchy"
                          ? `Catalogue produits (${filteredData.length} elements)`
                          : `Vue Value First (${filteredValueFirstData.length} valeurs)`
                        }
                      </h2>
                      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        <button
                          onClick={() => setViewMode("hierarchy")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            viewMode === "hierarchy"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Hierarchie
                        </button>
                        <button
                          onClick={() => setViewMode("value-first")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            viewMode === "value-first"
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Value First
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleAutoTranslate}
                        disabled={missingTranslationsCount === 0 || translationStatus.isLoading}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg transition-colors",
                          (missingTranslationsCount === 0 || translationStatus.isLoading) 
                            ? "opacity-50 cursor-not-allowed" 
                            : "hover:bg-primary/90"
                        )}
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
                        Modifiees uniquement (0)
                      </ToggleButton>
                      <button
                        onClick={() => setShowFilter(!showFilter)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                      >
                        <Filter className="w-4 h-4" />
                        {showFilter ? "Masquer filtres" : "Afficher filtres"}
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
                        <RequesterTranslationTable 
                          data={filteredData} 
                          selectedIds={selectedIds}
                          showMissingOnly={showMissingOnly}
                          showModifiedOnly={showModifiedOnly}
                          searchQuery={searchQuery}
                          columnConfig={columnConfig}
                          translatedNames={translationStatus.translatedNames}
                          translatedDescriptions={translationStatus.translatedItems}
                          showStatusColumn={true}
                          deeplTranslatedIds={deeplTranslatedIds}
                          validatedIds={validatedIds}
                          onValidateItem={handleValidateItem}
                          onBulkValidate={handleBulkValidate}
                          toVerifyCount={toVerifyItems.length}
                        />
                      ) : (
                        <ValueFirstTable 
                          data={filteredValueFirstData}
                        />
                      )}
                    </div>
                  </div>
                </>
              ) : activeTab === "pending" ? (
                <>
                  {/* Sub-tabs */}
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1 mb-4 w-fit">
                    <button
                      onClick={() => setPendingSubTab("requests")}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        pendingSubTab === "requests"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Demandes Requester
                      {pendingRequests.length > 0 && (
                        <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {pendingRequests.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setPendingSubTab("validations")}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        pendingSubTab === "validations"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Traductions a valider
                      {toVerifyItems.length > 0 && (
                        <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {toVerifyItems.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {pendingSubTab === "requests" ? (
                    pendingRequests.length > 0 ? (
                      <div className="space-y-8">
                        {pendingRequests.map(request => {
                          // Get fresh request data on each render to ensure updates are shown
                          const freshRequest = getRequestById(request.id)
                          if (!freshRequest) return null
                          
                          return (
                            <div key={request.id} className="bg-card rounded-lg border border-border p-6">
                              <BURequestReview 
                                request={freshRequest}
                                onUpdateItem={handleUpdateItem}
                                onCompleteRequest={handleCompleteRequest}
                              />
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Inbox className="w-16 h-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Aucune demande en attente de validation
                        </h3>
                        <p className="text-muted-foreground max-w-md">
                          Les demandes soumises par les Requesters apparaitront ici
                        </p>
                      </div>
                    )
                  ) : (
                    /* Validations list */
                    <div className="space-y-4">
                      {toVerifyItems.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              {toVerifyItems.length} traduction(s) generee(s) par DeepL en attente de validation humaine.
                            </p>
                            <button
                              onClick={handleBulkValidate}
                              className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Tout valider ({toVerifyItems.length})
                            </button>
                          </div>
                          <div className="bg-card rounded-lg border border-border overflow-hidden">
                            <div className="overflow-x-scroll overflow-y-auto max-h-[500px] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50 sticky top-0 z-10">
                                  <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-foreground">Type</th>
                                    <th className="text-left px-4 py-3 font-semibold text-foreground">ID</th>
                                    <th className="text-left px-4 py-3 font-semibold text-foreground">Name EN</th>
                                    <th className="text-left px-4 py-3 font-semibold text-foreground">Name FR (DeepL)</th>
                                    <th className="text-left px-4 py-3 font-semibold text-foreground">Description EN</th>
                                    <th className="text-left px-4 py-3 font-semibold text-foreground">Description FR (DeepL)</th>
                                    <th className="text-center px-4 py-3 font-semibold text-foreground sticky right-0 bg-muted/50 shadow-[-2px_0_4px_rgba(0,0,0,0.1)]">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {toVerifyItems.map(item => (
                                    <tr key={item.id} className="hover:bg-muted/30">
                                      <td className="px-4 py-3">
                                        <span className={cn("text-xs px-2 py-1 rounded font-medium whitespace-nowrap", levelColors[item.type as keyof typeof levelColors])}>
                                          {item.type}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.id}</td>
                                      <td className="px-4 py-3">{item.nameEn || '-'}</td>
                                      <td className="px-4 py-3 text-blue-700 font-medium">
                                        {translationStatus.translatedNames.get(item.id) || item.nameFr || '-'}
                                      </td>
                                      <td className="px-4 py-3 max-w-xs truncate">{item.descriptionEn || '-'}</td>
                                      <td className="px-4 py-3 max-w-xs truncate text-blue-700 font-medium">
                                        {translationStatus.translatedItems.get(item.id) || item.descriptionFr || '-'}
                                      </td>
                                      <td className="px-4 py-3 text-center sticky right-0 bg-card shadow-[-2px_0_4px_rgba(0,0,0,0.08)]">
                                        <button
                                          onClick={() => handleValidateItem(item.id)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mx-auto"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          Valider
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-1">Aucune traduction a valider</h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            Les traductions generees par DeepL apparaitront ici pour validation manuelle.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                completedRequests.length > 0 ? (
                  <div className="space-y-8">
                    {completedRequests.map(request => {
                      const freshRequest = getRequestById(request.id)
                      if (!freshRequest) return null
                      
                      return (
                        <div key={request.id} className="bg-card rounded-lg border border-border p-6">
                          <BURequestReview 
                            request={freshRequest}
                            onUpdateItem={handleUpdateItem}
                            onCompleteRequest={handleCompleteRequest}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CheckCircle2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Aucune demande traitee
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      Les demandes que vous avez validees apparaitront ici
                    </p>
                  </div>
                )
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
