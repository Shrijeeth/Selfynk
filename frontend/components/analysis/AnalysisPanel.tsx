"use client"

import { Sparkles } from "lucide-react"
import type { Analysis } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { StreamingText } from "@/components/analysis/StreamingText"

interface AnalysisPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysis?: Analysis | null
  streamUrl?: string | null
  onStreamDone?: (text: string) => void
  onGeneratePost?: () => void
}

const TONE_COLORS: Record<string, string> = {
  expert: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  learner:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  connector:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  builder: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  leader: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  reflector:
    "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
}

function TagSection({
  title,
  tags,
  variant,
}: {
  title: string
  tags: string[]
  variant: "default" | "secondary" | "outline"
}) {
  if (tags.length === 0) return null
  return (
    <div className="space-y-2">
      <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant={variant}>
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export function AnalysisPanel({
  open,
  onOpenChange,
  analysis,
  streamUrl,
  onStreamDone,
  onGeneratePost,
}: AnalysisPanelProps) {
  const isStreaming = !!streamUrl && !analysis

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Analysis</SheetTitle>
          <SheetDescription>
            Identity signals extracted from your entry.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 px-4">
          {isStreaming && (
            <StreamingText
              url={streamUrl}
              onDone={onStreamDone}
              className="text-muted-foreground"
            />
          )}

          {analysis && (
            <>
              <TagSection
                title="Themes"
                tags={analysis.themes}
                variant="default"
              />
              <TagSection
                title="Skills"
                tags={analysis.skills_detected}
                variant="secondary"
              />
              <TagSection
                title="Values"
                tags={analysis.values_detected}
                variant="outline"
              />

              {analysis.tone && (
                <div className="space-y-2">
                  <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Tone
                  </h4>
                  <Badge
                    className={
                      TONE_COLORS[analysis.tone] ?? TONE_COLORS.reflector
                    }
                  >
                    {analysis.tone}
                  </Badge>
                </div>
              )}

              {analysis.perception_signals.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Perception signals
                  </h4>
                  <ul className="text-muted-foreground space-y-1.5 text-sm">
                    {analysis.perception_signals.map((signal) => (
                      <li key={signal} className="flex gap-2">
                        <span className="text-muted-foreground/50">
                          &mdash;
                        </span>
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {!isStreaming && !analysis && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No analysis available yet.
            </p>
          )}
        </div>

        {analysis && onGeneratePost && (
          <>
            <Separator />
            <SheetFooter>
              <Button onClick={onGeneratePost} className="w-full">
                <Sparkles className="size-4" />
                Generate post
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
