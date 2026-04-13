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
  AlertCircle,
  Send
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
  onBack: () => void
  onUpdateItem: (itemId: string, finalNameFr: string, finalDescriptionFr: string, status: ItemStatus) => void
  onCompleteRequest: (comment?: string) => void
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
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
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
            onClick={() => onCompleteRequest(comment)}
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

      {/* Items table - Same structure as TranslationTable */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-foreground w-32">Type</TableHead>
              <TableHead className="font-semibold text-foreground w-24">ID</TableHead>
              <TableHead className="font-semibold text-foreground">Name FR</TableHead>
              <TableHead className="font-semibold text-foreground">Name EN</TableHead>
              <TableHead className="font-semibold text-foreground">Description FR</TableHead>
              <TableHead className="font-semibold text-foreground">Description EN</TableHead>
              <TableHead className="font-semibold text-foreground w-28 text-center">Statut</TableHead>
              <TableHead className="font-semibold text-foreground w-32 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {request.items.map((item) => {
              const statusInfo = itemStatusConfig[item.status]
              const isEditing = editingItem === item.id

              return (
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
                  {/* Type */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs px-2 py-1 rounded font-medium whitespace-nowrap", levelColors[item.itemType] || "bg-gray-100 text-gray-800")}>
                        {item.itemType}
                      </span>
                    </div>
                  </TableCell>

                  {/* ID */}
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {item.itemId}
                  </TableCell>

                  {/* Name FR - Before/After */}
                  <TableCell className="font-medium">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValues.nameFr}
                        onChange={(e) => setEditValues(v => ({ ...v, nameFr: e.target.value }))}
                        className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Nom FR"
                      />
                    ) : (
                      <div className="space-y-1.5">
                        {/* Original (before) */}
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide min-w-[45px] mt-0.5">Avant:</span>
                          <span className="text-sm text-red-700 line-through opacity-70">
                            {item.originalNameFr || <span className="italic text-muted-foreground">-</span>}
                          </span>
                        </div>
                        {/* Proposed/Final (after) */}
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide min-w-[45px] mt-0.5">Après:</span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-green-700">
                              {(item.finalNameFr || item.proposedNameFr) || <span className="italic text-muted-foreground">-</span>}
                            </div>
                            {item.finalNameFr && item.finalNameFr !== item.proposedNameFr && (
                              <div className="text-xs text-blue-600 mt-0.5 italic">(modifié par BU)</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </TableCell>

                  {/* Name EN */}
                  <TableCell>{item.nameEn}</TableCell>

                  {/* Description FR - Before/After */}
                  <TableCell className="max-w-xs text-sm">
                    {isEditing ? (
                      <textarea
                        value={editValues.descriptionFr}
                        onChange={(e) => setEditValues(v => ({ ...v, descriptionFr: e.target.value }))}
                        className="w-full px-2 py-1.5 text-xs border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder="Description FR"
                        rows={3}
                      />
                    ) : (
                      <div className="space-y-1.5">
                        {/* Original (before) */}
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide min-w-[45px] mt-0.5 flex-shrink-0">Avant:</span>
                          <div className="text-xs text-red-700 line-through opacity-70 truncate">
                            {item.originalDescriptionFr || <span className="italic text-muted-foreground">-</span>}
                          </div>
                        </div>
                        {/* Proposed/Final (after) */}
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide min-w-[45px] mt-0.5 flex-shrink-0">Après:</span>
                          <div className="flex-1">
                            <div className="text-xs text-green-700 truncate">
                              {(item.finalDescriptionFr || item.proposedDescriptionFr) || <span className="italic text-muted-foreground">-</span>}
                            </div>
                            {item.finalDescriptionFr && item.finalDescriptionFr !== item.proposedDescriptionFr && (
                              <div className="text-[10px] text-blue-600 mt-0.5 italic">(modifié par BU)</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </TableCell>

                  {/* Description EN */}
                  <TableCell className="max-w-xs truncate text-sm">{item.descriptionEn}</TableCell>

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
