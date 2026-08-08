import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import { renderWithProviders } from "@/test/renderWithProviders"
import QuotesProvider from "@/providers/QuotesProvider"
import type { FeaturedMarket } from "@/types"
import MarketCard from "./MarketCard"

const matchOdds: FeaturedMarket = {
  id: "2001",
  name: "Match Odds",
  contracts: [
    { id: "3001", name: "Arsenal" },
    { id: "3002", name: "Draw" },
  ],
}

const renderMarketCard = (market: FeaturedMarket) =>
  renderWithProviders(
    <QuotesProvider marketIds={[market.id]}>
      <MarketCard market={market} />
    </QuotesProvider>,
  )

describe("MarketCard", () => {
  it("renders the market name and its ordered contracts", () => {
    renderMarketCard(matchOdds)

    expect(screen.getByText("Match Odds")).toBeInTheDocument()
    expect(screen.getByText("Arsenal")).toBeInTheDocument()
    expect(screen.getByText("Draw")).toBeInTheDocument()
  })

  it("renders each contract's live prices once resolved", async () => {
    renderMarketCard(matchOdds)

    await waitFor(() =>
      expect(screen.getByLabelText("Arsenal bid")).toHaveTextContent("B 2.02"),
    )
  })

  it("renders an empty contracts list without error when the market has none", () => {
    renderMarketCard({ ...matchOdds, contracts: [] })
    expect(screen.getByLabelText("Match Odds contracts").children).toHaveLength(
      0,
    )
  })
})
