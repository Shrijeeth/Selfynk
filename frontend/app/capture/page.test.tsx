import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createElement, type ReactNode } from "react"
import CapturePage from "./page"
import type { InputEntry } from "@/types"

const ENTRY_FIXTURE: InputEntry = {
  id: 1,
  mode: "journal",
  content: "<p>My journal entry</p>",
  context_tags: ["meeting", "1:1"],
  emotion: "energized",
  alignment_score: null,
  created_at: "2026-04-01T10:00:00Z",
  updated_at: "2026-04-01T10:00:00Z",
  is_analyzed: false,
  analysis_id: null,
}

const PULSE_ENTRY: InputEntry = {
  id: 2,
  mode: "pulse",
  content: JSON.stringify({
    value_shown: "Led standup",
    interaction_note: "Good feedback",
    alignment_score: 7,
  }),
  context_tags: [],
  emotion: "neutral",
  alignment_score: 7,
  created_at: "2026-04-02T10:00:00Z",
  updated_at: "2026-04-02T10:00:00Z",
  is_analyzed: false,
  analysis_id: null,
}

const mockMutate = vi.fn()

vi.mock("@/lib/hooks/use-input-entries", () => ({
  useInputEntries: vi.fn(() => ({
    data: [ENTRY_FIXTURE, PULSE_ENTRY],
    isLoading: false,
  })),
  useCreateEntry: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}))

vi.mock("@/lib/hooks/use-analysis", () => ({
  useAnalysis: vi.fn(() => ({ data: null })),
  useInvalidateAnalysis: vi.fn(() => vi.fn()),
}))

vi.mock("@/components/capture/JournalEditor", () => ({
  JournalEditor: ({
    onChange,
  }: {
    content: string
    onChange: (v: string) => void
  }) =>
    createElement("textarea", {
      "data-testid": "journal-editor",
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        onChange(e.target.value),
    }),
}))

vi.mock("@/components/analysis/AnalysisPanel", () => ({
  AnalysisPanel: ({
    open,
    streamUrl,
    analysis,
  }: {
    open: boolean
    streamUrl?: string | null
    analysis?: unknown
    onOpenChange: (v: boolean) => void
    onStreamDone?: () => void
  }) =>
    open
      ? createElement("div", { "data-testid": "analysis-panel" }, [
          streamUrl
            ? createElement(
                "span",
                { key: "s", "data-testid": "stream-url" },
                streamUrl
              )
            : null,
          analysis
            ? createElement(
                "span",
                { key: "a", "data-testid": "analysis-data" },
                "loaded"
              )
            : null,
        ])
      : null,
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
  return Wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("CapturePage", () => {
  it("renders the page heading", () => {
    render(<CapturePage />, { wrapper: createWrapper() })

    expect(screen.getByText("Capture")).toBeInTheDocument()
    expect(screen.getByText(/record your thoughts/i)).toBeInTheDocument()
  })

  it("renders all 5 mode buttons", () => {
    render(<CapturePage />, { wrapper: createWrapper() })

    const modeButtons = screen.getAllByRole("button", { pressed: false })
    const modeLabels = ["Pulse", "Debrief", "Review"]
    for (const label of modeLabels) {
      expect(
        modeButtons.find((btn) => btn.textContent?.includes(label))
      ).toBeDefined()
    }
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent(
      "Journal"
    )
    expect(
      screen.getAllByRole("button", { name: /network/i }).length
    ).toBeGreaterThanOrEqual(1)
  })

  it("renders all 7 context tag buttons", () => {
    render(<CapturePage />, { wrapper: createWrapper() })

    for (const tag of [
      "meeting",
      "interview",
      "presentation",
      "1:1",
      "learning",
      "content-creation",
      "networking",
    ]) {
      expect(screen.getByRole("button", { name: tag })).toBeInTheDocument()
    }
  })

  it("renders the 3 emotion buttons", () => {
    render(<CapturePage />, { wrapper: createWrapper() })

    expect(
      screen.getByRole("button", { name: "Energized" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Neutral" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Drained" })).toBeInTheDocument()
  })

  it("renders the save button", () => {
    render(<CapturePage />, { wrapper: createWrapper() })

    expect(
      screen.getByRole("button", { name: /save entry/i })
    ).toBeInTheDocument()
  })

  it("shows the journal editor by default", () => {
    render(<CapturePage />, { wrapper: createWrapper() })

    expect(screen.getByTestId("journal-editor")).toBeInTheDocument()
  })

  it("context tags can be toggled", async () => {
    const user = userEvent.setup()
    render(<CapturePage />, { wrapper: createWrapper() })

    const meetingBtn = screen.getByRole("button", { name: "meeting" })
    await user.click(meetingBtn)
    expect(meetingBtn.className).toContain("border-primary")

    await user.click(meetingBtn)
    expect(meetingBtn.className).not.toContain("bg-primary/10")
  })

  it("emotion buttons toggle on/off", async () => {
    const user = userEvent.setup()
    render(<CapturePage />, { wrapper: createWrapper() })

    const energizedBtn = screen.getByRole("button", { name: "Energized" })
    await user.click(energizedBtn)
    expect(energizedBtn.className).toContain("border-primary")

    await user.click(energizedBtn)
    expect(energizedBtn.className).not.toContain("bg-primary/10")
  })

  it("pre-selects 'meeting' tag when switching to debrief mode", async () => {
    const user = userEvent.setup()
    render(<CapturePage />, { wrapper: createWrapper() })

    await user.click(screen.getByRole("button", { name: /debrief/i }))

    const meetingBtn = screen.getByRole("button", { name: "meeting" })
    expect(meetingBtn.className).toContain("border-primary")
  })

  it("renders past entries section", () => {
    render(<CapturePage />, { wrapper: createWrapper() })

    expect(screen.getByText("Past Entries")).toBeInTheDocument()
  })

  it("displays entry cards with mode badge and preview", () => {
    render(<CapturePage />, { wrapper: createWrapper() })

    expect(screen.getByText("My journal entry")).toBeInTheDocument()
    expect(screen.getAllByText("Journal").length).toBeGreaterThanOrEqual(2)

    expect(screen.getByText("Led standup")).toBeInTheDocument()
    expect(screen.getAllByText("Pulse").length).toBeGreaterThanOrEqual(2)
  })

  it("displays context tags on entry cards", () => {
    render(<CapturePage />, { wrapper: createWrapper() })

    const meetingBadges = screen.getAllByText("meeting")
    expect(meetingBadges.length).toBeGreaterThanOrEqual(2)

    const oneOnOneBadges = screen.getAllByText("1:1")
    expect(oneOnOneBadges.length).toBeGreaterThanOrEqual(2)
  })

  it("shows empty state when no entries", async () => {
    const { useInputEntries } = await import("@/lib/hooks/use-input-entries")
    vi.mocked(useInputEntries).mockReturnValueOnce({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useInputEntries>)

    render(<CapturePage />, { wrapper: createWrapper() })

    expect(screen.getByText(/no entries yet/i)).toBeInTheDocument()
  })

  // ── Analysis Panel integration ─────────────────────────────────

  it("does not show analysis panel initially", () => {
    render(<CapturePage />, { wrapper: createWrapper() })

    expect(screen.queryByTestId("analysis-panel")).toBeNull()
  })

  it("opens analysis panel with stream URL after save", async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementation(
      (_payload: unknown, opts: { onSuccess: (data: InputEntry) => void }) => {
        opts.onSuccess({ ...ENTRY_FIXTURE, id: 42 })
      }
    )

    render(<CapturePage />, { wrapper: createWrapper() })

    // Type in the journal editor to have content
    await user.type(screen.getByTestId("journal-editor"), "Hello world")
    await user.click(screen.getByRole("button", { name: /save entry/i }))

    // Panel should now be open with stream URL
    expect(screen.getByTestId("analysis-panel")).toBeInTheDocument()
    const streamUrl = screen.getByTestId("stream-url")
    expect(streamUrl.textContent).toContain("/api/v1/analysis/stream/42")
  })

  it("does not open panel if save fails", async () => {
    const user = userEvent.setup()
    mockMutate.mockImplementation(
      (_payload: unknown, opts: { onError: () => void }) => {
        opts.onError()
      }
    )

    render(<CapturePage />, { wrapper: createWrapper() })

    await user.type(screen.getByTestId("journal-editor"), "Hello")
    await user.click(screen.getByRole("button", { name: /save entry/i }))

    expect(screen.queryByTestId("analysis-panel")).toBeNull()
  })
})
