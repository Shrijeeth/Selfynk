import { create } from "zustand"

interface ProgressStep {
  label: string
  total: number
  completed: number
  status: string
}

interface ImportJobState {
  jobId: string | null
  status: string | null // pending | running | completed | failed
  steps: ProgressStep[]
  currentStep: number
  result: {
    answers: Record<string, string>
    confidence: Record<string, string>
  } | null
  error: string | null
  dismissed: boolean

  startJob: (jobId: string) => void
  updateFromPoll: (data: {
    status: string
    steps: ProgressStep[]
    current_step: number
    result: {
      answers: Record<string, string>
      confidence: Record<string, string>
    } | null
    error: string | null
  }) => void
  dismiss: () => void
  reset: () => void
}

export const useImportJobStore = create<ImportJobState>()((set) => ({
  jobId: null,
  status: null,
  steps: [],
  currentStep: 0,
  result: null,
  error: null,
  dismissed: false,

  startJob: (jobId) =>
    set({
      jobId,
      status: "pending",
      steps: [],
      currentStep: 0,
      result: null,
      error: null,
      dismissed: false,
    }),

  updateFromPoll: (data) =>
    set({
      status: data.status,
      steps: data.steps,
      currentStep: data.current_step,
      result: data.result,
      error: data.error,
    }),

  dismiss: () => set({ dismissed: true }),

  reset: () =>
    set({
      jobId: null,
      status: null,
      steps: [],
      currentStep: 0,
      result: null,
      error: null,
      dismissed: false,
    }),
}))
