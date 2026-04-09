"use client"

import { useState, useRef, useEffect } from "react"
import { Loader2, Upload, FileText, ChevronDown } from "lucide-react"
import api from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useImportJobStore } from "@/store/import-job"

interface MemoryImportProps {
  onImport: (
    answers: Record<string, string>,
    confidence: Record<string, string>
  ) => void
  onCancel: () => void
}

export function MemoryImport({ onImport, onCancel }: MemoryImportProps) {
  const [tab, setTab] = useState<"upload" | "paste">("upload")
  const [files, setFiles] = useState<File[]>([])
  const [pastedText, setPastedText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    jobId,
    status,
    result,
    error: jobError,
    startJob,
  } = useImportJobStore()
  const loading = !!jobId && (status === "pending" || status === "running")

  // Derive error from job state (no setState in effect)
  const jobDerivedError =
    status === "failed"
      ? (jobError ??
        "Failed to analyze the data. Please try again or answer manually.")
      : status === "completed" &&
          result &&
          Object.values(result.answers).filter((v) => v.trim().length > 0)
            .length === 0
        ? "Could not extract any answers from this data. Try a different export or answer manually."
        : null

  // Only call onImport callback when job completes with results
  useEffect(() => {
    if (status !== "completed" || !result) return
    const filled = Object.values(result.answers).filter(
      (v) => v.trim().length > 0
    ).length
    if (filled > 0) {
      onImport(result.answers, result.confidence)
    }
  }, [status, result, onImport])

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    setError(null)

    try {
      const formData = new FormData()
      if (tab === "upload") {
        for (const f of files) {
          formData.append("files", f)
        }
      } else if (tab === "paste" && pastedText.trim()) {
        formData.append("raw_text", pastedText)
      }

      const res = await api.post<{ job_id: string; status: string }>(
        "/api/v1/onboarding/import-memory",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )

      startJob(res.data.job_id)
    } catch {
      setError(
        "Failed to start the import. Please try again or answer manually."
      )
    }
  }

  const canSubmit =
    (tab === "upload" && files.length > 0) ||
    (tab === "paste" && pastedText.trim().length > 0)

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border p-1">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            tab === "upload"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Upload className="mr-1.5 inline size-3.5" />
          Upload file
        </button>
        <button
          type="button"
          onClick={() => setTab("paste")}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            tab === "paste"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="mr-1.5 inline size-3.5" />
          Paste text
        </button>
      </div>

      {/* Loading banner */}
      {loading && (
        <div className="flex items-center gap-2 rounded-lg border p-3 text-sm">
          <Loader2 className="size-4 animate-spin" />
          <span>Import running in the background. You can navigate away.</span>
        </div>
      )}

      {/* Upload tab */}
      {tab === "upload" && (
        <div className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileRef.current?.click()
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
              files.length > 0
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <Upload className="text-muted-foreground size-6" />
            <p className="text-sm font-medium">
              Drop your export files here or click to browse
            </p>
            <p className="text-muted-foreground text-xs">
              Accepts .json or .jsonl files (max 50MB each) &mdash; upload
              multiple sources at once
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.jsonl"
              multiple
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files ?? [])
                const tooBig = selected.find((f) => f.size > 50 * 1024 * 1024)
                if (tooBig) {
                  setError(
                    `File "${tooBig.name}" is too large. Maximum size is 50MB.`
                  )
                  return
                }
                setFiles((prev) => [...prev, ...selected])
                setError(null)
                e.target.value = ""
              }}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <ul className="space-y-1">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="bg-muted/50 flex items-center justify-between rounded-md px-3 py-1.5 text-sm"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <FileText className="text-muted-foreground size-3.5 shrink-0" />
                    {f.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-muted-foreground hover:text-destructive ml-2 text-xs"
                    aria-label={`Remove ${f.name}`}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Export instructions */}
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1 text-xs"
          >
            <ChevronDown
              className={cn(
                "size-3 transition-transform",
                showInstructions && "rotate-180"
              )}
            />
            How to export your data
          </button>

          {showInstructions && (
            <div className="bg-muted/50 space-y-4 rounded-lg p-4 text-xs">
              <div>
                <p className="mb-1 font-semibold">ChatGPT</p>
                <ol className="text-muted-foreground list-inside list-decimal space-y-0.5">
                  <li>
                    Click your profile icon &rarr; Settings &rarr; Data Controls
                  </li>
                  <li>Click &ldquo;Export&rdquo; &rarr; Confirm</li>
                  <li>
                    Check your email for a download link (can take up to a day)
                  </li>
                  <li>
                    Download the ZIP, extract it, and upload{" "}
                    <code className="bg-muted rounded px-1">
                      conversations.json
                    </code>
                  </li>
                </ol>
              </div>
              <div>
                <p className="mb-1 font-semibold">Claude</p>
                <ol className="text-muted-foreground list-inside list-decimal space-y-0.5">
                  <li>Click your initials &rarr; Settings &rarr; Privacy</li>
                  <li>Click &ldquo;Export data&rdquo;</li>
                  <li>Check your email for the download link</li>
                  <li>
                    Download the ZIP and upload the{" "}
                    <code className="bg-muted rounded px-1">
                      conversations.jsonl
                    </code>{" "}
                    file
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paste tab */}
      {tab === "paste" && (
        <div className="space-y-3">
          <Textarea
            rows={8}
            placeholder="Paste your AI conversation history or memory export here..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <div className="bg-muted/50 rounded-lg p-3 text-xs">
            <p className="text-muted-foreground mb-2">
              Try asking your AI assistant:
            </p>
            <p className="text-foreground italic">
              &ldquo;Write out everything you know about me &mdash; my values,
              goals, how I want to be perceived, and what I care about
              professionally.&rdquo;
            </p>
            <p className="text-muted-foreground mt-3">
              Or paste a memory export:
            </p>
            <ul className="text-muted-foreground mt-1 list-inside list-disc space-y-0.5">
              <li>
                <strong>ChatGPT:</strong> Ask &ldquo;Write out my memories
                verbatim&rdquo;
              </li>
              <li>
                <strong>Claude:</strong> Settings &rarr; Capabilities &rarr;
                View and edit your memory &rarr; Copy all
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Error */}
      {(error || jobDerivedError) && (
        <p className="text-destructive text-sm">{error || jobDerivedError}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="flex-1"
        >
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Analyzing..." : "Extract answers"}
        </Button>
      </div>
    </div>
  )
}
