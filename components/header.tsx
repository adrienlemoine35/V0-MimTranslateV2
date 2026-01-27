import { HelpCircle, Bell } from "lucide-react"

interface HeaderProps {
  title?: string
}

export function Header({ title = "Model information management" }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-border px-8 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-foreground">
        {title}
      </h1>
      <div className="flex items-center gap-4">
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
