"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export interface WeeklyReviewData {
  wins: string
  challenges: string
  brand_alignment: string
  next_week_focus: string
}

interface WeeklyReviewProps {
  data: WeeklyReviewData
  onChange: (data: WeeklyReviewData) => void
}

const FIELDS: {
  key: keyof WeeklyReviewData
  label: string
  placeholder: string
}[] = [
  {
    key: "wins",
    label: "Wins this week",
    placeholder: "What went well this week?",
  },
  {
    key: "challenges",
    label: "Challenges",
    placeholder: "What challenges did you face?",
  },
  {
    key: "brand_alignment",
    label: "Brand alignment",
    placeholder:
      "How well did your actions align with your desired brand this week?",
  },
  {
    key: "next_week_focus",
    label: "Next week focus",
    placeholder: "What will you focus on next week?",
  },
]

export function WeeklyReview({ data, onChange }: WeeklyReviewProps) {
  return (
    <div className="space-y-6">
      {FIELDS.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>{field.label}</Label>
          <Textarea
            id={field.key}
            rows={3}
            placeholder={field.placeholder}
            value={data[field.key]}
            onChange={(e) => onChange({ ...data, [field.key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  )
}
