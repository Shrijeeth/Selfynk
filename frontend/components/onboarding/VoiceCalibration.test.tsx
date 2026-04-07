import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createElement } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { VoiceCalibration } from "./VoiceCalibration"

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}))

// Mock Select to use a plain <select> for testability
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange: (v: string) => void
    children: React.ReactNode
  }) =>
    createElement(
      "select",
      {
        value,
        "data-testid": "source-select",
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
          onValueChange(e.target.value),
      },
      createElement("option", { value: "" }, "Source type"),
      children
    ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => children,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => children,
  SelectItem: ({
    value,
    children,
  }: {
    value: string
    children: React.ReactNode
  }) => createElement("option", { value }, children),
}))

import api from "@/lib/api"

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("VoiceCalibration", () => {
  it("renders heading and description", () => {
    render(<VoiceCalibration onComplete={vi.fn()} />)

    expect(screen.getByText("Voice Calibration")).toBeInTheDocument()
    expect(
      screen.getByText(/improve the quality of generated content/i)
    ).toBeInTheDocument()
  })

  it("shows Add sample button initially", () => {
    render(<VoiceCalibration onComplete={vi.fn()} />)

    expect(
      screen.getByRole("button", { name: /add sample/i })
    ).toBeInTheDocument()
  })

  it("shows Skip button", () => {
    render(<VoiceCalibration onComplete={vi.fn()} />)

    expect(
      screen.getByRole("button", { name: /skip for now/i })
    ).toBeInTheDocument()
  })

  it("adds a sample card on Add sample click", async () => {
    const user = userEvent.setup()
    render(<VoiceCalibration onComplete={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /add sample/i }))

    expect(screen.getByText("Sample 1")).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/paste your writing sample/i)
    ).toBeInTheDocument()
  })

  it("limits to 3 samples", async () => {
    const user = userEvent.setup()
    render(<VoiceCalibration onComplete={vi.fn()} />)

    for (let i = 0; i < 3; i++) {
      await user.click(screen.getByRole("button", { name: /add sample/i }))
    }

    expect(screen.getByText("Sample 1")).toBeInTheDocument()
    expect(screen.getByText("Sample 2")).toBeInTheDocument()
    expect(screen.getByText("Sample 3")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /add sample/i })).toBeNull()
  })

  it("removes a sample on trash click", async () => {
    const user = userEvent.setup()
    render(<VoiceCalibration onComplete={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /add sample/i }))
    expect(screen.getByText("Sample 1")).toBeInTheDocument()

    // Click the trash button (it's the only icon-sm ghost button)
    const trashButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector("svg.lucide-trash-2"))
    await user.click(trashButtons[0])

    expect(screen.queryByText("Sample 1")).toBeNull()
  })

  it("Continue is disabled with no samples", () => {
    render(<VoiceCalibration onComplete={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
  })

  it("Continue is disabled with incomplete sample", async () => {
    const user = userEvent.setup()
    render(<VoiceCalibration onComplete={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /add sample/i }))
    // Only fill content, no source type
    await user.type(
      screen.getByPlaceholderText(/paste your writing sample/i),
      "Some text"
    )

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
  })

  it("calls Skip without API call", async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<VoiceCalibration onComplete={onComplete} />)

    await user.click(screen.getByRole("button", { name: /skip for now/i }))

    expect(onComplete).toHaveBeenCalledOnce()
    expect(mockedApi.post).not.toHaveBeenCalled()
  })

  it("calls API and onComplete on submit", async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    mockedApi.post.mockResolvedValueOnce({ data: [] })

    render(<VoiceCalibration onComplete={onComplete} />)

    await user.click(screen.getByRole("button", { name: /add sample/i }))

    // Fill source type
    await user.selectOptions(
      screen.getByTestId("source-select"),
      "linkedin_post"
    )

    // Fill content
    await user.type(
      screen.getByPlaceholderText(/paste your writing sample/i),
      "My LinkedIn post about leadership"
    )

    await user.click(screen.getByRole("button", { name: "Continue" }))

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/api/v1/onboarding/voice-samples",
      {
        samples: [
          {
            content: "My LinkedIn post about leadership",
            source_type: "linkedin_post",
          },
        ],
      }
    )
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it("shows toast on API failure", async () => {
    const user = userEvent.setup()
    const { toast } = await import("sonner")
    mockedApi.post.mockRejectedValueOnce(new Error("fail"))

    render(<VoiceCalibration onComplete={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /add sample/i }))

    await user.selectOptions(screen.getByTestId("source-select"), "email")

    await user.type(
      screen.getByPlaceholderText(/paste your writing sample/i),
      "text"
    )

    await user.click(screen.getByRole("button", { name: "Continue" }))

    expect(toast.error).toHaveBeenCalledWith(
      "Failed to save voice samples. Please try again."
    )
  })

  it("shows (up to 3) hint on first Add sample", () => {
    render(<VoiceCalibration onComplete={vi.fn()} />)

    expect(screen.getByText("(up to 3)")).toBeInTheDocument()
  })

  it("hides (up to 3) hint after adding first sample", async () => {
    const user = userEvent.setup()
    render(<VoiceCalibration onComplete={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: /add sample/i }))

    expect(screen.queryByText("(up to 3)")).toBeNull()
  })
})
