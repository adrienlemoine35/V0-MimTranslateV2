"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Trash2, Send, ShoppingCart } from "lucide-react"
import type { ValidationRequest } from "@/lib/validation-store"

const levelColors: Record<string, string> = {
  "Rayon": "bg-blue-100 text-blue-800",
  "Sous-Rayon": "bg-green-100 text-green-800",
  "Regroupement": "bg-amber-100 text-amber-800",
  "Modèle": "bg-violet-100 text-violet-800",
  "Caractéristique": "bg-purple-100 text-purple-800",
  "Valeur": "bg-pink-100 text-pink-800",
}

interface RequestBasketProps {
  draftRequest: ValidationRequest | undefined
  onRemoveItem: (itemId: string) => void
  onSubmitRequest: () => void
}

export function RequestBasket({ 
  draftRequest, 
  onRemoveItem, 
  onSubmitRequest 
}: RequestBasketProps) {
  if (!draftRequest || draftRequest.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingCart className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Votre panier est vide
        </h3>
        <p className="text-muted-foreground max-w-md">
          Commencez par traduire des elements dans l'onglet "Traduire", 
          puis ajoutez-les a votre panier en cliquant sur le bouton +.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Panier de traductions
          </h2>
          <p className="text-sm text-muted-foreground">
            {draftRequest.items.length} traduction(s) prete(s) a etre soumise(s) pour validation
          </p>
        </div>
        <Button 
          onClick={onSubmitRequest}
          className="flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Soumettre au BU
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-foreground w-32">Type</TableHead>
              <TableHead className="font-semibold text-foreground w-24">ID</TableHead>
              <TableHead className="font-semibold text-foreground">Name EN</TableHead>
              <TableHead className="font-semibold text-foreground">Traduction FR proposee</TableHead>
              <TableHead className="font-semibold text-foreground">Description EN</TableHead>
              <TableHead className="font-semibold text-foreground">Traduction FR proposee</TableHead>
              <TableHead className="font-semibold text-foreground w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draftRequest.items.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/30">
                <TableCell>
                  <span className={cn("text-xs px-2 py-1 rounded font-medium whitespace-nowrap", levelColors[item.itemType] || "bg-gray-100 text-gray-800")}>
                    {item.itemType}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {item.itemId}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.nameEn}
                </TableCell>
                <TableCell className="font-medium">
                  {item.proposedNameFr || (
                    <span className="text-muted-foreground italic">Non modifie</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                  {item.descriptionEn}
                </TableCell>
                <TableCell className="max-w-xs text-sm">
                  {item.proposedDescriptionFr || (
                    <span className="text-muted-foreground italic">Non modifie</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.itemId)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-1">Information</h4>
        <p className="text-sm text-blue-800">
          Une fois soumise, cette demande sera envoyee au BU pour validation. 
          Vous pourrez suivre son statut dans l'onglet "Historique".
          Le BU pourra approuver, modifier ou refuser chaque traduction.
        </p>
      </div>
    </div>
  )
}
