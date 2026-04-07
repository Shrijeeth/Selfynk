import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { LegacyExercise } from "./LegacyExercise"

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
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
  it("renders the first question", () => {
    render(<LegacyExercise onComplete={vi.fn()} />)

    expect(screen.getByText(/Q1\./)).toBeInTheDocument()
    expect(screen.getByText(/10 years/)).toBeInTheDocument()
    expect(screen.getByText("Question 1 of 10")).toBeInTheDocument()
  })

  it("shows Next button disabled when answer is empty", () => {
    render(<LegacyExercise onComplete={vi.fn()} />)

    const nextBtn = screen.getByRole("button", { name: "Next" })
    expect(nextBtn).toBeDisabled()
  })

  it("enables Next button when answer is typed", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("Your answer..."), "test")

    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled()
  })

  it("advances to the next question on Next click", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.type(screen.getByPlaceholderText("Your answer..."), "answer 1")
    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(screen.getByText(/Q2\./)).toBeInTheDocument()
    expect(screen.getByText("Question 2 of 10")).toBeInTheDocument()
  })

  it("does not have a back button", () => {
    render(<LegacyExercise onComplete={vi.fn()} />)

    expect(screen.queryByRole("button", { name: /back/i })).toBeNull()
    expect(screen.queryByRole("button", { name: /previous/i })).toBeNull()
  })

  it("shows Generate Statement on the last question", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    // Navigate to question 10
    for (let i = 0; i < 9; i++) {
      await user.type(
        screen.getByPlaceholderText("Your answer..."),
        `answer ${i + 1}`
      )
      await user.click(screen.getByRole("button", { name: "Next" }))
    }

    expect(screen.getByText(/Q10\./)).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText("Your answer..."), "answer 10")
    expect(
      screen.getByRole("button", { name: "Generate Statement" })
    ).toBeEnabled()
  })

  it("calls API and shows review phase after generation", async () => {
    const user = userEvent.setup()
    mockedApi.post.mockResolvedValueOnce(MOCK_STATEMENT)

    render(<LegacyExercise onComplete={vi.fn()} />)

    // Complete all 10 questions
    for (let i = 0; i < 9; i++) {
      await user.type(
        screen.getByPlaceholderText("Your answer..."),
        `a${i + 1}`
      )
      await user.click(screen.getByRole("button", { name: "Next" }))
    }
    await user.type(screen.getByPlaceholderText("Your answer..."), "a10")
    await user.click(screen.getByRole("button", { name: "Generate Statement" }))

    // Review phase
    expect(await screen.findByText("Your Legacy Words")).toBeInTheDocument()
    expect(screen.getByText("bold")).toBeInTheDocument()
    expect(screen.getByText("kind")).toBeInTheDocument()
    expect(screen.getByText("relentless")).toBeInTheDocument()

    expect(screen.getByText("Your Desired Brand Statement")).toBeInTheDocument()
    expect(
      screen.getByDisplayValue(MOCK_STATEMENT.data.desired_description)
    ).toBeInTheDocument()

    expect(screen.getByText("Quarterly Actions")).toBeInTheDocument()
    expect(screen.getByText("Publish a blog post")).toBeInTheDocument()
    expect(screen.getByText("Mentor someone")).toBeInTheDocument()

    expect(screen.getByText("Review your statement")).toBeInTheDocument()
  })

  it("allows editing the desired description", async () => {
    const user = userEvent.setup()
    mockedApi.post.mockResolvedValueOnce(MOCK_STATEMENT)

    render(<LegacyExercise onComplete={vi.fn()} />)

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

    const textarea = await screen.findByDisplayValue(
      MOCK_STATEMENT.data.desired_description
    )
    await user.clear(textarea)
    await user.type(textarea, "My edited statement")

    expect(screen.getByDisplayValue("My edited statement")).toBeInTheDocument()
  })

  it("calls onComplete when Confirm is clicked", async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    mockedApi.post.mockResolvedValue(MOCK_STATEMENT)

    render(<LegacyExercise onComplete={onComplete} />)

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

  it("shows error and returns to last question on API failure", async () => {
    const user = userEvent.setup()
    mockedApi.post.mockRejectedValueOnce(new Error("Server error"))

    render(<LegacyExercise onComplete={vi.fn()} />)

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
    // Should be back on Q10
    expect(screen.getByText(/Q10\./)).toBeInTheDocument()
  })

  it("preserves answers when navigating forward", async () => {
    const user = userEvent.setup()
    render(<LegacyExercise onComplete={vi.fn()} />)

    await user.type(
      screen.getByPlaceholderText("Your answer..."),
      "first answer"
    )
    await user.click(screen.getByRole("button", { name: "Next" }))

    // Q2 should have empty textarea
    expect(screen.getByPlaceholderText("Your answer...")).toHaveValue("")
  })
})
