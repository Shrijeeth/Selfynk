"use client"

import { useState, useEffect } from "react"
import { Loader2, PenLine, Sparkles } from "lucide-react"
import api from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { MemoryImport } from "@/components/onboarding/MemoryImport"
import { useImportJobStore } from "@/store/import-job"

const QUESTIONS = [
  "When your professional circle thinks of you in 10 years, what 3 words do you want them to use?",
  "What problem in the world do you most want to be known for caring about?",
  "What kind of work makes you lose track of time?",
  "Who has been most impacted by your work or presence, and how?",
  'What do you want to be the "go-to" person for?',
  "What do you believe about your field that most people don't yet?",
  "What values would you never compromise on, even if it cost you opportunities?",
  "What does a great professional legacy look like to you in one sentence?",
  "What are the 2-3 biggest things holding you back from that legacy right now?",
  "If you took one bold action this quarter toward that vision, what would it be?",
]

interface GeneratedStatement {
  legacy_words: string[]
  desired_description: string
  reverse_engineered_actions: string[]
}

interface LegacyExerciseProps {
  onComplete: () => void
}

export function LegacyExercise({ onComplete }: LegacyExerciseProps) {
  const importJob = useImportJobStore()

  // Resume from import job state on mount
  const initialStep = importJob.jobId
    ? importJob.status === "pending" || importJob.status === "running"
      ? -2 // show import UI with background banner
      : -1
    : -1

  // step: -1 = entry chooser, -2 = import UI, 0-9 = questions, 10 = generating
  const [step, setStep] = useState(initialStep)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [confidence, setConfidence] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [statement, setStatement] = useState<GeneratedStatement | null>(null)
  const [editedDescription, setEditedDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-apply completed import results on mount or when job finishes
  useEffect(() => {
    if (importJob.status === "completed" && importJob.result && step <= 0) {
      const filled = Object.values(importJob.result.answers).filter(
        (v) => v.trim().length > 0
      ).length
      if (filled > 0) {
        setAnswers(importJob.result.answers)
        setConfidence(importJob.result.confidence)
        setError(
          filled < QUESTIONS.length
            ? `Pre-filled ${filled} of ${QUESTIONS.length} answers. Please complete the rest.`
            : null
        )
        setStep(0)
        importJob.reset()
      }
    }
  }, [importJob.status, importJob.result]) // eslint-disable-line react-hooks/exhaustive-deps

  const isChooser = step === -1
  const isImport = step === -2
  const isQuestionPhase = step >= 0 && step < QUESTIONS.length
  const isGenerating = step === QUESTIONS.length && !statement
  const isReview = !!statement

  const currentAnswer = step >= 0 ? answers[`q${step + 1}`] || "" : ""
  const progress = isReview
    ? 100
    : step < 0
      ? 0
      : Math.round(
          ((step + (isGenerating ? 1 : 0)) / (QUESTIONS.length + 1)) * 100
        )

  function handleImport(
    imported: Record<string, string>,
    conf: Record<string, string>
  ) {
    setAnswers(imported)
    setConfidence(conf)
    const filled = Object.values(imported).filter(
      (v) => v.trim().length > 0
    ).length
    setError(
      filled < QUESTIONS.length
        ? `Pre-filled ${filled} of ${QUESTIONS.length} answers. Please complete the rest.`
        : null
    )
    setStep(0)
  }

  async function handleNext() {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      setStep(QUESTIONS.length)
      setGenerating(true)
      setError(null)
      try {
        const res = await api.post<GeneratedStatement>(
          "/api/v1/onboarding/legacy-exercise",
          { answers }
        )
        setStatement(res.data)
        setEditedDescription(res.data.desired_description)
      } catch {
        setError("Failed to generate your brand statement. Please try again.")
        setStep(QUESTIONS.length - 1)
      } finally {
        setGenerating(false)
      }
    }
  }

  async function handleConfirm() {
    if (!statement) return
    setSaving(true)
    if (editedDescription !== statement.desired_description) {
      try {
        await api.post("/api/v1/onboarding/legacy-exercise", {
          answers,
        })
      } catch {
        // Best effort
      }
    }
    setSaving(false)
    onComplete()
  }

  const lowConfidence = step >= 0 && confidence[`q${step + 1}`] === "low"

  return (
    <div className="mx-auto w-full max-w-xl space-y-8">
      {/* Entry Chooser */}
      {isChooser && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight">
              Legacy Design Exercise
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              How do you want to define your professional vision?
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="bg-card hover:border-primary/50 flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-colors"
            >
              <PenLine className="text-primary size-6" />
              <div>
                <p className="font-semibold">Answer 10 questions</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  ~8 minutes. Reflective exercise.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStep(-2)}
              className="bg-card hover:border-primary/50 flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-colors"
            >
              <Sparkles className="text-primary size-6" />
              <div>
                <p className="font-semibold">Import from AI conversations</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Use your ChatGPT or Claude history to pre-fill.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Memory Import */}
      {isImport && (
        <MemoryImport onImport={handleImport} onCancel={() => setStep(-1)} />
      )}

      {/* Progress (only during questions/review) */}
      {step >= 0 && (
        <Progress value={progress}>
          <ProgressLabel>
            {isReview
              ? "Review your statement"
              : `Question ${Math.min(step + 1, QUESTIONS.length)} of ${QUESTIONS.length}`}
          </ProgressLabel>
          <ProgressValue />
        </Progress>
      )}

      {/* Question Phase */}
      {isQuestionPhase && (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">
                Q{step + 1}. {QUESTIONS[step]}
              </Label>
              {lowConfidence && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    "bg-amber-100 text-amber-700",
                    "dark:bg-amber-900 dark:text-amber-300"
                  )}
                >
                  needs review
                </span>
              )}
            </div>
            <Textarea
              rows={4}
              placeholder="Your answer..."
              value={currentAnswer}
              onChange={(e) =>
                setAnswers({
                  ...answers,
                  [`q${step + 1}`]: e.target.value,
                })
              }
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button
            onClick={handleNext}
            disabled={!currentAnswer.trim()}
            className="w-full"
          >
            {step === QUESTIONS.length - 1 ? "Generate Statement" : "Next"}
          </Button>
        </div>
      )}

      {/* Generating Phase */}
      {isGenerating && generating && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="text-primary size-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Synthesizing your brand vision...
          </p>
        </div>
      )}

      {/* Review Phase */}
      {isReview && statement && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Your Legacy Words</h3>
            <div className="flex gap-2">
              {statement.legacy_words.map((word) => (
                <span
                  key={word}
                  className="bg-primary/10 text-primary rounded-full px-3 py-1.5 text-sm font-medium"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">
              Your Desired Brand Statement
            </Label>
            <Textarea
              rows={5}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Feel free to edit this to better match your voice.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Quarterly Actions</h3>
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

          <Button onClick={handleConfirm} disabled={saving} className="w-full">
            {saving && <Loader2 className="animate-spin" />}
            {saving ? "Saving..." : "Confirm & Continue"}
          </Button>
        </div>
      )}
    </div>
  )
}
