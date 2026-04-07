"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import api from "@/lib/api"
import { InputMode, Emotion } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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

export default function CapturePage() {
  const [mode, setMode] = useState<InputMode>("journal")
  const [contextTags, setContextTags] = useState<string[]>([])
  const [emotion, setEmotion] = useState<Emotion | null>(null)
  const [saving, setSaving] = useState(false)

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

    setSaving(true)
    try {
      await api.post("/api/v1/input", {
        mode,
        content,
        context_tags: contextTags,
        emotion: emotion ?? undefined,
        alignment_score: getAlignmentScore(),
      })
      toast.success("Entry saved successfully!")
      resetForm()
    } catch {
      toast.error("Failed to save entry. Please try again.")
    } finally {
      setSaving(false)
    }
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
        disabled={saving}
        className="w-full"
      >
        {saving && <Loader2 className="animate-spin" />}
        {saving ? "Saving..." : "Save Entry"}
      </Button>
    </div>
  )
}
