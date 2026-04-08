import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createElement } from "react"
import { describe, it, expect, vi } from "vitest"
import type { BrandDNA, DesiredBrandStatement } from "@/types"
import { BrandGapCard } from "./BrandGapCard"

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

const BRAND_DNA: BrandDNA = {
  id: 1,
  positioning: "Technical leader in distributed systems",
  niche: "Backend infrastructure",
  voice: "expert",
  strengths: ["system design", "mentoring"],
  content_pillars: ["engineering culture"],
  credibility_score: 78,
  gap_summary: "Strong on technical depth, needs more public visibility.",
  entries_analyzed: 15,
  computed_at: "2026-04-01T10:00:00Z",
}

const DESIRED_BRAND: DesiredBrandStatement = {
  id: 1,
  legacy_words: ["visionary", "empathetic", "relentless"],
  desired_description: "You want to be known as a visionary engineer.",
  reverse_engineered_actions: ["Publish articles"],
  computed_at: "2026-04-01T10:00:00Z",
  version: 1,
}

describe("BrandGapCard", () => {
  it("renders heading", () => {
    render(
      <BrandGapCard
        currentBrand={null}
        desiredBrand={null}
        onRecompute={vi.fn()}
      />
    )
    expect(screen.getByText("Brand Gap")).toBeInTheDocument()
  })

  it("renders current brand when provided", () => {
    render(
      <BrandGapCard
        currentBrand={BRAND_DNA}
        desiredBrand={null}
        onRecompute={vi.fn()}
      />
    )
    expect(
      screen.getByText("Technical leader in distributed systems")
    ).toBeInTheDocument()
    expect(screen.getByText(/15 entries/)).toBeInTheDocument()
  })

  it("renders desired brand when provided", () => {
    render(
      <BrandGapCard
        currentBrand={null}
        desiredBrand={DESIRED_BRAND}
        onRecompute={vi.fn()}
      />
    )
    expect(
      screen.getByText("You want to be known as a visionary engineer.")
    ).toBeInTheDocument()
    expect(screen.getByText("visionary")).toBeInTheDocument()
    expect(screen.getByText("empathetic")).toBeInTheDocument()
  })

  it("shows empty state for current brand with CTA", () => {
    render(
      <BrandGapCard
        currentBrand={null}
        desiredBrand={DESIRED_BRAND}
        onRecompute={vi.fn()}
      />
    )
    expect(screen.getByText("No brand DNA yet.")).toBeInTheDocument()
    const link = screen.getByText("Start capturing")
    expect(link.closest("a")).toHaveAttribute("href", "/capture")
  })

  it("shows empty state for desired brand with CTA", () => {
    render(
      <BrandGapCard
        currentBrand={BRAND_DNA}
        desiredBrand={null}
        onRecompute={vi.fn()}
      />
    )
    expect(screen.getByText("No desired brand set.")).toBeInTheDocument()
    const link = screen.getByText("Complete onboarding")
    expect(link.closest("a")).toHaveAttribute("href", "/onboarding")
  })

  it("renders gap summary when available", () => {
    render(
      <BrandGapCard
        currentBrand={BRAND_DNA}
        desiredBrand={DESIRED_BRAND}
        onRecompute={vi.fn()}
      />
    )
    expect(screen.getByText("Gap Analysis")).toBeInTheDocument()
    expect(screen.getByText(/strong on technical depth/i)).toBeInTheDocument()
  })

  it("hides gap summary when not available", () => {
    const noGap = { ...BRAND_DNA, gap_summary: null }
    render(
      <BrandGapCard
        currentBrand={noGap}
        desiredBrand={DESIRED_BRAND}
        onRecompute={vi.fn()}
      />
    )
    expect(screen.queryByText("Gap Analysis")).toBeNull()
  })

  it("shows Recompute button when currentBrand exists", () => {
    render(
      <BrandGapCard
        currentBrand={BRAND_DNA}
        desiredBrand={DESIRED_BRAND}
        onRecompute={vi.fn()}
      />
    )
    expect(
      screen.getByRole("button", { name: /recompute/i })
    ).toBeInTheDocument()
  })

  it("hides Recompute button when no currentBrand", () => {
    render(
      <BrandGapCard
        currentBrand={null}
        desiredBrand={null}
        onRecompute={vi.fn()}
      />
    )
    expect(screen.queryByRole("button", { name: /recompute/i })).toBeNull()
  })

  it("calls onRecompute when button clicked", async () => {
    const user = userEvent.setup()
    const onRecompute = vi.fn()
    render(
      <BrandGapCard
        currentBrand={BRAND_DNA}
        desiredBrand={DESIRED_BRAND}
        onRecompute={onRecompute}
      />
    )
    await user.click(screen.getByRole("button", { name: /recompute/i }))
    expect(onRecompute).toHaveBeenCalledOnce()
  })
})
