"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  BarChart2, 
  BookOpen, 
  Home, 
  Settings, 
  Share2, 
  Users,
  PenTool
} from "lucide-react"

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Capture", href: "/capture", icon: BookOpen },
  { name: "Brand Canvas", href: "/brand", icon: Share2 },
  { name: "Content Hub", href: "/content", icon: PenTool },
  { name: "Insights", href: "/insights", icon: BarChart2 },
  { name: "Network", href: "/network", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r bg-background hidden md:flex flex-col z-40">
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <span className="font-bold text-xl tracking-tight">Selfynk</span>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && item.href !== '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
