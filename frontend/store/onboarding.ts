import { create } from "zustand"
import { persist } from "zustand/middleware"

interface OnboardingState {
  stage: number
  legacyAnswers: Record<string, string>
  selectedValues: { value_name: string; personal_context: string }[]
  voiceSamples: { content: string; source_type: string }[]

  setStage: (stage: number) => void
  setLegacyAnswer: (key: string, value: string) => void
  setLegacyAnswers: (answers: Record<string, string>) => void
  setSelectedValues: (
    values: { value_name: string; personal_context: string }[]
  ) => void
  setVoiceSamples: (samples: { content: string; source_type: string }[]) => void
  reset: () => void
}

const INITIAL_STATE = {
  stage: 0,
  legacyAnswers: {} as Record<string, string>,
  selectedValues: [] as { value_name: string; personal_context: string }[],
  voiceSamples: [] as { content: string; source_type: string }[],
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setStage: (stage) => set({ stage }),

      setLegacyAnswer: (key, value) =>
        set((state) => ({
          legacyAnswers: { ...state.legacyAnswers, [key]: value },
        })),

      setLegacyAnswers: (answers) => set({ legacyAnswers: answers }),

      setSelectedValues: (values) => set({ selectedValues: values }),

      setVoiceSamples: (samples) => set({ voiceSamples: samples }),

      reset: () => set(INITIAL_STATE),
    }),
    {
      name: "selfynk-onboarding",
    }
  )
)
