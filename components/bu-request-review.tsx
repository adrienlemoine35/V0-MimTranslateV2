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
  ArrowLeft, 
  Check, 
  X, 
  Edit3, 
  CheckCircle2,
  AlertCircle,
  Send,
  ChevronDown,
  ChevronRight,
  ArrowRight
} from "lucide-react"
import type { ValidationRequest, TranslationItem, ItemStatus } from "@/lib/validation-store"

const levelColors: Record<string, string> = {
  "Rayon": "bg-blue-100 text-blue-800",
  "Sous-Rayon": "bg-green-100 text-green-800",
  "Regroupement": "bg-amber-100 text-amber-800",
  "Modèle": "bg-violet-100 text-violet-800",
  "Caractéristique": "bg-purple-100 text-purple-800",
  "Valeur": "bg-pink-100 text-pink-800",
}

const itemStatusConfig: Record<ItemStatus, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-gray-100 text-gray-800" },
  approved: { label: "Approuve", className: "bg-green-100 text-green-800" },
  modified: { label: "Modifie", className: "bg-blue-100 text-blue-800" },
  rejected: { label: "Refuse", className: "bg-red-100 text-red-800" },
}

interface BURequestReviewProps {
  request: ValidationRequest
  onBack?: () => void
  onUpdateItem: (itemId: string, finalNameFr: string, finalDescriptionFr: string, status: ItemStatus) => void
  onCompleteRequest: (requestId: string, comment?: string) => void
}

export function BURequestReview({ 
  request, 
  onBack,
  onUpdateItem,
  onCompleteRequest
}: BURequestReviewProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ nameFr: string; descriptionFr: string }>({ nameFr: '', descriptionFr: '' })
  const [comment, setComment] = useState(request.buComment || '')
  const [expandedValues, setExpandedValues] = useState<Set<string>>(new Set())

  // Count items by status
  const pendingCount = request.items.filter(i => i.status === 'pending').length
  const processedCount = request.items.length - pendingCount
  const allProcessed = pendingCount === 0

  const handleStartEdit = (item: TranslationItem) => {
    setEditingItem(item.id)
    setEditValues({
      nameFr: item.finalNameFr || item.proposedNameFr || '',
      descriptionFr: item.finalDescriptionFr || item.proposedDescriptionFr || ''
    })
  }

  const handleApprove = (item: TranslationItem) => {
    onUpdateItem(
      item.id,
      item.proposedNameFr,
      item.proposedDescriptionFr,
      'approved'
    )
  }

  const handleReject = (item: TranslationItem) => {
    onUpdateItem(
      item.id,
      item.proposedNameFr,
      item.proposedDescriptionFr,
      'rejected'
    )
  }

  const handleSaveEdit = (item: TranslationItem) => {
    const hasChanges = 
      editValues.nameFr !== item.proposedNameFr || 
      editValues.descriptionFr !== item.proposedDescriptionFr
    
    onUpdateItem(
      item.id,
      editValues.nameFr,
      editValues.descriptionFr,
      hasChanges ? 'modified' : 'approved'
    )
    setEditingItem(null)
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setEditValues({ nameFr: '', descriptionFr: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Demande #{request.id.slice(-6)}
            </h2>
            <p className="text-sm text-muted-foreground">
              Soumise le {new Date(request.submittedAt || request.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Progression: </span>
            <span className="font-medium">{processedCount}/{request.items.length}</span>
          </div>
          <Button 
            onClick={() => onCompleteRequest(request.id, comment)}
            disabled={!allProcessed}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Finaliser la demande
          </Button>
        </div>
      </div>

      {/* Warning if not all processed */}
      {!allProcessed && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900">Traitement incomplet</h4>
            <p className="text-sm text-amber-800">
              {pendingCount} traduction(s) n'ont pas encore ete traitee(s). 
              Vous devez approuver, modifier ou refuser toutes les traductions avant de finaliser la demande.
            </p>
          </div>
        </div>
      )}

      {/* Items table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-foreground w-12"></TableHead>
              <TableHead className="font-semibold text-foreground w-24">Type</TableHead>
              <TableHead className="font-semibold text-foreground w-24">ID</TableHead>
              <TableHead className="font-semibold text-foreground" colSpan={2}>
                <div className="flex items-center justify-center gap-2 text-center">
                  <span className="flex-1 text-right">AVANT</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-left">APRÈS</span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground w-28 text-center">Statut</TableHead>
              <TableHead className="font-semibold text-foreground w-32 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {request.items.map((item) => {
              const statusInfo = itemStatusConfig[item.status]
              const isEditing = editingItem === item.id
              const isValue = item.itemType === "Valeur"
              const isExpanded = expandedValues.has(item.id)

              return (
                <>
                  <TableRow 
                    key={item.id} 
                    className={cn(
                      "hover:bg-muted/30",
                      item.status === 'pending' && "bg-amber-50/50",
                      item.status === 'approved' && "bg-green-50/50",
                      item.status === 'modified' && "bg-blue-50/50",
                      item.status === 'rejected' && "bg-red-50/50"
                    )}
                  >
                    {/* Chevron for Values */}
                    <TableCell className="px-2">
                      {isValue && (
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedValues)
                            if (isExpanded) {
                              newExpanded.delete(item.id)
                            } else {
                              newExpanded.add(item.id)
                            }
                            setExpandedValues(newExpanded)
                          }}
                          className="p-1 hover:bg-muted rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <span className={cn("text-xs px-2 py-1 rounded font-medium whitespace-nowrap", levelColors[item.itemType] || "bg-gray-100 text-gray-800")}>
                        {item.itemType}
                      </span>
                    </TableCell>

                    {/* ID + EN Reference */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-muted-foreground font-mono text-xs">{item.itemId}</div>
                        <div className="text-xs text-muted-foreground/70 italic">
                          <div className="truncate max-w-[120px]" title={item.nameEn}>EN: {item.nameEn}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* AVANT (Original FR) */}
                    <TableCell className="border-r-2 border-border bg-red-50/30">
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Name FR</div>
                          <div className="text-sm">
                            {item.originalNameFr || <span className="italic text-muted-foreground">Vide</span>}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Description FR</div>
                          <div className="text-xs text-muted-foreground max-w-xs">
                            {item.originalDescriptionFr || <span className="italic">Vide</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* APRÈS (Proposition + Final) */}
                    <TableCell className="bg-green-50/30">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Name FR</label>
                            <input
                              type="text"
                              value={editValues.nameFr}
                              onChange={(e) => setEditValues(v => ({ ...v, nameFr: e.target.value }))}
                              className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="Nom FR"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description FR</label>
                            <textarea
                              value={editValues.descriptionFr}
                              onChange={(e) => setEditValues(v => ({ ...v, descriptionFr: e.target.value }))}
                              className="w-full px-2 py-1.5 text-xs border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                              placeholder="Description FR"
                              rows={2}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Name FR */}
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Name FR</div>
                            <div className="text-sm font-medium text-blue-700">
                              {item.proposedNameFr || <span className="italic text-muted-foreground">Non modifié</span>}
                            </div>
                            {item.finalNameFr && item.finalNameFr !== item.proposedNameFr && (
                              <div className="mt-1 text-sm border-l-2 border-green-600 pl-2 bg-green-50 py-1">
                                <div className="text-xs text-green-700 font-medium">→ Corrigé par BU:</div>
                                <div className="text-green-800 font-medium">{item.finalNameFr}</div>
                              </div>
                            )}
                          </div>

                          {/* Description FR */}
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Description FR</div>
                            <div className="text-xs text-blue-700 max-w-xs">
                              {item.proposedDescriptionFr || <span className="italic text-muted-foreground">Non modifié</span>}
                            </div>
                            {item.finalDescriptionFr && item.finalDescriptionFr !== item.proposedDescriptionFr && (
                              <div className="mt-1 text-xs border-l-2 border-green-600 pl-2 bg-green-50 py-1">
                                <div className="text-xs text-green-700 font-medium">→ Corrigé par BU:</div>
                                <div className="text-green-800">{item.finalDescriptionFr}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <Badge className={cn("text-xs", statusInfo.className)}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(item)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Sauvegarder"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : item.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleApprove(item)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Approuver"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(item)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Refuser"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                          title="Modifier"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expanded context for Values */}
                  {isValue && isExpanded && (
                    <TableRow className="bg-purple-50/30">
                      <TableCell colSpan={7} className="py-3">
                        <div className="pl-8 space-y-2">
                          <div className="text-xs font-semibold text-purple-700 mb-2">Contexte de la valeur</div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Caractéristique:</span> {item.contextCharacteristic || 'Non spécifié'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Modèle:</span> {item.contextModel || 'Non spécifié'}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Comment section - moved below table */}
      <div className="bg-card rounded-lg border border-border p-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Commentaire global (optionnel)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ajouter un commentaire pour le Requester..."
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Ce commentaire sera visible par le Requester dans l'historique de sa demande.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span>Approuver (garde la proposition)</span>
        </div>
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-blue-600" />
          <span>Modifier (editer la traduction)</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="w-4 h-4 text-red-600" />
          <span>Refuser</span>
        </div>
      </div>
    </div>
  )
}
