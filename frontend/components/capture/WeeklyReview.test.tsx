import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { WeeklyReview, type WeeklyReviewData } from "./WeeklyReview"

const DEFAULT_DATA: WeeklyReviewData = {
  wins: "",
  challenges: "",
  brand_alignment: "",
  next_week_focus: "",
}

describe("WeeklyReview", () => {
  it("renders all four reflection fields", () => {
    render(<WeeklyReview data={DEFAULT_DATA} onChange={vi.fn()} />)

    expect(screen.getByLabelText("Wins this week")).toBeInTheDocument()
    expect(screen.getByLabelText("Challenges")).toBeInTheDocument()
    expect(screen.getByLabelText("Brand alignment")).toBeInTheDocument()
    expect(screen.getByLabelText("Next week focus")).toBeInTheDocument()
  })

  it("shows correct placeholders", () => {
    render(<WeeklyReview data={DEFAULT_DATA} onChange={vi.fn()} />)

    expect(
      screen.getByPlaceholderText("What went well this week?")
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("What challenges did you face?")
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/how well did your actions align/i)
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("What will you focus on next week?")
    ).toBeInTheDocument()
  })

  it("calls onChange when typing in wins", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<WeeklyReview data={DEFAULT_DATA} onChange={onChange} />)

    await user.type(screen.getByLabelText("Wins this week"), "a")

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_DATA,
      wins: "a",
    })
  })

  it("calls onChange when typing in challenges", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<WeeklyReview data={DEFAULT_DATA} onChange={onChange} />)

    await user.type(screen.getByLabelText("Challenges"), "b")

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_DATA,
      challenges: "b",
    })
  })

  it("calls onChange when typing in brand_alignment", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<WeeklyReview data={DEFAULT_DATA} onChange={onChange} />)

    await user.type(screen.getByLabelText("Brand alignment"), "c")

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_DATA,
      brand_alignment: "c",
    })
  })

  it("calls onChange when typing in next_week_focus", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<WeeklyReview data={DEFAULT_DATA} onChange={onChange} />)

    await user.type(screen.getByLabelText("Next week focus"), "d")

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_DATA,
      next_week_focus: "d",
    })
  })

  it("renders existing data in fields", () => {
    const data: WeeklyReviewData = {
      wins: "Shipped feature",
      challenges: "Tight deadline",
      brand_alignment: "Strong",
      next_week_focus: "Documentation",
    }
    render(<WeeklyReview data={data} onChange={vi.fn()} />)

    expect(screen.getByLabelText("Wins this week")).toHaveValue(
      "Shipped feature"
    )
    expect(screen.getByLabelText("Challenges")).toHaveValue("Tight deadline")
    expect(screen.getByLabelText("Brand alignment")).toHaveValue("Strong")
    expect(screen.getByLabelText("Next week focus")).toHaveValue(
      "Documentation"
    )
  })
})
