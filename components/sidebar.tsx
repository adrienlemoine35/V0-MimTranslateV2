"use client"

import { Home, ChevronsRight, CornerDownRight, Languages } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function Sidebar() {
  const navigationItems = [
    { icon: ChevronsRight, href: "#" },
    { icon: Home, href: "/" },
    { icon: Languages, href: "/translation" },
    { icon: CornerDownRight, href: "#" },
    { icon: CornerDownRight, href: "#" },
    { icon: CornerDownRight, href: "#" },
    { icon: CornerDownRight, href: "#" },
    { icon: CornerDownRight, href: "#" },
    { icon: CornerDownRight, href: "#" },
    { icon: CornerDownRight, href: "#" },
  ]

  return (
    <aside className="w-16 bg-sidebar flex flex-col items-center py-4">
      <nav className="flex-1 flex flex-col items-center gap-2">
        {navigationItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-sidebar-foreground hover:text-white transition-colors"
          >
            <item.icon className="w-5 h-5" />
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
          <Image
            src="/images/avatar.jpg"
            alt="User avatar"
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </aside>
  )
}
