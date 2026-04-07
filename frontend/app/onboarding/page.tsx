"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import api from "@/lib/api"
import { cn } from "@/lib/utils"
import { LegacyExercise } from "@/components/onboarding/LegacyExercise"
import { ValuesDeclaration } from "@/components/onboarding/ValuesDeclaration"
import { VoiceCalibration } from "@/components/onboarding/VoiceCalibration"

interface OnboardingStatus {
  legacy_done: boolean
  values_done: boolean
  voice_done: boolean
}

const STAGES = [
  { key: "legacy_done" as const, label: "Legacy Vision" },
  { key: "values_done" as const, label: "Values" },
  { key: "voice_done" as const, label: "Voice" },
]

function getFirstIncompleteStage(status: OnboardingStatus): number {
  if (!status.legacy_done) return 0
  if (!status.values_done) return 1
  if (!status.voice_done) return 2
  return 3
}

export default function OnboardingPage() {
  const router = useRouter()
  const [stage, setStage] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await api.get<OnboardingStatus>("/api/v1/onboarding/status")
        const first = getFirstIncompleteStage(res.data)
        if (first >= 3) {
          router.replace("/")
          return
        }
        setStage(first)
      } catch {
        setStage(0)
      } finally {
        setLoading(false)
      }
    }
    checkStatus()
  }, [router])

  function handleStageComplete() {
    const next = (stage ?? 0) + 1
    if (next >= 3) {
      router.replace("/")
    } else {
      setStage(next)
    }
  }

  if (loading || stage === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 p-6 md:p-10">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                i < stage
                  ? "border-primary bg-primary text-primary-foreground"
                  : i === stage
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                i === stage ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
            {i < STAGES.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-px w-8",
                  i < stage ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Stage content */}
      {stage === 0 && <LegacyExercise onComplete={handleStageComplete} />}
      {stage === 1 && <ValuesDeclaration onComplete={handleStageComplete} />}
      {stage === 2 && <VoiceCalibration onComplete={handleStageComplete} />}
    </div>
  )
}
