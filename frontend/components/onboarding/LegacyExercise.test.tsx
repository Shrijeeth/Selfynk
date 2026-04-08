import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createElement } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { LegacyExercise } from "./LegacyExercise"

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}))

vi.mock("@/components/onboarding/MemoryImport", () => ({
  MemoryImport: ({
    onImport,
    onCancel,
  }: {
    onImport: (a: Record<string, string>, c: Record<string, string>) => void
    onCancel: () => void
  }) => {
    return createElement("div", { "data-testid": "memory-import" }, [
      createElement(
        "button",
        {
          key: "import",
          onClick: () =>
            onImport(
              {
                q1: "bold",
                q2: "edu",
                q3: "build",
                q4: "",
                q5: "sys",
                q6: "",
                q7: "honesty",
                q8: "legacy",
                q9: "",
                q10: "write",
              },
              {
                q1: "high",
                q2: "medium",
                q3: "high",
                q4: "low",
                q5: "high",
                q6: "low",
                q7: "high",
                q8: "high",
                q9: "low",
                q10: "medium",
              }
            ),
        },
        "Do Import"
      ),
      createElement(
        "button",
        { key: "cancel", onClick: onCancel },
        "Cancel Import"
      ),
    ])
  },
}))

import api from "@/lib/api"

const mockedApi = vi.mocked(api)

const MOCK_STATEMENT = {
  data: {
    legacy_words: ["bold", "kind", "relentless"],
    desired_description: "You want to be known as bold and kind.",
    reverse_engineered_actions: ["Publish a blog post", "Mentor someone"],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("LegacyExercise", () => {
  // ── Entry Chooser ──────────────────────────────────────────────

  it("renders entry chooser initially", () => {
    render(<LegacyExercise onComplete={vi.fn()} />)

    expect(screen.getByText("Answer 10 questions")).toBeInTheDocument()
    expect(screen.getByText("Import from AI conversations")).toBeInTheDocument()
  })

  it("does not show questions on initial render", () => {
    render(<LegacyExercise onComplete={vi.fn()} />)

    expect(screen.queryByText(/Q1\./)).toBeNull()
  })

  it("goes to Q1 when Answer manually is clicked", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.click(screen.getByText("Answer 10 questions"))

    expect(screen.getByText(/Q1\./)).toBeInTheDocument()
  })

  it("shows import UI when Import is clicked", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.click(screen.getByText("Import from AI conversations"))

    expect(screen.getByTestId("memory-import")).toBeInTheDocument()
  })

  it("returns to chooser when import is cancelled", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.click(screen.getByText("Import from AI conversations"))
    await user.click(screen.getByText("Cancel Import"))

    expect(screen.getByText("Answer 10 questions")).toBeInTheDocument()
  })

  // ── Import Pre-fill ────────────────────────────────────────────

  it("pre-fills answers after import and enters carousel", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.click(screen.getByText("Import from AI conversations"))
    await user.click(screen.getByText("Do Import"))

    // Should be on Q1 with pre-filled answer
    expect(screen.getByText(/Q1\./)).toBeInTheDocument()
    expect(screen.getByDisplayValue("bold")).toBeInTheDocument()
  })

  it("shows partial fill message after import with gaps", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.click(screen.getByText("Import from AI conversations"))
    await user.click(screen.getByText("Do Import"))

    // 3 empty answers (q4, q6, q9) = 7 of 10 filled
    expect(screen.getByText(/pre-filled 7 of 10/i)).toBeInTheDocument()
  })

  it("shows needs review badge for low confidence answers", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.click(screen.getByText("Import from AI conversations"))
    await user.click(screen.getByText("Do Import"))

    // Q1 is high confidence — no badge
    expect(screen.queryByText("needs review")).toBeNull()

    // Navigate to Q4 (low confidence)
    for (let i = 0; i < 3; i++) {
      const textarea = screen.getByPlaceholderText("Your answer...")
      if (
        !textarea.getAttribute("value") &&
        !(textarea as HTMLTextAreaElement).value
      ) {
        await user.type(textarea, "filler")
      }
      await user.click(screen.getByRole("button", { name: "Next" }))
    }

    expect(screen.getByText("needs review")).toBeInTheDocument()
  })

  // ── Manual Flow (unchanged) ────────────────────────────────────

  it("manual flow: Next disabled when empty", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.click(screen.getByText("Answer 10 questions"))

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled()
  })

  it("manual flow: advances to next question", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.click(screen.getByText("Answer 10 questions"))
    await user.type(screen.getByPlaceholderText("Your answer..."), "answer 1")
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByText(/Q2\./)).toBeInTheDocument()
  })

  it("manual flow: shows Generate Statement on Q10", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.click(screen.getByText("Answer 10 questions"))

    for (let i = 0; i < 9; i++) {
      await user.type(
        screen.getByPlaceholderText("Your answer..."),
        `a${i + 1}`
      )
      await user.click(screen.getByRole("button", { name: "Next" }))
    }

    await user.type(screen.getByPlaceholderText("Your answer..."), "a10")
    expect(
      screen.getByRole("button", { name: "Generate Statement" })
    ).toBeEnabled()
  })

  it("manual flow: calls API and shows review", async () => {
    const user = userEvent.setup()
    mockedApi.post.mockResolvedValueOnce(MOCK_STATEMENT)

    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.click(screen.getByText("Answer 10 questions"))

    for (let i = 0; i < 9; i++) {
      await user.type(
        screen.getByPlaceholderText("Your answer..."),
        `a${i + 1}`
      )
      await user.click(screen.getByRole("button", { name: "Next" }))
    }
    await user.type(screen.getByPlaceholderText("Your answer..."), "a10")
    await user.click(screen.getByRole("button", { name: "Generate Statement" }))

    expect(await screen.findByText("Your Legacy Words")).toBeInTheDocument()
    expect(screen.getByText("bold")).toBeInTheDocument()
  })

  it("calls onComplete on confirm", async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    mockedApi.post.mockResolvedValue(MOCK_STATEMENT)

    render(<LegacyExercise onComplete={onComplete} />)

    await user.click(screen.getByText("Answer 10 questions"))

    for (let i = 0; i < 10; i++) {
      await user.type(
        screen.getByPlaceholderText("Your answer..."),
        `a${i + 1}`
      )
      if (i < 9) {
        await user.click(screen.getByRole("button", { name: "Next" }))
      } else {
        await user.click(
          screen.getByRole("button", { name: "Generate Statement" })
        )
      }
    }

    await screen.findByText("Confirm & Continue")
    await user.click(screen.getByRole("button", { name: "Confirm & Continue" }))

    expect(onComplete).toHaveBeenCalledOnce()
  })

  it("shows error on API failure", async () => {
    const user = userEvent.setup()
    mockedApi.post.mockRejectedValueOnce(new Error("Server error"))

    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.click(screen.getByText("Answer 10 questions"))

    for (let i = 0; i < 10; i++) {
      await user.type(
        screen.getByPlaceholderText("Your answer..."),
        `a${i + 1}`
      )
      if (i < 9) {
        await user.click(screen.getByRole("button", { name: "Next" }))
      } else {
        await user.click(
          screen.getByRole("button", { name: "Generate Statement" })
        )
      }
    }

    expect(await screen.findByText(/failed to generate/i)).toBeInTheDocument()
  })
})
