import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { DailyPulse, type DailyPulseData } from "./DailyPulse"

const DEFAULT_DATA: DailyPulseData = {
  value_shown: "",
  interaction_note: "",
  alignment_score: 5,
}

describe("DailyPulse", () => {
  it("renders all three fields", () => {
    render(<DailyPulse data={DEFAULT_DATA} onChange={vi.fn()} />)

    expect(screen.getByLabelText("Value shown today")).toBeInTheDocument()
    expect(screen.getByLabelText("Interaction reflection")).toBeInTheDocument()
    expect(screen.getByText("Alignment score")).toBeInTheDocument()
  })

  it("displays correct placeholders", () => {
    render(<DailyPulse data={DEFAULT_DATA} onChange={vi.fn()} />)

    expect(
      screen.getByPlaceholderText(/one thing you did today/i)
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/one interaction you're reflecting on/i)
    ).toBeInTheDocument()
  })

  it("shows the current alignment score", () => {
    render(
      <DailyPulse
        data={{ ...DEFAULT_DATA, alignment_score: 8 }}
        onChange={vi.fn()}
      />
    )

    expect(screen.getByText("8/10")).toBeInTheDocument()
  })

  it("calls onChange when value_shown is typed", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DailyPulse data={DEFAULT_DATA} onChange={onChange} />)

    await user.type(screen.getByLabelText("Value shown today"), "a")

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_DATA,
      value_shown: "a",
    })
  })

  it("calls onChange when interaction_note is typed", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DailyPulse data={DEFAULT_DATA} onChange={onChange} />)

    await user.type(screen.getByLabelText("Interaction reflection"), "b")

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_DATA,
      interaction_note: "b",
    })
  })

  it("renders existing data in the fields", () => {
    const data: DailyPulseData = {
      value_shown: "Helped a colleague",
      interaction_note: "Great 1:1",
      alignment_score: 9,
    }
    render(<DailyPulse data={data} onChange={vi.fn()} />)

    expect(screen.getByLabelText("Value shown today")).toHaveValue(
      "Helped a colleague"
    )
    expect(screen.getByLabelText("Interaction reflection")).toHaveValue(
      "Great 1:1"
    )
    expect(screen.getByText("9/10")).toBeInTheDocument()
  })
})
