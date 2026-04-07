"use client"

import { useState } from "react"
import { Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const VALUE_OPTIONS = [
  "Ownership",
  "Transparency",
  "Empathy",
  "Growth",
  "Courage",
  "Integrity",
  "Creativity",
  "Resilience",
  "Excellence",
  "Collaboration",
  "Curiosity",
  "Authenticity",
  "Impact",
  "Accountability",
  "Kindness",
  "Innovation",
  "Fairness",
  "Adaptability",
  "Leadership",
  "Gratitude",
]

interface SelectedValue {
  value_name: string
  personal_context: string
}

interface ValuesDeclarationProps {
  onComplete: () => void
}

export function ValuesDeclaration({ onComplete }: ValuesDeclarationProps) {
  const [selected, setSelected] = useState<SelectedValue[]>([])
  const [saving, setSaving] = useState(false)

  const selectedNames = new Set(selected.map((s) => s.value_name))

  function toggleValue(name: string) {
    if (selectedNames.has(name)) {
      setSelected(selected.filter((s) => s.value_name !== name))
    } else if (selected.length < 5) {
      setSelected([...selected, { value_name: name, personal_context: "" }])
    }
  }

  function updateContext(name: string, context: string) {
    setSelected(
      selected.map((s) =>
        s.value_name === name ? { ...s, personal_context: context } : s
      )
    )
  }

  const canSubmit =
    selected.length >= 3 &&
    selected.length <= 5 &&
    selected.every((s) => s.personal_context.trim().length > 0)

  async function handleSubmit() {
    setSaving(true)
    try {
      await api.post("/api/v1/onboarding/values", {
        values: selected.map((s) => ({
          value_name: s.value_name.toLowerCase(),
          personal_context: s.personal_context,
        })),
      })
      onComplete()
    } catch {
      toast.error("Failed to save values. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Declare Your Values
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Select 3–5 values that define who you are. Then describe what each
          means to you personally.
        </p>
      </div>

      {/* Value Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {VALUE_OPTIONS.map((name) => {
          const isSelected = selectedNames.has(name)
          const isDisabled = !isSelected && selected.length >= 5
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggleValue(name)}
              disabled={isDisabled}
              className={cn(
                "relative rounded-xl border p-3 text-sm font-medium transition-all",
                isSelected
                  ? "border-primary bg-primary/5 text-primary shadow-sm"
                  : "border-border bg-card text-card-foreground hover:bg-accent",
                isDisabled && "cursor-not-allowed opacity-40"
              )}
            >
              {isSelected && (
                <Check className="text-primary absolute top-2 right-2 size-3.5" />
              )}
              {name}
            </button>
          )
        })}
      </div>

      {/* Selected count */}
      <p className="text-muted-foreground text-sm">
        {selected.length} of 3–5 selected
      </p>

      {/* Context cards for selected values */}
      {selected.length > 0 && (
        <div className="space-y-4">
          {selected.map((val) => (
            <div
              key={val.value_name}
              className="bg-card space-y-2 rounded-xl border p-4"
            >
              <p className="text-sm font-semibold">
                What does <span className="text-primary">{val.value_name}</span>{" "}
                mean to you?
              </p>
              <Textarea
                rows={2}
                placeholder={`What does ${val.value_name} mean to you specifically?`}
                value={val.personal_context}
                onChange={(e) => updateContext(val.value_name, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || saving}
        className="w-full"
      >
        {saving && <Loader2 className="animate-spin" />}
        {saving ? "Saving..." : "Continue"}
      </Button>
    </div>
  )
}
