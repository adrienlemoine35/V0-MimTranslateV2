"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronDown,
  ChevronRight,
  FileText,
  Eye
} from "lucide-react"
import type { ValidationRequest, RequestStatus, ItemStatus } from "@/lib/validation-store"

const statusConfig: Record<RequestStatus, { label: string; icon: typeof Clock; className: string }> = {
  draft: { 
    label: "Brouillon", 
    icon: FileText, 
    className: "bg-gray-100 text-gray-800" 
  },
  pending: { 
    label: "En attente", 
    icon: Clock, 
    className: "bg-amber-100 text-amber-800" 
  },
  in_review: { 
    label: "En cours de revue", 
    icon: Eye, 
    className: "bg-blue-100 text-blue-800" 
  },
  completed: { 
    label: "Terminee", 
    icon: CheckCircle2, 
    className: "bg-green-100 text-green-800" 
  },
}

const itemStatusConfig: Record<ItemStatus, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-gray-100 text-gray-800" },
  approved: { label: "Approuve", className: "bg-green-100 text-green-800" },
  modified: { label: "Modifie", className: "bg-blue-100 text-blue-800" },
  rejected: { label: "Refuse", className: "bg-red-100 text-red-800" },
}

const levelColors: Record<string, string> = {
  "Rayon": "bg-blue-100 text-blue-800",
  "Sous-Rayon": "bg-green-100 text-green-800",
  "Regroupement": "bg-amber-100 text-amber-800",
  "Modèle": "bg-violet-100 text-violet-800",
  "Caractéristique": "bg-purple-100 text-purple-800",
  "Valeur": "bg-pink-100 text-pink-800",
}

interface RequestHistoryProps {
  requests: ValidationRequest[]
}

export function RequestHistory({ requests }: RequestHistoryProps) {
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set())

  const toggleExpanded = (requestId: string) => {
    setExpandedRequests(prev => {
      const next = new Set(prev)
      if (next.has(requestId)) {
        next.delete(requestId)
      } else {
        next.add(requestId)
      }
      return next
    })
  }

  // Filter out draft requests and sort by date (newest first)
  const filteredRequests = requests
    .filter(req => req.status !== 'draft')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (filteredRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Aucune demande soumise
        </h3>
        <p className="text-muted-foreground max-w-md">
          Vous n'avez pas encore soumis de demande de validation.
          Commencez par ajouter des traductions a votre panier, puis soumettez-les au BU.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Historique des demandes ({filteredRequests.length})
        </h2>
      </div>

      <div className="space-y-4">
        {filteredRequests.map((request) => {
          const statusInfo = statusConfig[request.status]
          const StatusIcon = statusInfo.icon
          const isExpanded = expandedRequests.has(request.id)

          return (
            <div 
              key={request.id} 
              className="bg-card rounded-lg border border-border overflow-hidden"
            >
              {/* Request header */}
              <button
                onClick={() => toggleExpanded(request.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
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
                      {request.completedAt && (
                        <span>Terminee le {new Date(request.completedAt).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {request.status === 'completed' && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">
                      {request.items.filter(i => i.status === 'approved').length} approuvee(s)
                    </span>
                    <span className="text-blue-600">
                      {request.items.filter(i => i.status === 'modified').length} modifiee(s)
                    </span>
                    <span className="text-red-600">
                      {request.items.filter(i => i.status === 'rejected').length} refusee(s)
                    </span>
                  </div>
                )}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-border">
                  {/* BU Comment if any */}
                  {request.buComment && (
                    <div className="m-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 text-sm mb-1">Commentaire du BU</h4>
                      <p className="text-sm text-blue-800">{request.buComment}</p>
                    </div>
                  )}

                  {/* Items table */}
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold text-foreground w-28">Type</TableHead>
                        <TableHead className="font-semibold text-foreground w-24">ID</TableHead>
                        <TableHead className="font-semibold text-foreground">Proposition</TableHead>
                        <TableHead className="font-semibold text-foreground">Final</TableHead>
                        <TableHead className="font-semibold text-foreground w-28">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {request.items.map((item) => {
                        const itemStatus = itemStatusConfig[item.status]
                        return (
                          <TableRow key={item.id} className="hover:bg-muted/30">
                            <TableCell>
                              <span className={cn("text-xs px-2 py-1 rounded font-medium whitespace-nowrap", levelColors[item.itemType] || "bg-gray-100 text-gray-800")}>
                                {item.itemType}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm">
                              {item.itemId}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Nom: </span>
                                  {item.proposedNameFr || <span className="italic text-muted-foreground">-</span>}
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Desc: </span>
                                  <span className="truncate">{item.proposedDescriptionFr || <span className="italic text-muted-foreground">-</span>}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {request.status === 'completed' ? (
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Nom: </span>
                                    <span className={item.finalNameFr !== item.proposedNameFr ? "text-blue-600 font-medium" : ""}>
                                      {item.finalNameFr || <span className="italic text-muted-foreground">-</span>}
                                    </span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Desc: </span>
                                    <span className={item.finalDescriptionFr !== item.proposedDescriptionFr ? "text-blue-600 font-medium" : ""}>
                                      {item.finalDescriptionFr || <span className="italic text-muted-foreground">-</span>}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-sm">En attente</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("text-xs", itemStatus.className)}>
                                {itemStatus.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
