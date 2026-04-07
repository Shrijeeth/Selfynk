"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import api from "@/lib/api"

interface OnboardingStatus {
  legacy_done: boolean
  values_done: boolean
  voice_done: boolean
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isOnboarding = pathname.startsWith("/onboarding")
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (isOnboarding) return

    let cancelled = false
    async function check() {
      try {
        const res = await api.get<OnboardingStatus>("/api/v1/onboarding/status")
        const { legacy_done, values_done, voice_done } = res.data
        if (!legacy_done || !values_done || !voice_done) {
          if (!cancelled) router.replace("/onboarding")
          return
        }
      } catch {
        // API unreachable — don't block the app
      }
      if (!cancelled) setChecked(true)
    }
    check()

    return () => {
      cancelled = true
    }
  }, [isOnboarding, router])

  if (isOnboarding) return <>{children}</>
  if (!checked) return null

  return <>{children}</>
}
