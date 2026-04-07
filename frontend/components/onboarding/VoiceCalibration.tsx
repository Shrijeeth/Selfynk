"use client"

import { useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const SOURCE_TYPES = [
  { value: "linkedin_post", label: "LinkedIn Post" },
  { value: "email", label: "Email" },
  { value: "bio", label: "Bio" },
  { value: "other", label: "Other" },
]

interface Sample {
  content: string
  source_type: string
}

const EMPTY_SAMPLE: Sample = { content: "", source_type: "" }

interface VoiceCalibrationProps {
  onComplete: () => void
}

export function VoiceCalibration({ onComplete }: VoiceCalibrationProps) {
  const [samples, setSamples] = useState<Sample[]>([])
  const [saving, setSaving] = useState(false)

  function addSample() {
    if (samples.length < 3) {
      setSamples([...samples, { ...EMPTY_SAMPLE }])
    }
  }

  function removeSample(index: number) {
    setSamples(samples.filter((_, i) => i !== index))
  }

  function updateSample(index: number, field: keyof Sample, value: string) {
    setSamples(
      samples.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    )
  }

  const canSubmit =
    samples.length > 0 &&
    samples.every((s) => s.content.trim() && s.source_type)

  async function handleSubmit() {
    setSaving(true)
    try {
      await api.post("/api/v1/onboarding/voice-samples", { samples })
      onComplete()
    } catch {
      toast.error("Failed to save voice samples. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Voice Calibration</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Paste 2–3 writing samples so we can learn your voice. This will
          improve the quality of generated content.
        </p>
      </div>

      {/* Samples */}
      {samples.map((sample, index) => (
        <div key={index} className="bg-card space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Sample {index + 1}</Label>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeSample(index)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          <Select
            value={sample.source_type}
            onValueChange={(val) =>
              updateSample(index, "source_type", val ?? "")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Source type" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            rows={4}
            placeholder="Paste your writing sample here..."
            value={sample.content}
            onChange={(e) => updateSample(index, "content", e.target.value)}
          />
        </div>
      ))}

      {/* Add sample button */}
      {samples.length < 3 && (
        <Button variant="outline" onClick={addSample} className="w-full">
          <Plus className="size-4" />
          Add sample
          {samples.length === 0 && (
            <span className="text-muted-foreground ml-1 font-normal">
              (up to 3)
            </span>
          )}
        </Button>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onComplete} className="flex-1">
          Skip for now
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="flex-1"
        >
          {saving && <Loader2 className="animate-spin" />}
          {saving ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  )
}
