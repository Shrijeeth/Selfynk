import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { SituationDebrief, type SituationDebriefData } from "./SituationDebrief"

const DEFAULT_DATA: SituationDebriefData = {
  situation_type: "",
  how_i_showed_up: "",
  value_demonstrated: "",
  what_id_do_differently: "",
}

describe("SituationDebrief", () => {
  it("renders all four fields", () => {
    render(<SituationDebrief data={DEFAULT_DATA} onChange={vi.fn()} />)

    expect(screen.getByText("Situation type")).toBeInTheDocument()
    expect(screen.getByLabelText("How you showed up")).toBeInTheDocument()
    expect(screen.getByLabelText("Value demonstrated")).toBeInTheDocument()
    expect(
      screen.getByLabelText(/what you'd do differently/i)
    ).toBeInTheDocument()
  })

  it("shows correct placeholders on textareas", () => {
    render(<SituationDebrief data={DEFAULT_DATA} onChange={vi.fn()} />)

    expect(
      screen.getByPlaceholderText("How did you show up in this situation?")
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(
        "What value did you demonstrate or fail to demonstrate?"
      )
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("What would you do differently next time?")
    ).toBeInTheDocument()
  })

  it("calls onChange when typing in how_i_showed_up", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SituationDebrief data={DEFAULT_DATA} onChange={onChange} />)

    await user.type(
      screen.getByLabelText("How you showed up"),
      "I led the discussion"
    )

    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls[0][0]
    expect(lastCall.how_i_showed_up).toBe("I")
  })

  it("calls onChange when typing in value_demonstrated", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SituationDebrief data={DEFAULT_DATA} onChange={onChange} />)

    await user.type(screen.getByLabelText("Value demonstrated"), "x")

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_DATA,
      value_demonstrated: "x",
    })
  })

  it("calls onChange when typing in what_id_do_differently", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SituationDebrief data={DEFAULT_DATA} onChange={onChange} />)

    await user.type(screen.getByLabelText(/what you'd do differently/i), "y")

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_DATA,
      what_id_do_differently: "y",
    })
  })

  it("renders existing data in fields", () => {
    const data: SituationDebriefData = {
      situation_type: "meeting",
      how_i_showed_up: "Confident",
      value_demonstrated: "Leadership",
      what_id_do_differently: "Listen more",
    }
    render(<SituationDebrief data={data} onChange={vi.fn()} />)

    expect(screen.getByLabelText("How you showed up")).toHaveValue("Confident")
    expect(screen.getByLabelText("Value demonstrated")).toHaveValue(
      "Leadership"
    )
    expect(screen.getByLabelText(/what you'd do differently/i)).toHaveValue(
      "Listen more"
    )
  })
})
