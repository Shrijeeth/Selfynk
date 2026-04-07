import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createElement, type ReactNode } from "react"
import { useAnalysis, useInvalidateAnalysis } from "./use-analysis"
import type { Analysis } from "@/types"

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
  },
}))

import api from "@/lib/api"

const mockedApi = vi.mocked(api)

const ANALYSIS_FIXTURE: Analysis = {
  id: 1,
  entry_id: 10,
  themes: ["leadership"],
  skills_detected: ["communication"],
  values_detected: ["transparency"],
  tone: "leader",
  perception_signals: ["decisive"],
  raw_output: "{}",
  created_at: "2026-04-01T10:00:00Z",
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    queryClient,
    wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      )
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useAnalysis", () => {
  it("fetches analysis when entryId is provided", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: ANALYSIS_FIXTURE })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useAnalysis(10), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApi.get).toHaveBeenCalledWith("/api/v1/analysis/10")
    expect(result.current.data).toEqual(ANALYSIS_FIXTURE)
  })

  it("does not fetch when entryId is null", () => {
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useAnalysis(null), { wrapper })

    expect(result.current.isFetching).toBe(false)
    expect(mockedApi.get).not.toHaveBeenCalled()
  })

  it("handles fetch error", async () => {
    mockedApi.get.mockRejectedValueOnce(new Error("Not found"))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useAnalysis(99), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })
})

describe("useInvalidateAnalysis", () => {
  it("invalidates the analysis query for a given entryId", async () => {
    mockedApi.get.mockResolvedValue({ data: ANALYSIS_FIXTURE })
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result: analysisResult } = renderHook(() => useAnalysis(10), {
      wrapper,
    })
    await waitFor(() => expect(analysisResult.current.isSuccess).toBe(true))

    const { result: invalidateResult } = renderHook(
      () => useInvalidateAnalysis(),
      { wrapper }
    )

    act(() => {
      invalidateResult.current(10)
    })

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["analysis", 10],
    })
  })
})
