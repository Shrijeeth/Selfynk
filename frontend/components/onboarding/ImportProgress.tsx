"use client"

import { useEffect, useCallback } from "react"
import { Loader2, Check, X, ChevronUp, ChevronDown } from "lucide-react"
import { useState } from "react"
import api from "@/lib/api"
import { cn } from "@/lib/utils"
import { useImportJobStore } from "@/store/import-job"

const POLL_INTERVAL = 1500

interface PollResponse {
  job_id: string
  status: string
  steps: {
    label: string
    total: number
    completed: number
    status: string
  }[]
  current_step: number
  result: {
    answers: Record<string, string>
    confidence: Record<string, string>
    source_type: string
  } | null
  error: string | null
}

export function ImportProgress() {
  const { jobId, status, steps, dismissed, updateFromPoll, dismiss } =
    useImportJobStore()
  const [expanded, setExpanded] = useState(true)

  const poll = useCallback(async () => {
    if (!jobId) return
    try {
      const res = await api.get<PollResponse>(
        `/api/v1/onboarding/import-memory/${jobId}`
      )
      updateFromPoll(res.data)
    } catch {
      // silent — will retry on next tick
    }
  }, [jobId, updateFromPoll])

  useEffect(() => {
    if (!jobId || status === "completed" || status === "failed") return
    const timer = setInterval(poll, POLL_INTERVAL)
    // Poll immediately on mount
    poll()
    return () => clearInterval(timer)
  }, [jobId, status, poll])

  // Don't render if no active job or dismissed
  if (!jobId || dismissed) return null

  const isActive = status === "pending" || status === "running"
  const isDone = status === "completed"
  const isFailed = status === "failed"

  // Overall progress percentage
  const totalWork = steps.reduce((sum, s) => sum + (s.total || 1), 0)
  const completedWork = steps.reduce(
    (sum, s) =>
      sum +
      (s.status === "completed"
        ? s.total || 1
        : s.status === "skipped"
          ? s.total || 1
          : s.completed),
    0
  )
  const pct = totalWork > 0 ? Math.round((completedWork / totalWork) * 100) : 0

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 z-50 w-80 overflow-hidden rounded-lg border shadow-lg",
        isDone && "border-green-500/30 bg-green-50 dark:bg-green-950/20",
        isFailed && "border-destructive/30 bg-red-50 dark:bg-red-950/20",
        isActive && "bg-background"
      )}
    >
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
        onClick={() => setExpanded(!expanded)}
      >
        {isActive && <Loader2 className="size-4 animate-spin" />}
        {isDone && <Check className="size-4 text-green-500" />}
        {isFailed && <X className="text-destructive size-4" />}

        <span className="flex-1 text-sm font-medium">
          {isActive && "Importing memory..."}
          {isDone && "Import complete"}
          {isFailed && "Import failed"}
        </span>

        {isActive && (
          <span className="text-muted-foreground text-xs">{pct}%</span>
        )}

        {expanded ? (
          <ChevronDown className="text-muted-foreground size-3.5" />
        ) : (
          <ChevronUp className="text-muted-foreground size-3.5" />
        )}

        {!isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              dismiss()
            }}
            className="text-muted-foreground hover:text-foreground ml-1"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {isActive && (
        <div className="bg-muted mx-3 mb-2 h-1 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Expanded steps */}
      {expanded && steps.length > 0 && (
        <ul className="border-t px-3 py-2 text-xs">
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-2 py-1">
              {step.status === "completed" && (
                <Check className="size-3 text-green-500" />
              )}
              {step.status === "running" && (
                <Loader2 className="size-3 animate-spin" />
              )}
              {step.status === "pending" && (
                <div className="bg-muted size-3 rounded-full" />
              )}
              {step.status === "skipped" && (
                <div className="text-muted-foreground text-[10px]">—</div>
              )}

              <span
                className={cn(
                  "flex-1",
                  step.status === "pending" && "text-muted-foreground",
                  step.status === "skipped" &&
                    "text-muted-foreground line-through"
                )}
              >
                {step.label}
              </span>

              {step.status === "running" && step.total > 0 && (
                <span className="text-muted-foreground">
                  {step.completed}/{step.total}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
