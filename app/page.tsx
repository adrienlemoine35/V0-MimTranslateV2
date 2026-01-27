"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { TabNavigation } from "@/components/tab-navigation"
import { ActionCard } from "@/components/action-card"
import { ImportantNotes } from "@/components/important-notes"
import { FileText, Layers, Package } from "lucide-react"

export default function ModelInformationManagement() {
  const [activeTab, setActiveTab] = useState("Value")
  const [selectedCard, setSelectedCard] = useState(0)

  const tabs = ["Dashboard", "Model", "Characteristic", "Value"]

  const actionCards = [
    {
      icon: FileText,
      title: "Add value(s) to single model",
      description: "Create or add a value for one specific model and characteristic",
    },
    {
      icon: Layers,
      title: "Add value(s) to several models",
      description: "Create or add a value across multiple models",
    },
    {
      icon: Package,
      title: "3P Brand Creation",
      description: "Create a third-party brand with automatic duplicate detection",
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
                onClick={() => setSelectedCard(index)}
              />
            ))}
          </div>
          <ImportantNotes notes={notes} className="mt-6" />
        </main>
      </div>
    </div>
  )
}
