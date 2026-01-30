"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  Clock, 
  CheckCircle2, 
  Eye, 
  Inbox,
  ChevronRight,
  User
} from "lucide-react"
import type { ValidationRequest, RequestStatus } from "@/lib/validation-store"

const statusConfig: Record<RequestStatus, { label: string; icon: typeof Clock; className: string }> = {
  draft: { 
    label: "Brouillon", 
    icon: Clock, 
    className: "bg-gray-100 text-gray-800" 
  },
  pending: { 
    label: "En attente", 
    icon: Clock, 
    className: "bg-amber-100 text-amber-800" 
  },
  in_review: { 
    label: "En cours", 
    icon: Eye, 
    className: "bg-blue-100 text-blue-800" 
  },
  completed: { 
    label: "Terminee", 
    icon: CheckCircle2, 
    className: "bg-green-100 text-green-800" 
  },
}

interface BURequestListProps {
  requests: ValidationRequest[]
  onSelectRequest: (requestId: string) => void
  emptyMessage: string
  emptyDescription: string
  showStats?: boolean
}

export function BURequestList({ 
  requests, 
  onSelectRequest,
  emptyMessage,
  emptyDescription,
  showStats = false
}: BURequestListProps) {
  // Sort by date (newest first for pending, oldest first for in_review to prioritize)
  const sortedRequests = [...requests].sort((a, b) => {
    // Prioritize in_review requests
    if (a.status === 'in_review' && b.status !== 'in_review') return -1
    if (b.status === 'in_review' && a.status !== 'in_review') return 1
    // Then by date
    return new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime()
  })

  if (sortedRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {emptyMessage}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {emptyDescription}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {showStats ? `Demandes traitees (${sortedRequests.length})` : `Demandes a traiter (${sortedRequests.length})`}
        </h2>
      </div>

      <div className="space-y-3">
        {sortedRequests.map((request) => {
          const statusInfo = statusConfig[request.status]
          const StatusIcon = statusInfo.icon
          const approvedCount = request.items.filter(i => i.status === 'approved').length
          const modifiedCount = request.items.filter(i => i.status === 'modified').length
          const rejectedCount = request.items.filter(i => i.status === 'rejected').length

          return (
            <button
              key={request.id}
              onClick={() => onSelectRequest(request.id)}
              className="w-full bg-card rounded-lg border border-border p-4 hover:border-primary/50 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">
                        Demande #{request.id.slice(-6)}
                      </span>
                      <Badge className={cn("text-xs", statusInfo.className)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{request.items.length} traduction(s)</span>
                      <span>Soumise le {new Date(request.submittedAt || request.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {showStats && request.status === 'completed' && (
                    <div className="flex items-center gap-3 text-sm">
                      {approvedCount > 0 && (
                        <span className="text-green-600">{approvedCount} approuvee(s)</span>
                      )}
                      {modifiedCount > 0 && (
                        <span className="text-blue-600">{modifiedCount} modifiee(s)</span>
                      )}
                      {rejectedCount > 0 && (
                        <span className="text-red-600">{rejectedCount} refusee(s)</span>
                      )}
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
