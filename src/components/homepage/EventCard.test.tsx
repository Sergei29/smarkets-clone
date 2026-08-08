import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import { renderWithProviders } from "@/test/renderWithProviders"
import QuotesProvider from "@/providers/QuotesProvider"
import type { FeaturedEvent } from "@/types"
import EventCard from "./EventCard"

const liveEvent: FeaturedEvent = {
  id: "1001",
  name: "Arsenal vs Chelsea",
  state: "live",
  startDatetime: "2026-08-01T14:00:00Z",
  market: {
    id: "2001",
    name: "Match Odds",
    contracts: [
      { id: "3001", name: "Arsenal" },
      { id: "3002", name: "Draw" },
    ],
  },
}

const renderEventCard = (event: FeaturedEvent) =>
  renderWithProviders(
    <QuotesProvider marketIds={event.market ? [event.market.id] : []}>
      <EventCard event={event} />
    </QuotesProvider>,
  )

describe("EventCard", () => {
  it("renders the event name as a link to its event page", () => {
    renderEventCard(liveEvent)

    const link = screen.getByRole("link", { name: "Arsenal vs Chelsea" })
    expect(link).toHaveAttribute("href", "/events/1001")
  })

  it("shows a 'Live' badge for a live event and 'Upcoming' otherwise", () => {
    renderEventCard(liveEvent)
    expect(screen.getByText("Live")).toBeInTheDocument()

    renderEventCard({ ...liveEvent, id: "1002", state: "upcoming" })
    expect(screen.getByText("Upcoming")).toBeInTheDocument()
  })

  it("renders the start time as a machine-readable <time> element", () => {
    renderEventCard(liveEvent)
    const time = screen.getByText(
      new Date(liveEvent.startDatetime as string).toLocaleString(),
    )
    expect(time.tagName).toBe("TIME")
    expect(time).toHaveAttribute("dateTime", liveEvent.startDatetime)
  })

  it("renders the featured market's contracts with live prices once resolved", async () => {
    renderEventCard(liveEvent)

    expect(screen.getByText("Match Odds")).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByLabelText("Arsenal bid")).toHaveTextContent("B 2.02"),
    )
  })

  it("shows a fallback message when the event has no featured market", () => {
    renderEventCard({ ...liveEvent, market: null })
    expect(screen.getByText("No market available yet.")).toBeInTheDocument()
  })
})
