"use client"

import Link from "next/link"
import { RefreshCw } from "lucide-react"
import type { BrandDNA, DesiredBrandStatement } from "@/types"
import { Button } from "@/components/ui/button"

interface BrandGapCardProps {
  currentBrand: BrandDNA | null
  desiredBrand: DesiredBrandStatement | null
  onRecompute: () => void
  isRecomputing?: boolean
}

export function BrandGapCard({
  currentBrand,
  desiredBrand,
  onRecompute,
  isRecomputing,
}: BrandGapCardProps) {
  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Brand Gap</h2>
        {currentBrand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRecompute}
            disabled={isRecomputing}
          >
            <RefreshCw
              className={`size-3.5 ${isRecomputing ? "animate-spin" : ""}`}
            />
            Recompute
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Brand */}
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Current Brand
          </h3>
          {currentBrand ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{currentBrand.positioning}</p>
              <p className="text-muted-foreground text-sm">
                {currentBrand.niche}
              </p>
              <p className="text-muted-foreground text-xs">
                Based on {currentBrand.entries_analyzed} entries
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-muted-foreground text-sm">No brand DNA yet.</p>
              <Link
                href="/capture"
                className="text-primary mt-1 inline-block text-sm font-medium hover:underline"
              >
                Start capturing
              </Link>
            </div>
          )}
        </div>

        {/* Desired Brand */}
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Desired Brand
          </h3>
          {desiredBrand ? (
            <div className="space-y-2">
              <p className="text-sm">{desiredBrand.desired_description}</p>
              <div className="flex flex-wrap gap-1.5">
                {desiredBrand.legacy_words.map((word) => (
                  <span
                    key={word}
                    className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <p className="text-muted-foreground text-sm">
                No desired brand set.
              </p>
              <Link
                href="/onboarding"
                className="text-primary mt-1 inline-block text-sm font-medium hover:underline"
              >
                Complete onboarding
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Gap Summary */}
      {currentBrand?.gap_summary && (
        <div className="mt-5 border-t pt-4">
          <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Gap Analysis
          </h3>
          <p className="text-muted-foreground text-sm">
            {currentBrand.gap_summary}
          </p>
        </div>
      )}
    </div>
  )
}
