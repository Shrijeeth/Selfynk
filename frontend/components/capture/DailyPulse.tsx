"use client"

import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"

export interface DailyPulseData {
  value_shown: string
  interaction_note: string
  alignment_score: number
}

interface DailyPulseProps {
  data: DailyPulseData
  onChange: (data: DailyPulseData) => void
}

export function DailyPulse({ data, onChange }: DailyPulseProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="value_shown">Value shown today</Label>
        <Textarea
          id="value_shown"
          rows={3}
          placeholder="One thing you did today that showed your value..."
          value={data.value_shown}
          onChange={(e) => onChange({ ...data, value_shown: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="interaction_note">Interaction reflection</Label>
        <Textarea
          id="interaction_note"
          rows={3}
          placeholder="One interaction you're reflecting on..."
          value={data.interaction_note}
          onChange={(e) =>
            onChange({ ...data, interaction_note: e.target.value })
          }
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Alignment score</Label>
          <span className="text-foreground text-sm font-semibold tabular-nums">
            {data.alignment_score}/10
          </span>
        </div>
        <p className="text-muted-foreground text-xs">
          How closely did today match who you want to be?
        </p>
        <Slider
          min={1}
          max={10}
          step={1}
          value={data.alignment_score}
          onValueChange={(val) =>
            onChange({
              ...data,
              alignment_score: typeof val === "number" ? val : val[0],
            })
          }
        />
      </div>
    </div>
  )
}
