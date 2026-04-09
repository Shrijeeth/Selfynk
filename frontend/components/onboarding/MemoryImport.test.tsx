import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryImport } from "./MemoryImport"
import { useImportJobStore } from "@/store/import-job"

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
  },
}))

import api from "@/lib/api"

const mockedApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
  useImportJobStore.getState().reset()
})

describe("MemoryImport", () => {
  it("renders both tabs", () => {
    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByText("Upload file")).toBeInTheDocument()
    expect(screen.getByText("Paste text")).toBeInTheDocument()
  })

  it("renders upload zone by default", () => {
    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByText(/drop your export files/i)).toBeInTheDocument()
  })

  it("switches to paste tab", async () => {
    const user = userEvent.setup()
    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    await user.click(screen.getByText("Paste text"))

    expect(
      screen.getByPlaceholderText(/paste your ai conversation/i)
    ).toBeInTheDocument()
  })

  it("shows export instructions when toggled", async () => {
    const user = userEvent.setup()
    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    await user.click(screen.getByText("How to export your data"))

    expect(screen.getByText("ChatGPT")).toBeInTheDocument()
    expect(screen.getByText("Claude")).toBeInTheDocument()
    expect(screen.getByText(/data controls/i)).toBeInTheDocument()
  })

  it("shows paste tab helper text", async () => {
    const user = userEvent.setup()
    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    await user.click(screen.getByText("Paste text"))

    expect(
      screen.getByText(/write out everything you know about me/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/write out my memories verbatim/i)
    ).toBeInTheDocument()
  })

  it("Extract answers button disabled with no input", () => {
    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    expect(
      screen.getByRole("button", { name: /extract answers/i })
    ).toBeDisabled()
  })

  it("enables submit after pasting text", async () => {
    const user = userEvent.setup()
    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    await user.click(screen.getByText("Paste text"))
    await user.type(
      screen.getByPlaceholderText(/paste your ai/i),
      "my values are honesty"
    )

    expect(
      screen.getByRole("button", { name: /extract answers/i })
    ).toBeEnabled()
  })

  it("starts job on submit and stores job ID", async () => {
    const user = userEvent.setup()

    mockedApi.post.mockResolvedValueOnce({
      data: { job_id: "abc123", status: "pending" },
    })

    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    await user.click(screen.getByText("Paste text"))
    await user.type(
      screen.getByPlaceholderText(/paste your ai/i),
      "my conversations"
    )
    await user.click(screen.getByRole("button", { name: /extract answers/i }))

    expect(useImportJobStore.getState().jobId).toBe("abc123")
    expect(useImportJobStore.getState().status).toBe("pending")
  })

  it("shows background banner when job is active", async () => {
    const user = userEvent.setup()

    mockedApi.post.mockResolvedValueOnce({
      data: { job_id: "abc123", status: "pending" },
    })

    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    await user.click(screen.getByText("Paste text"))
    await user.type(
      screen.getByPlaceholderText(/paste your ai/i),
      "my conversations"
    )
    await user.click(screen.getByRole("button", { name: /extract answers/i }))

    expect(screen.getByText(/running in the background/i)).toBeInTheDocument()
  })

  it("calls onImport when store completes", () => {
    const onImport = vi.fn()

    // Pre-set store to completed state
    useImportJobStore.getState().startJob("test-job")
    useImportJobStore.getState().updateFromPoll({
      status: "completed",
      steps: [],
      current_step: 0,
      result: {
        answers: { q1: "bold", q2: "education" },
        confidence: { q1: "high", q2: "medium" },
      },
      error: null,
    })

    render(<MemoryImport onImport={onImport} onCancel={vi.fn()} />)

    expect(onImport).toHaveBeenCalledWith(
      { q1: "bold", q2: "education" },
      { q1: "high", q2: "medium" }
    )
  })

  it("shows error when store result has no answers", () => {
    useImportJobStore.getState().startJob("test-job")
    useImportJobStore.getState().updateFromPoll({
      status: "completed",
      steps: [],
      current_step: 0,
      result: {
        answers: { q1: "", q2: "" },
        confidence: {},
      },
      error: null,
    })

    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    expect(
      screen.getByText(/could not extract any answers/i)
    ).toBeInTheDocument()
  })

  it("shows error on API failure", async () => {
    const user = userEvent.setup()
    mockedApi.post.mockRejectedValueOnce(new Error("fail"))

    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    await user.click(screen.getByText("Paste text"))
    await user.type(screen.getByPlaceholderText(/paste your ai/i), "text")
    await user.click(screen.getByRole("button", { name: /extract answers/i }))

    expect(screen.getByText(/failed to start/i)).toBeInTheDocument()
  })

  it("shows file list after uploading multiple files", async () => {
    const user = userEvent.setup()
    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement

    const file1 = new File(["data1"], "chatgpt.json", {
      type: "application/json",
    })
    const file2 = new File(["data2"], "claude.jsonl", {
      type: "application/json",
    })

    await user.upload(input, [file1, file2])

    expect(screen.getByText("chatgpt.json")).toBeInTheDocument()
    expect(screen.getByText("claude.jsonl")).toBeInTheDocument()
  })

  it("removes a file from the list", async () => {
    const user = userEvent.setup()
    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement

    const file1 = new File(["data1"], "chatgpt.json", {
      type: "application/json",
    })
    const file2 = new File(["data2"], "claude.jsonl", {
      type: "application/json",
    })

    await user.upload(input, [file1, file2])

    await user.click(screen.getByRole("button", { name: /remove chatgpt/i }))

    expect(screen.queryByText("chatgpt.json")).toBeNull()
    expect(screen.getByText("claude.jsonl")).toBeInTheDocument()
  })

  it("sends multiple files in FormData on submit", async () => {
    const user = userEvent.setup()

    mockedApi.post.mockResolvedValueOnce({
      data: { job_id: "xyz", status: "pending" },
    })

    render(<MemoryImport onImport={vi.fn()} onCancel={vi.fn()} />)

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement

    const file1 = new File(["data1"], "chatgpt.json", {
      type: "application/json",
    })
    const file2 = new File(["data2"], "claude.jsonl", {
      type: "application/json",
    })

    await user.upload(input, [file1, file2])
    await user.click(screen.getByRole("button", { name: /extract answers/i }))

    const formData = mockedApi.post.mock.calls[0][1] as FormData
    const filesInForm = formData.getAll("files")
    expect(filesInForm).toHaveLength(2)
  })

  it("calls onCancel when Back is clicked", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<MemoryImport onImport={vi.fn()} onCancel={onCancel} />)

    await user.click(screen.getByRole("button", { name: "Back" }))

    expect(onCancel).toHaveBeenCalledOnce()
  })
})
