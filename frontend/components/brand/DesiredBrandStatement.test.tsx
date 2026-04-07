import { render, screen } from "@testing-library/react"
import { createElement } from "react"
import { describe, it, expect, vi } from "vitest"
import type { DesiredBrandStatement as DesiredBrandStatementType } from "@/types"
import { DesiredBrandStatement } from "./DesiredBrandStatement"

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

const STATEMENT_FIXTURE: DesiredBrandStatementType = {
  id: 1,
  legacy_words: ["visionary", "empathetic", "relentless"],
  desired_description:
    "You want to be known as a visionary engineer who makes complex systems accessible.",
  reverse_engineered_actions: [
    "Publish 4 technical articles",
    "Mentor 2 junior engineers",
    "Give a talk at a local meetup",
  ],
  computed_at: "2026-04-01T10:00:00Z",
  version: 2,
}

describe("DesiredBrandStatement", () => {
  it("renders the desired description prominently", () => {
    render(<DesiredBrandStatement statement={STATEMENT_FIXTURE} />)

    expect(
      screen.getByText(/visionary engineer who makes complex systems/i)
    ).toBeInTheDocument()
  })

  it("renders the heading", () => {
    render(<DesiredBrandStatement statement={STATEMENT_FIXTURE} />)

    expect(screen.getByText("Your Desired Brand")).toBeInTheDocument()
  })

  it("renders all legacy words as pills", () => {
    render(<DesiredBrandStatement statement={STATEMENT_FIXTURE} />)

    expect(screen.getByText("visionary")).toBeInTheDocument()
    expect(screen.getByText("empathetic")).toBeInTheDocument()
    expect(screen.getByText("relentless")).toBeInTheDocument()
  })

  it("renders quarterly actions", () => {
    render(<DesiredBrandStatement statement={STATEMENT_FIXTURE} />)

    expect(screen.getByText("Quarterly Actions")).toBeInTheDocument()
    expect(screen.getByText("Publish 4 technical articles")).toBeInTheDocument()
    expect(screen.getByText("Mentor 2 junior engineers")).toBeInTheDocument()
    expect(
      screen.getByText("Give a talk at a local meetup")
    ).toBeInTheDocument()
  })

  it("renders version and date", () => {
    render(<DesiredBrandStatement statement={STATEMENT_FIXTURE} />)

    expect(screen.getByText(/version 2/i)).toBeInTheDocument()
    expect(screen.getByText(/generated/i)).toBeInTheDocument()
  })

  it("renders Redo exercise link pointing to /onboarding", () => {
    render(<DesiredBrandStatement statement={STATEMENT_FIXTURE} />)

    const link = screen.getByText("Redo exercise")
    expect(link).toBeInTheDocument()
    expect(link.closest("a")).toHaveAttribute("href", "/onboarding")
  })

  it("hides quarterly actions section when empty", () => {
    const noActions = { ...STATEMENT_FIXTURE, reverse_engineered_actions: [] }
    render(<DesiredBrandStatement statement={noActions} />)

    expect(screen.queryByText("Quarterly Actions")).toBeNull()
  })

  it("renders empty state when statement is null", () => {
    render(<DesiredBrandStatement statement={null} />)

    expect(screen.getByText("No brand statement yet.")).toBeInTheDocument()
    expect(screen.getByText("Start the legacy exercise")).toBeInTheDocument()
  })

  it("empty state links to /onboarding", () => {
    render(<DesiredBrandStatement statement={null} />)

    const link = screen.getByText("Start the legacy exercise")
    expect(link.closest("a")).toHaveAttribute("href", "/onboarding")
  })
})
