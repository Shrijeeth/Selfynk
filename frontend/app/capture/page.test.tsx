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
    // Journal is pressed by default
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent(
      "Journal"
    )
    // Network mode button exists (also "networking" tag exists, so use getAllBy)
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
    // After click it should have the selected class
    expect(meetingBtn.className).toContain("border-primary")

    // Click again to deselect
    await user.click(meetingBtn)
    expect(meetingBtn.className).not.toContain("bg-primary/10")
  })

  it("emotion buttons toggle on/off", async () => {
    const user = userEvent.setup()
    render(<CapturePage />, { wrapper: createWrapper() })

    const energizedBtn = screen.getByRole("button", { name: "Energized" })
    await user.click(energizedBtn)
    expect(energizedBtn.className).toContain("border-primary")

    // Click again to deselect
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

    // Journal entry - HTML stripped preview
    expect(screen.getByText("My journal entry")).toBeInTheDocument()
    // "Journal" appears in both mode selector and entry badge
    expect(screen.getAllByText("Journal").length).toBeGreaterThanOrEqual(2)

    // Pulse entry - first string value from JSON
    expect(screen.getByText("Led standup")).toBeInTheDocument()
    // "Pulse" appears in both mode selector and entry badge
    expect(screen.getAllByText("Pulse").length).toBeGreaterThanOrEqual(2)
  })

  it("displays context tags on entry cards", () => {
    render(<CapturePage />, { wrapper: createWrapper() })

    // The journal entry has "meeting" and "1:1" tags
    // "meeting" appears both as a context tag button and in entry card
    const meetingBadges = screen.getAllByText("meeting")
    expect(meetingBadges.length).toBeGreaterThanOrEqual(2) // tag button + entry badge

    const oneOnOneBadges = screen.getAllByText("1:1")
    expect(oneOnOneBadges.length).toBeGreaterThanOrEqual(2) // tag button + entry badge
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
})
