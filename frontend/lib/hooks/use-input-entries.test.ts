import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createElement, type ReactNode } from "react"
import {
  useInputEntries,
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
} from "./use-input-entries"
import type { InputEntry } from "@/types"

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import api from "@/lib/api"

const mockedApi = vi.mocked(api)

const ENTRY_FIXTURE: InputEntry = {
  id: 1,
  mode: "journal",
  content: "Test content",
  context_tags: ["meeting"],
  emotion: "energized",
  alignment_score: null,
  created_at: "2026-04-01T10:00:00Z",
  updated_at: "2026-04-01T10:00:00Z",
  is_analyzed: false,
  analysis_id: null,
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useInputEntries", () => {
  it("fetches all entries when no mode is provided", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [ENTRY_FIXTURE] })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useInputEntries(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApi.get).toHaveBeenCalledWith("/api/v1/input", {
      params: { limit: 100 },
    })
    expect(result.current.data).toEqual([ENTRY_FIXTURE])
  })

  it("fetches entries filtered by mode", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [ENTRY_FIXTURE] })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useInputEntries("journal"), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApi.get).toHaveBeenCalledWith("/api/v1/input", {
      params: { limit: 100, mode: "journal" },
    })
  })

  it("uses different query keys for different modes", () => {
    mockedApi.get.mockResolvedValue({ data: [] })
    const { wrapper } = createWrapper()

    const { result: allResult } = renderHook(() => useInputEntries(), {
      wrapper,
    })
    const { result: journalResult } = renderHook(
      () => useInputEntries("journal"),
      { wrapper }
    )

    // They should be independent queries — both start loading
    expect(allResult.current.isLoading).toBe(true)
    expect(journalResult.current.isLoading).toBe(true)
    // Two separate calls
    expect(mockedApi.get).toHaveBeenCalledTimes(2)
  })

  it("handles fetch error", async () => {
    mockedApi.get.mockRejectedValueOnce(new Error("Network error"))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useInputEntries(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})

describe("useCreateEntry", () => {
  it("posts a new entry and invalidates cache", async () => {
    mockedApi.post.mockResolvedValueOnce({ data: ENTRY_FIXTURE })
    mockedApi.get.mockResolvedValue({ data: [] })
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useCreateEntry(), { wrapper })

    act(() => {
      result.current.mutate({
        mode: "journal",
        content: "Test content",
        context_tags: ["meeting"],
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApi.post).toHaveBeenCalledWith("/api/v1/input", {
      mode: "journal",
      content: "Test content",
      context_tags: ["meeting"],
    })
    expect(result.current.data).toEqual(ENTRY_FIXTURE)
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["input-entries"],
    })
  })

  it("handles creation error", async () => {
    mockedApi.post.mockRejectedValueOnce(new Error("Server error"))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useCreateEntry(), { wrapper })

    act(() => {
      result.current.mutate({ mode: "pulse", content: "test" })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe("useUpdateEntry", () => {
  it("puts updated fields and invalidates cache", async () => {
    const updated = { ...ENTRY_FIXTURE, content: "Updated content" }
    mockedApi.put.mockResolvedValueOnce({ data: updated })
    mockedApi.get.mockResolvedValue({ data: [] })
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useUpdateEntry(), { wrapper })

    act(() => {
      result.current.mutate({ id: 1, content: "Updated content" })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApi.put).toHaveBeenCalledWith("/api/v1/input/1", {
      content: "Updated content",
    })
    expect(result.current.data).toEqual(updated)
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["input-entries"],
    })
  })

  it("separates id from payload", async () => {
    mockedApi.put.mockResolvedValueOnce({ data: ENTRY_FIXTURE })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateEntry(), { wrapper })

    act(() => {
      result.current.mutate({
        id: 42,
        content: "new",
        context_tags: ["1:1"],
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApi.put).toHaveBeenCalledWith("/api/v1/input/42", {
      content: "new",
      context_tags: ["1:1"],
    })
  })
})

describe("useDeleteEntry", () => {
  it("deletes by id and invalidates cache", async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: { deleted: true } })
    mockedApi.get.mockResolvedValue({ data: [] })
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useDeleteEntry(), { wrapper })

    act(() => {
      result.current.mutate(5)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApi.delete).toHaveBeenCalledWith("/api/v1/input/5")
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["input-entries"],
    })
  })

  it("handles deletion error", async () => {
    mockedApi.delete.mockRejectedValueOnce(new Error("Not found"))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDeleteEntry(), { wrapper })

    act(() => {
      result.current.mutate(999)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
