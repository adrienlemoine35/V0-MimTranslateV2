"use client"

import { useState, useMemo, useCallback } from "react"
import { 
  ArrowLeft,
  Clock,
  CheckCircle2,
  Eye,
  FileText,
  Inbox,
  Table
} from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { BURequestList } from "@/components/bu-request-list"
import { BURequestReview } from "@/components/bu-request-review"
import { TranslationTable } from "@/components/translation-table"
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

type ViewTab = "pending" | "completed" | "normal"

export default function BUPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<ViewTab>("pending")
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

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
                  Tableau Normal
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
                </button>
              </div>

              {activeTab === "normal" ? (
                <TranslationTable />
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
    </div>
  )
}
