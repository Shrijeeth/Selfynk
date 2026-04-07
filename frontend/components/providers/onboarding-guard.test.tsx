import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { OnboardingGuard } from "./onboarding-guard"

const mockReplace = vi.fn()
let mockPathname = "/"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
}))

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
  },
}))

import api from "@/lib/api"

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
  mockPathname = "/"
})

describe("OnboardingGuard", () => {
  it("redirects to /onboarding when all statuses are false", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { legacy_done: false, values_done: false, voice_done: false },
    })

    render(
      <OnboardingGuard>
        <div data-testid="child">Content</div>
      </OnboardingGuard>
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/onboarding")
    })
  })

  it("redirects when only some stages are incomplete", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { legacy_done: true, values_done: false, voice_done: false },
    })

    render(
      <OnboardingGuard>
        <div data-testid="child">Content</div>
      </OnboardingGuard>
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/onboarding")
    })
  })

  it("renders children when all stages are complete", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { legacy_done: true, values_done: true, voice_done: true },
    })

    render(
      <OnboardingGuard>
        <div data-testid="child">Content</div>
      </OnboardingGuard>
    )

    expect(await screen.findByTestId("child")).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("skips check and renders children on /onboarding path", async () => {
    mockPathname = "/onboarding"

    render(
      <OnboardingGuard>
        <div data-testid="child">Content</div>
      </OnboardingGuard>
    )

    expect(await screen.findByTestId("child")).toBeInTheDocument()
    expect(mockedApi.get).not.toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("skips check on /onboarding subpaths", async () => {
    mockPathname = "/onboarding/step2"

    render(
      <OnboardingGuard>
        <div data-testid="child">Content</div>
      </OnboardingGuard>
    )

    expect(await screen.findByTestId("child")).toBeInTheDocument()
    expect(mockedApi.get).not.toHaveBeenCalled()
  })

  it("renders children when API fails (does not block app)", async () => {
    mockedApi.get.mockRejectedValueOnce(new Error("Network error"))

    render(
      <OnboardingGuard>
        <div data-testid="child">Content</div>
      </OnboardingGuard>
    )

    expect(await screen.findByTestId("child")).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("renders nothing while checking status", () => {
    mockedApi.get.mockReturnValue(new Promise(() => {})) // never resolves

    const { container } = render(
      <OnboardingGuard>
        <div data-testid="child">Content</div>
      </OnboardingGuard>
    )

    expect(screen.queryByTestId("child")).toBeNull()
    expect(container.innerHTML).toBe("")
  })
})
