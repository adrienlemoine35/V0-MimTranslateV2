"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CharacteristicValue, Characteristic, ProductItem } from "@/lib/product-database"
import { characteristicsDatabase, productDatabase } from "@/lib/product-database"

interface ValueUsageRow {
  model: ProductItem
  characteristic: Characteristic
}

interface ValueUsageDrawerProps {
  isOpen: boolean
  onClose: () => void
  value: CharacteristicValue | null
}

function getUsageRows(value: CharacteristicValue | null): ValueUsageRow[] {
  if (!value) return []

  const rows: ValueUsageRow[] = []

  value.characteristicIds.forEach(charId => {
    const characteristic = characteristicsDatabase.find(c => c.id === charId)
    if (!characteristic) return

    characteristic.modelIds.forEach(modelId => {
      const model = productDatabase.find(p => p.id === modelId)
      if (!model) return
      rows.push({ model, characteristic })
    })
  })

  return rows
}

export function ValueUsageDrawer({ isOpen, onClose, value }: ValueUsageDrawerProps) {
  const rows = getUsageRows(value)

  if (!isOpen || !value) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[720px] bg-card border-l border-border shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <p className="text-xs font-mono text-muted-foreground mb-1">{value.id}</p>
            <h2 className="text-lg font-semibold text-foreground">
              {value.nameFr || value.nameEn}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              est utilisé <span className="font-semibold text-foreground">{rows.length}</span> fois dans la nomenclature
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 self-start"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Aucune utilisation trouvée
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    ID Modèle
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Nom du modèle FR
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Nom du modèle EN
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    ID Carac.
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Nom carac. FR
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Nom carac. EN
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${row.model.id}-${row.characteristic.id}`}
                    className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {row.model.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.model.nameFr || <span className="italic text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.model.nameEn}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {row.characteristic.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.characteristic.nameFr || <span className="italic text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.characteristic.nameEn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <Button onClick={onClose} className="w-full">
            Fermer
          </Button>
        </div>
      </div>
    </>
  )
}
