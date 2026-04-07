import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { StreamingText } from "./StreamingText"

const mockUseSSEStream = vi.fn()

vi.mock("@/lib/sse", () => ({
  useSSEStream: (...args: unknown[]) => mockUseSSEStream(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUseSSEStream.mockReturnValue({ text: "", isDone: false, error: null })
})

describe("StreamingText", () => {
  it("renders nothing when url is null", () => {
    const { container } = render(<StreamingText url={null} />)
    expect(container.innerHTML).toBe("")
  })

  it("passes url to useSSEStream", () => {
    render(<StreamingText url="http://test/stream" />)
    expect(mockUseSSEStream).toHaveBeenCalledWith("http://test/stream")
  })

  it("renders streamed text with blinking cursor while streaming", () => {
    mockUseSSEStream.mockReturnValue({
      text: "Analyzing your entry",
      isDone: false,
      error: null,
    })

    render(<StreamingText url="http://test/stream" />)

    expect(screen.getByText(/analyzing your entry/i)).toBeInTheDocument()
    // Cursor element should be present (the animate-pulse span)
    const paragraph = screen.getByText(/analyzing your entry/i)
    const cursor = paragraph.querySelector("span.animate-pulse")
    expect(cursor).toBeInTheDocument()
  })

  it("hides cursor when streaming is done", () => {
    mockUseSSEStream.mockReturnValue({
      text: "Complete analysis output",
      isDone: true,
      error: null,
    })

    render(<StreamingText url="http://test/stream" />)

    expect(screen.getByText(/complete analysis output/i)).toBeInTheDocument()
    const paragraph = screen.getByText(/complete analysis output/i)
    const cursor = paragraph.querySelector("span.animate-pulse")
    expect(cursor).toBeNull()
  })

  it("calls onDone when stream completes", () => {
    const onDone = vi.fn()
    mockUseSSEStream.mockReturnValue({
      text: "Final text",
      isDone: true,
      error: null,
    })

    render(<StreamingText url="http://test/stream" onDone={onDone} />)

    expect(onDone).toHaveBeenCalledWith("Final text")
  })

  it("does not call onDone when text is empty", () => {
    const onDone = vi.fn()
    mockUseSSEStream.mockReturnValue({
      text: "",
      isDone: true,
      error: null,
    })

    render(<StreamingText url="http://test/stream" onDone={onDone} />)

    expect(onDone).not.toHaveBeenCalled()
  })

  it("renders error message on stream error", () => {
    mockUseSSEStream.mockReturnValue({
      text: "",
      isDone: false,
      error: "Connection lost",
    })

    render(<StreamingText url="http://test/stream" />)

    expect(screen.getByText(/error: connection lost/i)).toBeInTheDocument()
  })

  it("calls onError when stream errors", () => {
    const onError = vi.fn()
    mockUseSSEStream.mockReturnValue({
      text: "",
      isDone: false,
      error: "Timeout",
    })

    render(<StreamingText url="http://test/stream" onError={onError} />)

    expect(onError).toHaveBeenCalledWith("Timeout")
  })

  it("applies custom className", () => {
    mockUseSSEStream.mockReturnValue({
      text: "text",
      isDone: false,
      error: null,
    })

    render(<StreamingText url="http://test/stream" className="custom-class" />)

    const el = screen.getByText("text")
    expect(el.className).toContain("custom-class")
  })
})
