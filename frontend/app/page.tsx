"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { BookOpen, Zap, TrendingUp, ArrowRight } from "lucide-react"
import api from "@/lib/api"
import type { BrandDNA, DesiredBrandStatement } from "@/types"
import { Button } from "@/components/ui/button"
import { BrandGapCard } from "@/components/brand/BrandGapCard"

interface InsightsSummary {
  total_entries: number
  streak: number
  top_themes: string[]
}

export default function DashboardPage() {
  const { data: summary } = useQuery<InsightsSummary>({
    queryKey: ["insights-summary"],
    queryFn: async () => {
      const res = await api.get<InsightsSummary>("/api/v1/insights/summary")
      return res.data
    },
    retry: false,
  })

  const { data: brandDna } = useQuery<BrandDNA>({
    queryKey: ["brand-dna"],
    queryFn: async () => {
      const res = await api.get<BrandDNA>("/api/v1/brand-dna")
      return res.data
    },
    retry: false,
  })

  const { data: desiredBrand } = useQuery<DesiredBrandStatement>({
    queryKey: ["desired-brand"],
    queryFn: async () => {
      const res = await api.get<DesiredBrandStatement>(
        "/api/v1/onboarding/legacy-exercise"
      )
      return res.data
    },
    retry: false,
  })

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your personal brand at a glance.
        </p>
      </div>

      {/* Brand Gap Card — Hero */}
      <BrandGapCard
        currentBrand={brandDna ?? null}
        desiredBrand={desiredBrand ?? null}
        onRecompute={() => {}}
      />

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-card flex items-center gap-4 rounded-xl border p-4">
          <div className="bg-primary/10 rounded-lg p-2.5">
            <BookOpen className="text-primary size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{summary?.total_entries ?? 0}</p>
            <p className="text-muted-foreground text-xs">Total entries</p>
          </div>
        </div>
        <div className="bg-card flex items-center gap-4 rounded-xl border p-4">
          <div className="bg-primary/10 rounded-lg p-2.5">
            <Zap className="text-primary size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{summary?.streak ?? 0}</p>
            <p className="text-muted-foreground text-xs">Day streak</p>
          </div>
        </div>
        <div className="bg-card flex items-center gap-4 rounded-xl border p-4">
          <div className="bg-primary/10 rounded-lg p-2.5">
            <TrendingUp className="text-primary size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {summary?.top_themes?.length ?? 0}
            </p>
            <p className="text-muted-foreground text-xs">Themes tracked</p>
          </div>
        </div>
      </div>

      {/* Top Themes */}
      {summary?.top_themes && summary.top_themes.length > 0 && (
        <div className="bg-card rounded-xl border p-5">
          <h3 className="mb-3 text-sm font-semibold">Top Themes</h3>
          <div className="flex flex-wrap gap-2">
            {summary.top_themes.map((theme) => (
              <span
                key={theme}
                className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Daily Pulse Prompt */}
      <div className="bg-card flex items-center justify-between rounded-xl border p-5">
        <div>
          <h3 className="text-sm font-semibold">Daily Pulse Check-in</h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            2-minute reflection on your brand alignment today.
          </p>
        </div>
        <Link href="/capture">
          <Button size="sm">
            Capture now
            <ArrowRight className="size-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
