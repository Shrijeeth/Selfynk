import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { NetworkLogForm, type NetworkLogFormData } from "./NetworkLogForm"

const DEFAULT_DATA: NetworkLogFormData = {
  person_name: "",
  contact_type: "",
  notes: "",
}

describe("NetworkLogForm", () => {
  it("renders all three fields", () => {
    render(<NetworkLogForm data={DEFAULT_DATA} onChange={vi.fn()} />)

    expect(screen.getByLabelText("Person name")).toBeInTheDocument()
    expect(screen.getByText("Contact type")).toBeInTheDocument()
    expect(screen.getByLabelText("Notes")).toBeInTheDocument()
  })

  it("shows correct placeholders", () => {
    render(<NetworkLogForm data={DEFAULT_DATA} onChange={vi.fn()} />)

    expect(
      screen.getByPlaceholderText("Who did you connect with?")
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Brief notes about the interaction...")
    ).toBeInTheDocument()
  })

  it("calls onChange when typing person_name", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NetworkLogForm data={DEFAULT_DATA} onChange={onChange} />)

    await user.type(screen.getByLabelText("Person name"), "Jane")

    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls[0][0].person_name).toBe("J")
  })

  it("calls onChange when typing notes", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<NetworkLogForm data={DEFAULT_DATA} onChange={onChange} />)

    await user.type(screen.getByLabelText("Notes"), "z")

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_DATA,
      notes: "z",
    })
  })

  it("renders existing data in fields", () => {
    const data: NetworkLogFormData = {
      person_name: "Alice",
      contact_type: "supporter",
      notes: "Great chat",
    }
    render(<NetworkLogForm data={data} onChange={vi.fn()} />)

    expect(screen.getByLabelText("Person name")).toHaveValue("Alice")
    expect(screen.getByLabelText("Notes")).toHaveValue("Great chat")
  })
})
