import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createElement } from "react"
import OnboardingPage from "./page"

const mockReplace = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
  },
}))

vi.mock("@/components/onboarding/LegacyExercise", () => ({
  LegacyExercise: ({ onComplete }: { onComplete: () => void }) =>
    createElement(
      "div",
      { "data-testid": "legacy-exercise" },
      createElement(
        "button",
        { key: "btn", onClick: onComplete },
        "Complete Legacy"
      )
    ),
}))

vi.mock("@/components/onboarding/ValuesDeclaration", () => ({
  ValuesDeclaration: ({ onComplete }: { onComplete: () => void }) =>
    createElement(
      "div",
      { "data-testid": "values-declaration" },
      createElement(
        "button",
        { key: "btn", onClick: onComplete },
        "Complete Values"
      )
    ),
}))

vi.mock("@/components/onboarding/VoiceCalibration", () => ({
  VoiceCalibration: ({ onComplete }: { onComplete: () => void }) =>
    createElement(
      "div",
      { "data-testid": "voice-calibration" },
      createElement(
        "button",
        { key: "btn", onClick: onComplete },
        "Complete Voice"
      )
    ),
}))

import api from "@/lib/api"
import userEvent from "@testing-library/user-event"

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("OnboardingPage", () => {
  it("shows loading state initially", () => {
    mockedApi.get.mockReturnValue(new Promise(() => {})) // never resolves
    render(<OnboardingPage />)

    // Should not show any stage yet
    expect(screen.queryByTestId("legacy-exercise")).toBeNull()
    expect(screen.queryByTestId("values-declaration")).toBeNull()
    expect(screen.queryByTestId("voice-calibration")).toBeNull()
  })

  it("starts at stage 1 when nothing is done", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { legacy_done: false, values_done: false, voice_done: false },
    })

    render(<OnboardingPage />)

    expect(await screen.findByTestId("legacy-exercise")).toBeInTheDocument()
  })

  it("resumes at stage 2 when legacy is done", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { legacy_done: true, values_done: false, voice_done: false },
    })

    render(<OnboardingPage />)

    expect(await screen.findByTestId("values-declaration")).toBeInTheDocument()
    expect(screen.queryByTestId("legacy-exercise")).toBeNull()
  })

  it("resumes at stage 3 when legacy and values are done", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { legacy_done: true, values_done: true, voice_done: false },
    })

    render(<OnboardingPage />)

    expect(await screen.findByTestId("voice-calibration")).toBeInTheDocument()
  })

  it("redirects to / when all stages are done", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { legacy_done: true, values_done: true, voice_done: true },
    })

    render(<OnboardingPage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/")
    })
  })

  it("advances from stage 1 to stage 2 on complete", async () => {
    const user = userEvent.setup()
    mockedApi.get.mockResolvedValueOnce({
      data: { legacy_done: false, values_done: false, voice_done: false },
    })

    render(<OnboardingPage />)

    await screen.findByTestId("legacy-exercise")
    await user.click(screen.getByText("Complete Legacy"))

    expect(await screen.findByTestId("values-declaration")).toBeInTheDocument()
  })

  it("advances from stage 2 to stage 3 on complete", async () => {
    const user = userEvent.setup()
    mockedApi.get.mockResolvedValueOnce({
      data: { legacy_done: true, values_done: false, voice_done: false },
    })

    render(<OnboardingPage />)

    await screen.findByTestId("values-declaration")
    await user.click(screen.getByText("Complete Values"))

    expect(await screen.findByTestId("voice-calibration")).toBeInTheDocument()
  })

  it("redirects to / after completing stage 3", async () => {
    const user = userEvent.setup()
    mockedApi.get.mockResolvedValueOnce({
      data: { legacy_done: true, values_done: true, voice_done: false },
    })

    render(<OnboardingPage />)

    await screen.findByTestId("voice-calibration")
    await user.click(screen.getByText("Complete Voice"))

    expect(mockReplace).toHaveBeenCalledWith("/")
  })

  it("renders stepper with 3 steps", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { legacy_done: false, values_done: false, voice_done: false },
    })

    render(<OnboardingPage />)

    await screen.findByTestId("legacy-exercise")

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
  })

  it("falls back to stage 0 on API error", async () => {
    mockedApi.get.mockRejectedValueOnce(new Error("Network error"))

    render(<OnboardingPage />)

    expect(await screen.findByTestId("legacy-exercise")).toBeInTheDocument()
  })
})
