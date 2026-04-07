import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ValuesDeclaration } from "./ValuesDeclaration"

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}))

import api from "@/lib/api"

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ValuesDeclaration", () => {
  it("renders heading and description", () => {
    render(<ValuesDeclaration onComplete={vi.fn()} />)

    expect(screen.getByText("Declare Your Values")).toBeInTheDocument()
    expect(screen.getByText(/select 3–5 values/i)).toBeInTheDocument()
  })

  it("renders all 20 value options", () => {
    render(<ValuesDeclaration onComplete={vi.fn()} />)

    const buttons = screen
      .getAllByRole("button")
      .filter((btn) => btn.textContent !== "Continue")
    expect(buttons.length).toBe(20)
  })

  it("shows 0 of 3-5 selected initially", () => {
    render(<ValuesDeclaration onComplete={vi.fn()} />)

    expect(screen.getByText("0 of 3–5 selected")).toBeInTheDocument()
  })

  it("selects a value on click and shows context card", async () => {
    const user = userEvent.setup()
    render(<ValuesDeclaration onComplete={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Courage" }))

    expect(screen.getByText("1 of 3–5 selected")).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/what does courage mean/i)
    ).toBeInTheDocument()
  })

  it("deselects a value on second click", async () => {
    const user = userEvent.setup()
    render(<ValuesDeclaration onComplete={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Empathy" }))
    expect(screen.getByText("1 of 3–5 selected")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Empathy" }))
    expect(screen.getByText("0 of 3–5 selected")).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/what does empathy mean/i)).toBeNull()
  })

  it("limits selection to 5 values", async () => {
    const user = userEvent.setup()
    render(<ValuesDeclaration onComplete={vi.fn()} />)

    const values = ["Ownership", "Transparency", "Empathy", "Growth", "Courage"]
    for (const val of values) {
      await user.click(screen.getByRole("button", { name: val }))
    }
    expect(screen.getByText("5 of 3–5 selected")).toBeInTheDocument()

    // 6th value button should be disabled
    const integrityBtn = screen.getByRole("button", { name: "Integrity" })
    expect(integrityBtn).toBeDisabled()
  })

  it("Continue button is disabled with fewer than 3 selections", async () => {
    const user = userEvent.setup()
    render(<ValuesDeclaration onComplete={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Ownership" }))
    await user.click(screen.getByRole("button", { name: "Growth" }))

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
  })

  it("Continue button is disabled when context is empty", async () => {
    const user = userEvent.setup()
    render(<ValuesDeclaration onComplete={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Ownership" }))
    await user.click(screen.getByRole("button", { name: "Growth" }))
    await user.click(screen.getByRole("button", { name: "Empathy" }))

    // 3 selected but no context filled
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled()
  })

  it("enables Continue when 3+ values have context", async () => {
    const user = userEvent.setup()
    render(<ValuesDeclaration onComplete={vi.fn()} />)

    const values = ["Ownership", "Growth", "Empathy"]
    for (const val of values) {
      await user.click(screen.getByRole("button", { name: val }))
    }

    const textareas = screen.getAllByRole("textbox")
    for (const textarea of textareas) {
      await user.type(textarea, "My context")
    }

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled()
  })

  it("calls API and onComplete on submit", async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    mockedApi.post.mockResolvedValueOnce({ data: [] })

    render(<ValuesDeclaration onComplete={onComplete} />)

    const values = ["Ownership", "Growth", "Empathy"]
    for (const val of values) {
      await user.click(screen.getByRole("button", { name: val }))
    }

    const textareas = screen.getAllByRole("textbox")
    for (let i = 0; i < textareas.length; i++) {
      await user.type(textareas[i], `context ${i + 1}`)
    }

    await user.click(screen.getByRole("button", { name: "Continue" }))

    expect(mockedApi.post).toHaveBeenCalledWith("/api/v1/onboarding/values", {
      values: [
        { value_name: "ownership", personal_context: "context 1" },
        { value_name: "growth", personal_context: "context 2" },
        { value_name: "empathy", personal_context: "context 3" },
      ],
    })
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it("shows toast on API failure", async () => {
    const user = userEvent.setup()
    const { toast } = await import("sonner")
    mockedApi.post.mockRejectedValueOnce(new Error("fail"))

    render(<ValuesDeclaration onComplete={vi.fn()} />)

    const values = ["Ownership", "Growth", "Empathy"]
    for (const val of values) {
      await user.click(screen.getByRole("button", { name: val }))
    }

    const textareas = screen.getAllByRole("textbox")
    for (const textarea of textareas) {
      await user.type(textarea, "ctx")
    }

    await user.click(screen.getByRole("button", { name: "Continue" }))

    expect(toast.error).toHaveBeenCalledWith(
      "Failed to save values. Please try again."
    )
  })

  it("shows context prompt with value name", async () => {
    const user = userEvent.setup()
    render(<ValuesDeclaration onComplete={vi.fn()} />)

    await user.click(screen.getByRole("button", { name: "Integrity" }))

    expect(screen.getAllByText(/integrity/i).length).toBeGreaterThanOrEqual(2)
    expect(
      screen.getByPlaceholderText(/what does integrity mean/i)
    ).toBeInTheDocument()
  })
})
