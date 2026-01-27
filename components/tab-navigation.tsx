'use client';

import { cn } from "@/lib/utils"

interface TabNavigationProps {
  tabs: string[]
  activeTab: string
  onTabChange: (tab: string) => void
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  return (
    <nav className="flex items-center gap-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === tab
              ? "bg-primary/15 text-primary rounded-md"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}
