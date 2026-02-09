"use client"

import { useState, useMemo, useCallback } from "react"
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
import { BURequestList } from "@/components/bu-request-list"
import { BURequestReview } from "@/components/bu-request-review"
import { RequesterTranslationTable } from "@/components/requester-translation-table"
import { ValueFirstTable } from "@/components/value-first-table"
import { TypeFilterAccordion } from "@/components/type-filter-accordion"
import { ColumnSettingsPanel, type ColumnConfig } from "@/components/column-settings-panel"
import { ToggleButton } from "@/components/ui/toggle-button"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import {
  getPendingRequestsForBU,
  getCompletedRequests,
  getRequestById,
  startReviewingRequest,
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
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
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
  
  const categoryTree = useMemo(() => buildCategoryTree(), [])
  const allUnifiedItems = useMemo(() => getAllUnifiedItems(), [])
  const valueFirstData = useMemo(() => getValueFirstView(), [])

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

  // Get requests
  const pendingRequests = useMemo(() => {
    void refreshKey
    return getPendingRequestsForBU()
  }, [refreshKey])

  const completedRequests = useMemo(() => {
    void refreshKey
    return getCompletedRequests()
  }, [refreshKey])

  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) return null
    return getRequestById(selectedRequestId) || null
  }, [selectedRequestId, refreshKey])

  // Handle selecting a request to review
  const handleSelectRequest = useCallback((requestId: string) => {
    const request = getRequestById(requestId)
    if (request && request.status === 'pending') {
      startReviewingRequest(requestId)
    }
    setSelectedRequestId(requestId)
    setRefreshKey(k => k + 1)
  }, [])

  // Handle going back to list
  const handleBackToList = useCallback(() => {
    setSelectedRequestId(null)
  }, [])

  // Handle updating an item
  const handleUpdateItem = useCallback((
    itemId: string, 
    finalNameFr: string, 
    finalDescriptionFr: string, 
    status: ItemStatus
  ) => {
    if (!selectedRequestId) return
    updateItemByBU(selectedRequestId, itemId, finalNameFr, finalDescriptionFr, status)
    setRefreshKey(k => k + 1)
  }, [selectedRequestId])

  // Handle completing the request
  const handleCompleteRequest = useCallback((comment?: string) => {
    if (!selectedRequestId) return
    
    const completed = completeRequest(selectedRequestId, comment)
    if (completed) {
      toast({
        title: "Demande finalisee",
        description: "La demande a ete traitee et le Requester a ete notifie",
      })
      setSelectedRequestId(null)
      setRefreshKey(k => k + 1)
    } else {
      toast({
        title: "Erreur",
        description: "Toutes les traductions doivent etre traitees avant de finaliser la demande",
        variant: "destructive"
      })
    }
  }, [selectedRequestId, toast])

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

          {selectedRequest ? (
            // Review mode
            <BURequestReview 
              request={selectedRequest}
              onBack={handleBackToList}
              onUpdateItem={handleUpdateItem}
              onCompleteRequest={handleCompleteRequest}
            />
          ) : (
            // List mode
            <>
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
                  {pendingRequests.length > 0 && (
                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {pendingRequests.length}
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
                        disabled
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg opacity-50 cursor-not-allowed"
                      >
                        <Languages className="w-4 h-4" />
                        Traduire via DeepL ({missingTranslationsCount})
                      </button>
                      <ToggleButton
                        pressed={showMissingOnly}
                        onPressedChange={setShowMissingOnly}
                        variant="amber"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Manquantes ({missingTranslationsCount})
                      </ToggleButton>
                      <ToggleButton
                        pressed={showModifiedOnly}
                        onPressedChange={setShowModifiedOnly}
                        variant="blue"
                      >
                        <Languages className="w-4 h-4" />
                        Modifiees (0)
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
                <BURequestList 
                  requests={pendingRequests}
                  onSelectRequest={handleSelectRequest}
                  emptyMessage="Aucune demande en attente de validation"
                  emptyDescription="Les demandes soumises par les Requesters apparaitront ici"
                />
              ) : (
                <BURequestList 
                  requests={completedRequests}
                  onSelectRequest={handleSelectRequest}
                  emptyMessage="Aucune demande traitee"
                  emptyDescription="Les demandes que vous avez validees apparaitront ici"
                  showStats
                />
              )}
            </>
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
