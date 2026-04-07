"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import api from "@/lib/api"
import { InputMode, Emotion, type InputEntry } from "@/types"
import { useInputEntries, useCreateEntry } from "@/lib/hooks/use-input-entries"
import { useAnalysis, useInvalidateAnalysis } from "@/lib/hooks/use-analysis"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel"
import { ModeSelector } from "@/components/capture/ModeSelector"
import { JournalEditor } from "@/components/capture/JournalEditor"
import {
  DailyPulse,
  type DailyPulseData,
} from "@/components/capture/DailyPulse"
import {
  SituationDebrief,
  type SituationDebriefData,
} from "@/components/capture/SituationDebrief"
import {
  NetworkLogForm,
  type NetworkLogFormData,
} from "@/components/capture/NetworkLogForm"
import {
  WeeklyReview,
  type WeeklyReviewData,
} from "@/components/capture/WeeklyReview"

const CONTEXT_TAGS = [
  "meeting",
  "interview",
  "presentation",
  "1:1",
  "learning",
  "content-creation",
  "networking",
] as const

const MODE_DEFAULT_TAGS: Partial<Record<InputMode, string[]>> = {
  debrief: ["meeting"],
}

const EMOTIONS: { value: Emotion; label: string }[] = [
  { value: "energized", label: "Energized" },
  { value: "neutral", label: "Neutral" },
  { value: "drained", label: "Drained" },
]

const INITIAL_PULSE: DailyPulseData = {
  value_shown: "",
  interaction_note: "",
  alignment_score: 5,
}

const INITIAL_DEBRIEF: SituationDebriefData = {
  situation_type: "",
  how_i_showed_up: "",
  value_demonstrated: "",
  what_id_do_differently: "",
}

const INITIAL_NETWORK: NetworkLogFormData = {
  person_name: "",
  contact_type: "",
  notes: "",
}

const INITIAL_REVIEW: WeeklyReviewData = {
  wins: "",
  challenges: "",
  brand_alignment: "",
  next_week_focus: "",
}

const MODE_LABELS: Record<InputMode, string> = {
  journal: "Journal",
  pulse: "Pulse",
  debrief: "Debrief",
  network: "Network",
  review: "Review",
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function getPreview(entry: InputEntry): string {
  if (entry.mode === "journal") {
    return entry.content.replace(/<[^>]*>/g, "").slice(0, 120)
  }
  try {
    const parsed = JSON.parse(entry.content)
    const firstValue = Object.values(parsed).find(
      (v) => typeof v === "string" && v.length > 0
    )
    return typeof firstValue === "string" ? firstValue.slice(0, 120) : ""
  } catch {
    return entry.content.slice(0, 120)
  }
}

export default function CapturePage() {
  const [mode, setMode] = useState<InputMode>("journal")
  const [contextTags, setContextTags] = useState<string[]>([])
  const [emotion, setEmotion] = useState<Emotion | null>(null)

  const { data: entries = [], isLoading: entriesLoading } = useInputEntries()
  const createEntry = useCreateEntry()

  // Analysis panel state
  const [panelOpen, setPanelOpen] = useState(false)
  const [streamEntryId, setStreamEntryId] = useState<number | null>(null)
  const [analysisEntryId, setAnalysisEntryId] = useState<number | null>(null)
  const { data: analysis } = useAnalysis(analysisEntryId)
  const invalidateAnalysis = useInvalidateAnalysis()

  const streamUrl = streamEntryId
    ? `${api.defaults.baseURL}/api/v1/analysis/stream/${streamEntryId}`
    : null

  const handleStreamDone = useCallback(() => {
    if (streamEntryId) {
      setAnalysisEntryId(streamEntryId)
      invalidateAnalysis(streamEntryId)
      setStreamEntryId(null)
    }
  }, [streamEntryId, invalidateAnalysis])

  // Form state per mode
  const [journalContent, setJournalContent] = useState("")
  const [pulseData, setPulseData] = useState<DailyPulseData>(INITIAL_PULSE)
  const [debriefData, setDebriefData] =
    useState<SituationDebriefData>(INITIAL_DEBRIEF)
  const [networkData, setNetworkData] =
    useState<NetworkLogFormData>(INITIAL_NETWORK)
  const [reviewData, setReviewData] = useState<WeeklyReviewData>(INITIAL_REVIEW)

  function handleModeChange(newMode: InputMode) {
    setMode(newMode)
    setContextTags(MODE_DEFAULT_TAGS[newMode] ?? [])
    setEmotion(null)
  }

  function toggleTag(tag: string) {
    setContextTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function getContent(): string {
    switch (mode) {
      case "journal":
        return journalContent
      case "pulse":
        return JSON.stringify(pulseData)
      case "debrief":
        return JSON.stringify(debriefData)
      case "network":
        return JSON.stringify(networkData)
      case "review":
        return JSON.stringify(reviewData)
    }
  }

  function getAlignmentScore(): number | null {
    return mode === "pulse" ? pulseData.alignment_score : null
  }

  function resetForm() {
    setJournalContent("")
    setPulseData(INITIAL_PULSE)
    setDebriefData(INITIAL_DEBRIEF)
    setNetworkData(INITIAL_NETWORK)
    setReviewData(INITIAL_REVIEW)
    setContextTags(MODE_DEFAULT_TAGS[mode] ?? [])
    setEmotion(null)
  }

  async function handleSave() {
    const content = getContent()
    if (!content || content === "{}" || content === '""') {
      toast.error("Please fill in some content before saving.")
      return
    }

    createEntry.mutate(
      {
        mode,
        content,
        context_tags: contextTags,
        emotion: emotion ?? undefined,
        alignment_score: getAlignmentScore(),
      },
      {
        onSuccess: (data) => {
          toast.success("Entry saved successfully!")
          resetForm()
          if (data.id) {
            setAnalysisEntryId(null)
            setStreamEntryId(data.id)
            setPanelOpen(true)
          }
        },
        onError: () => {
          toast.error("Failed to save entry. Please try again.")
        },
      }
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Capture</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Record your thoughts, interactions, and reflections.
        </p>
      </div>

      {/* Mode Selector */}
      <ModeSelector selectedMode={mode} onSelect={handleModeChange} />

      {/* Context Tags */}
      <div className="space-y-3">
        <Label>Context tags</Label>
        <div className="flex flex-wrap gap-2">
          {CONTEXT_TAGS.map((tag) => {
            const selected = contextTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* Emotion Selector */}
      <div className="space-y-3">
        <Label>
          How are you feeling?
          {mode === "pulse" && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="flex gap-2">
          {EMOTIONS.map((e) => {
            const selected = emotion === e.value
            return (
              <button
                key={e.value}
                type="button"
                onClick={() => setEmotion(selected ? null : e.value)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {e.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mode-specific Form */}
      <div>
        {mode === "journal" && (
          <JournalEditor
            content={journalContent}
            onChange={setJournalContent}
          />
        )}
        {mode === "pulse" && (
          <DailyPulse data={pulseData} onChange={setPulseData} />
        )}
        {mode === "debrief" && (
          <SituationDebrief data={debriefData} onChange={setDebriefData} />
        )}
        {mode === "network" && (
          <NetworkLogForm data={networkData} onChange={setNetworkData} />
        )}
        {mode === "review" && (
          <WeeklyReview data={reviewData} onChange={setReviewData} />
        )}
      </div>

      {/* Save Button */}
      <Button
        size="lg"
        onClick={handleSave}
        disabled={createEntry.isPending}
        className="w-full"
      >
        {createEntry.isPending && <Loader2 className="animate-spin" />}
        {createEntry.isPending ? "Saving..." : "Save Entry"}
      </Button>

      {/* Past Entries */}
      <Separator />
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Past Entries</h2>

        {entriesLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        )}

        {!entriesLoading && entries.length === 0 && (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No entries yet. Start capturing above!
            </p>
          </div>
        )}

        {!entriesLoading && entries.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {entries.map((entry) => {
              const preview = getPreview(entry)
              return (
                <div
                  key={entry.id}
                  className="bg-card space-y-2 rounded-xl border p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{MODE_LABELS[entry.mode]}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  {preview && (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {preview}
                    </p>
                  )}
                  {entry.context_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.context_tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Analysis Panel */}
      <AnalysisPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        analysis={analysis ?? null}
        streamUrl={streamUrl}
        onStreamDone={handleStreamDone}
      />
    </div>
  )
}
