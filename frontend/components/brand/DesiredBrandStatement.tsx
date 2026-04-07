"use client"

import Link from "next/link"
import { RefreshCw } from "lucide-react"
import type { DesiredBrandStatement as DesiredBrandStatementType } from "@/types"

interface DesiredBrandStatementProps {
  statement: DesiredBrandStatementType | null
}

export function DesiredBrandStatement({
  statement,
}: DesiredBrandStatementProps) {
  if (!statement) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center">
        <p className="text-muted-foreground text-sm">No brand statement yet.</p>
        <Link
          href="/onboarding"
          className="text-primary mt-2 inline-block text-sm font-medium hover:underline"
        >
          Start the legacy exercise
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border p-6">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-semibold tracking-tight">
            Your Desired Brand
          </h3>
          <Link
            href="/onboarding"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
          >
            <RefreshCw className="size-3" />
            Redo exercise
          </Link>
        </div>

        <p className="text-foreground leading-relaxed">
          {statement.desired_description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {statement.legacy_words.map((word) => (
          <span
            key={word}
            className="bg-primary/10 text-primary rounded-full px-3 py-1.5 text-sm font-medium"
          >
            {word}
          </span>
        ))}
      </div>

      {statement.reverse_engineered_actions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Quarterly Actions
          </h4>
          <ul className="space-y-2">
            {statement.reverse_engineered_actions.map((action) => (
              <li
                key={action}
                className="text-muted-foreground flex gap-2 text-sm"
              >
                <span className="text-primary">&#x2022;</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        Version {statement.version} &middot; Generated{" "}
        {new Date(statement.computed_at).toLocaleDateString()}
      </p>
    </div>
  )
}
