"use client"

import { InputMode } from "@/types"
import { cn } from "@/lib/utils"
import { BookOpen, Zap, MessageSquare, Users, BarChart2 } from "lucide-react"

export const MODES = [
  { id: "journal", label: "Journal", icon: BookOpen, desc: "Free write" },
  { id: "pulse", label: "Pulse", icon: Zap, desc: "2-min check-in" },
  {
    id: "debrief",
    label: "Debrief",
    icon: MessageSquare,
    desc: "After a meeting",
  },
  { id: "network", label: "Network", icon: Users, desc: "Log a connection" },
  { id: "review", label: "Review", icon: BarChart2, desc: "Weekly wrap-up" },
] as const

interface ModeSelectorProps {
  selectedMode: InputMode
  onSelect: (mode: InputMode) => void
}

export function ModeSelector({ selectedMode, onSelect }: ModeSelectorProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-5">
      {MODES.map((mode) => {
        const Icon = mode.icon
        const isSelected = selectedMode === mode.id

        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onSelect(mode.id as InputMode)}
            className={cn(
              "focus-visible:ring-ring flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none",
              isSelected
                ? "border-primary bg-primary/5 scale-[1.02] shadow-sm"
                : "border-border bg-card hover:bg-accent hover:text-accent-foreground hover:scale-[1.01]"
            )}
            aria-pressed={isSelected}
          >
            <div
              className={cn(
                "rounded-lg p-2.5 transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="mt-1 space-y-1.5">
              <h3
                className={cn(
                  "leading-none font-semibold tracking-tight",
                  isSelected ? "text-foreground" : "text-card-foreground/80"
                )}
              >
                {mode.label}
              </h3>
              <p className="text-muted-foreground line-clamp-1 text-xs">
                {mode.desc}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
