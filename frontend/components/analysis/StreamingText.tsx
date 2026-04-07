"use client"

import { useEffect, useRef } from "react"
import { useSSEStream } from "@/lib/sse"
import { cn } from "@/lib/utils"

interface StreamingTextProps {
  url: string | null
  className?: string
  onDone?: (text: string) => void
  onError?: (error: string) => void
}

export function StreamingText({
  url,
  className,
  onDone,
  onError,
}: StreamingTextProps) {
  const { text, isDone, error } = useSSEStream(url)
  const doneRef = useRef(false)

  useEffect(() => {
    if (isDone && !doneRef.current && text) {
      doneRef.current = true
      onDone?.(text)
    }
  }, [isDone, text, onDone])

  useEffect(() => {
    if (error) {
      onError?.(error)
    }
  }, [error, onError])

  useEffect(() => {
    doneRef.current = false
  }, [url])

  if (error) {
    return (
      <p className={cn("text-destructive text-sm", className)}>
        Error: {error}
      </p>
    )
  }

  if (!url) return null

  return (
    <p className={cn("text-sm leading-relaxed whitespace-pre-wrap", className)}>
      {text}
      {!isDone && (
        <span className="bg-foreground ml-0.5 inline-block h-4 w-[2px] animate-pulse align-middle" />
      )}
    </p>
  )
}
