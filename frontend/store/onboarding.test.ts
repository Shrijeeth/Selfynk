import { describe, it, expect, beforeEach } from "vitest"
import { useOnboardingStore } from "./onboarding"

beforeEach(() => {
  useOnboardingStore.getState().reset()
})

describe("onboarding store", () => {
  it("has correct initial state", () => {
    const state = useOnboardingStore.getState()
    expect(state.stage).toBe(0)
    expect(state.legacyAnswers).toEqual({})
    expect(state.selectedValues).toEqual([])
    expect(state.voiceSamples).toEqual([])
  })

  it("sets stage", () => {
    useOnboardingStore.getState().setStage(2)
    expect(useOnboardingStore.getState().stage).toBe(2)
  })

  it("sets a single legacy answer", () => {
    useOnboardingStore.getState().setLegacyAnswer("q1", "bold")
    expect(useOnboardingStore.getState().legacyAnswers).toEqual({
      q1: "bold",
    })
  })

  it("accumulates legacy answers", () => {
    const { setLegacyAnswer } = useOnboardingStore.getState()
    setLegacyAnswer("q1", "bold")
    setLegacyAnswer("q2", "education")

    expect(useOnboardingStore.getState().legacyAnswers).toEqual({
      q1: "bold",
      q2: "education",
    })
  })

  it("sets all legacy answers at once", () => {
    const answers = { q1: "a", q2: "b", q3: "c" }
    useOnboardingStore.getState().setLegacyAnswers(answers)
    expect(useOnboardingStore.getState().legacyAnswers).toEqual(answers)
  })

  it("overwrites legacy answers with setLegacyAnswers", () => {
    useOnboardingStore.getState().setLegacyAnswer("q1", "old")
    useOnboardingStore.getState().setLegacyAnswers({ q1: "new" })
    expect(useOnboardingStore.getState().legacyAnswers).toEqual({
      q1: "new",
    })
  })

  it("sets selected values", () => {
    const values = [
      { value_name: "honesty", personal_context: "Always truthful" },
      { value_name: "growth", personal_context: "Keep learning" },
    ]
    useOnboardingStore.getState().setSelectedValues(values)
    expect(useOnboardingStore.getState().selectedValues).toEqual(values)
  })

  it("sets voice samples", () => {
    const samples = [{ content: "My post", source_type: "linkedin_post" }]
    useOnboardingStore.getState().setVoiceSamples(samples)
    expect(useOnboardingStore.getState().voiceSamples).toEqual(samples)
  })

  it("resets all state", () => {
    const store = useOnboardingStore.getState()
    store.setStage(2)
    store.setLegacyAnswer("q1", "bold")
    store.setSelectedValues([
      { value_name: "courage", personal_context: "ctx" },
    ])
    store.setVoiceSamples([{ content: "text", source_type: "email" }])

    store.reset()

    const state = useOnboardingStore.getState()
    expect(state.stage).toBe(0)
    expect(state.legacyAnswers).toEqual({})
    expect(state.selectedValues).toEqual([])
    expect(state.voiceSamples).toEqual([])
  })
})
