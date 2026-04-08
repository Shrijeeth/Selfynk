import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, vi } from "vitest"
import { createElement, type ReactNode } from "react"
import DashboardPage from "./page"

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn().mockRejectedValue(new Error("not wired")),
  },
}))

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
  }) => createElement("a", { href, ...props }, children),
}))

vi.mock("@/components/brand/BrandGapCard", () => ({
  BrandGapCard: ({
    currentBrand,
    desiredBrand,
  }: {
    currentBrand: unknown
    desiredBrand: unknown
    onRecompute: () => void
  }) =>
    createElement(
      "div",
      { "data-testid": "brand-gap-card" },
      currentBrand ? "has-current" : "no-current",
      desiredBrand ? "has-desired" : "no-desired"
    ),
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

describe("DashboardPage", () => {
  it("renders the dashboard heading", () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText(/personal brand at a glance/i)).toBeInTheDocument()
  })

  it("renders the BrandGapCard", () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(screen.getByTestId("brand-gap-card")).toBeInTheDocument()
  })

  it("renders summary stat cards", () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(screen.getByText("Total entries")).toBeInTheDocument()
    expect(screen.getByText("Day streak")).toBeInTheDocument()
    expect(screen.getByText("Themes tracked")).toBeInTheDocument()
  })

  it("renders default stat values when no data", () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    const zeros = screen.getAllByText("0")
    expect(zeros.length).toBeGreaterThanOrEqual(3)
  })

  it("renders the daily pulse prompt", () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(screen.getByText("Daily Pulse Check-in")).toBeInTheDocument()
    expect(screen.getByText(/2-minute reflection/i)).toBeInTheDocument()
  })

  it("renders Capture now link pointing to /capture", () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    const link = screen.getByRole("link", { name: /capture now/i })
    expect(link).toHaveAttribute("href", "/capture")
  })
})
