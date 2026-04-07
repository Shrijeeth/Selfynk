import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import type { Analysis } from "@/types"
import { AnalysisPanel } from "./AnalysisPanel"

vi.mock("@/lib/sse", () => ({
  useSSEStream: () => ({ text: "streaming...", isDone: false, error: null }),
}))

const ANALYSIS_FIXTURE: Analysis = {
  id: 1,
  entry_id: 10,
  themes: ["product thinking", "team leadership"],
  skills_detected: ["async communication", "stakeholder management"],
  values_detected: ["transparency", "ownership"],
  tone: "leader",
  perception_signals: [
    "seen as a decisive operator",
    "trusted to drive outcomes",
  ],
  raw_output: "{}",
  created_at: "2026-04-01T10:00:00Z",
}

describe("AnalysisPanel", () => {
  it("renders the sheet title and description when open", () => {
    render(
      <AnalysisPanel
        open={true}
        onOpenChange={vi.fn()}
        analysis={ANALYSIS_FIXTURE}
      />
    )

    expect(screen.getByText("Analysis")).toBeInTheDocument()
    expect(screen.getByText(/identity signals extracted/i)).toBeInTheDocument()
  })

  it("renders all theme tags", () => {
    render(
      <AnalysisPanel
        open={true}
        onOpenChange={vi.fn()}
        analysis={ANALYSIS_FIXTURE}
      />
    )

    expect(screen.getByText("product thinking")).toBeInTheDocument()
    expect(screen.getByText("team leadership")).toBeInTheDocument()
  })

  it("renders all skill tags", () => {
    render(
      <AnalysisPanel
        open={true}
        onOpenChange={vi.fn()}
        analysis={ANALYSIS_FIXTURE}
      />
    )

    expect(screen.getByText("async communication")).toBeInTheDocument()
    expect(screen.getByText("stakeholder management")).toBeInTheDocument()
  })

  it("renders all value tags", () => {
    render(
      <AnalysisPanel
        open={true}
        onOpenChange={vi.fn()}
        analysis={ANALYSIS_FIXTURE}
      />
    )

    expect(screen.getByText("transparency")).toBeInTheDocument()
    expect(screen.getByText("ownership")).toBeInTheDocument()
  })

  it("renders tone badge", () => {
    render(
      <AnalysisPanel
        open={true}
        onOpenChange={vi.fn()}
        analysis={ANALYSIS_FIXTURE}
      />
    )

    expect(screen.getByText("leader")).toBeInTheDocument()
  })

  it("renders perception signals", () => {
    render(
      <AnalysisPanel
        open={true}
        onOpenChange={vi.fn()}
        analysis={ANALYSIS_FIXTURE}
      />
    )

    expect(screen.getByText("seen as a decisive operator")).toBeInTheDocument()
    expect(screen.getByText("trusted to drive outcomes")).toBeInTheDocument()
  })

  it("renders section headers", () => {
    render(
      <AnalysisPanel
        open={true}
        onOpenChange={vi.fn()}
        analysis={ANALYSIS_FIXTURE}
      />
    )

    expect(screen.getByText("Themes")).toBeInTheDocument()
    expect(screen.getByText("Skills")).toBeInTheDocument()
    expect(screen.getByText("Values")).toBeInTheDocument()
    expect(screen.getByText("Tone")).toBeInTheDocument()
    expect(screen.getByText("Perception signals")).toBeInTheDocument()
  })

  it("renders Generate post button when onGeneratePost is provided", () => {
    render(
      <AnalysisPanel
        open={true}
        onOpenChange={vi.fn()}
        analysis={ANALYSIS_FIXTURE}
        onGeneratePost={vi.fn()}
      />
    )

    expect(
      screen.getByRole("button", { name: /generate post/i })
    ).toBeInTheDocument()
  })

  it("calls onGeneratePost when button is clicked", async () => {
    const user = userEvent.setup()
    const onGeneratePost = vi.fn()

    render(
      <AnalysisPanel
        open={true}
        onOpenChange={vi.fn()}
        analysis={ANALYSIS_FIXTURE}
        onGeneratePost={onGeneratePost}
      />
    )

    await user.click(screen.getByRole("button", { name: /generate post/i }))
    expect(onGeneratePost).toHaveBeenCalledOnce()
  })

  it("does not render Generate post when onGeneratePost is not provided", () => {
    render(
      <AnalysisPanel
        open={true}
        onOpenChange={vi.fn()}
        analysis={ANALYSIS_FIXTURE}
      />
    )

    expect(screen.queryByRole("button", { name: /generate post/i })).toBeNull()
  })

  it("shows empty state when no analysis and not streaming", () => {
    render(<AnalysisPanel open={true} onOpenChange={vi.fn()} analysis={null} />)

    expect(screen.getByText(/no analysis available yet/i)).toBeInTheDocument()
  })

  it("shows StreamingText when streamUrl is provided and no analysis", () => {
    render(
      <AnalysisPanel
        open={true}
        onOpenChange={vi.fn()}
        analysis={null}
        streamUrl="http://test/stream/1"
      />
    )

    // StreamingText is mocked to render "streaming..."
    expect(screen.getByText("streaming...")).toBeInTheDocument()
    // Empty state should NOT show
    expect(screen.queryByText(/no analysis available yet/i)).toBeNull()
  })

  it("shows analysis over streaming when both are provided", () => {
    render(
      <AnalysisPanel
        open={true}
        onOpenChange={vi.fn()}
        analysis={ANALYSIS_FIXTURE}
        streamUrl="http://test/stream/1"
      />
    )

    // Analysis tags should show, not streaming text
    expect(screen.getByText("product thinking")).toBeInTheDocument()
    expect(screen.queryByText("streaming...")).toBeNull()
  })

  it("handles analysis with no tone gracefully", () => {
    const noTone: Analysis = { ...ANALYSIS_FIXTURE, tone: null }

    render(
      <AnalysisPanel open={true} onOpenChange={vi.fn()} analysis={noTone} />
    )

    expect(screen.queryByText("Tone")).toBeNull()
  })

  it("handles analysis with empty perception signals", () => {
    const noSignals: Analysis = {
      ...ANALYSIS_FIXTURE,
      perception_signals: [],
    }

    render(
      <AnalysisPanel open={true} onOpenChange={vi.fn()} analysis={noSignals} />
    )

    expect(screen.queryByText("Perception signals")).toBeNull()
  })
})
