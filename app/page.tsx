"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { TabNavigation } from "@/components/tab-navigation"
import { ActionCard } from "@/components/action-card"
import { ImportantNotes } from "@/components/important-notes"
import { UserCircle, Users } from "lucide-react"
import { 
  getPendingRequestsForBU, 
  getCompletedRequests, 
  getDraftItemCount 
} from "@/lib/validation-store"

export default function ModelInformationManagement() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("Value")
  const [selectedCard, setSelectedCard] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isClient, setIsClient] = useState(false)

  const tabs = ["Dashboard", "Model", "Characteristic", "Value"]

  // Ensure client-side only rendering for localStorage-dependent data
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Get counts for badges (only on client to avoid hydration mismatch)
  const pendingForBU = useMemo(() => {
    if (!isClient) return 0
    void refreshKey
    try {
      return getPendingRequestsForBU().length
    } catch (error) {
      console.error("[v0] Error getting pending requests:", error)
      return 0
    }
  }, [refreshKey, isClient])

  const completedForRequester = useMemo(() => {
    if (!isClient) return 0
    void refreshKey
    try {
      return getCompletedRequests().filter(r => !r.buComment?.includes('[seen]')).length
    } catch (error) {
      console.error("[v0] Error getting completed requests:", error)
      return 0
    }
  }, [refreshKey, isClient])

  const draftItemCount = useMemo(() => {
    if (!isClient) return 0
    void refreshKey
    try {
      return getDraftItemCount()
    } catch (error) {
      console.error("[v0] Error getting draft item count:", error)
      return 0
    }
  }, [refreshKey, isClient])

  const actionCards = [
    {
      icon: UserCircle,
      title: "Personae Requester",
      description: "Creer et soumettre des demandes de traduction pour validation par le BU",
      route: "/requester",
      badge: completedForRequester + draftItemCount,
      badgeLabel: completedForRequester > 0 ? "reponse(s) du BU" : "dans le panier",
    },
    {
      icon: Users,
      title: "Personae BU",
      description: "Valider, modifier ou refuser les demandes de traduction des Requesters",
      route: "/bu",
      badge: pendingForBU,
      badgeLabel: "demande(s) a traiter",
    },
  ]

  const notes = [
    "All value creation require DQO final validation but some simple value can be automatically approved",
    "Not all value addition require a DQO final validation. It depends of the value autonomy",
    "Requests are only created after all mandatory rules pass",
    "Only closed characteristics are accepted",
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="bg-white px-8 py-4 border-b border-gray-200">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
        <main className="flex-1 overflow-auto px-8 py-6 bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actionCards.map((card, index) => (
              <ActionCard
                key={index}
                icon={card.icon}
                title={card.title}
                description={card.description}
                isSelected={selectedCard === index}
                badge={card.badge}
                badgeLabel={card.badgeLabel}
                onClick={() => {
                  setSelectedCard(index)
                  if (card.route) {
                    router.push(card.route)
                  }
                }}
              />
            ))}
          </div>
          <ImportantNotes notes={notes} className="mt-6" />
        </main>
      </div>
    </div>
  )
}
