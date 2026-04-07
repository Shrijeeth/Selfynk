import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { ModeSelector, MODES } from "./ModeSelector"

describe("ModeSelector", () => {
  it("renders all 5 mode cards", () => {
    render(<ModeSelector selectedMode="journal" onSelect={vi.fn()} />)

    for (const mode of MODES) {
      expect(screen.getByText(mode.label)).toBeInTheDocument()
      expect(screen.getByText(mode.desc)).toBeInTheDocument()
    }
  })

  it("marks the selected mode with aria-pressed", () => {
    render(<ModeSelector selectedMode="pulse" onSelect={vi.fn()} />)

    const pulseBtn = screen.getByRole("button", { name: /pulse/i })
    expect(pulseBtn).toHaveAttribute("aria-pressed", "true")

    const journalBtn = screen.getByRole("button", { name: /journal/i })
    expect(journalBtn).toHaveAttribute("aria-pressed", "false")
  })

  it("calls onSelect with the mode id when clicked", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ModeSelector selectedMode="journal" onSelect={onSelect} />)

    await user.click(screen.getByRole("button", { name: /debrief/i }))
    expect(onSelect).toHaveBeenCalledWith("debrief")
  })

  it("calls onSelect for each mode", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ModeSelector selectedMode="journal" onSelect={onSelect} />)

    for (const mode of MODES) {
      await user.click(
        screen.getByRole("button", { name: new RegExp(mode.label, "i") })
      )
    }

    expect(onSelect).toHaveBeenCalledTimes(5)
    expect(onSelect.mock.calls.map((c) => c[0])).toEqual([
      "journal",
      "pulse",
      "debrief",
      "network",
      "review",
    ])
  })
})
