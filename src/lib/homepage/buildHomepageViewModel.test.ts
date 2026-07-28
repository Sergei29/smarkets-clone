import { describe, expect, it } from "vitest"
import { buildHomepageViewModel } from "./buildHomepageViewModel"
import type { SmarketsContract, SmarketsEvent, SmarketsMarket } from "@/types"

const event: SmarketsEvent = {
  id: "1",
  name: "Arsenal vs Chelsea",
  short_name: null,
  full_slug: "/event",
  state: "live",
  type: "football_match",
  start_datetime: "2026-08-01T14:00:00Z",
  display_order: 1,
  bettable: true,
  hidden: false,
}

const market = (overrides: Partial<SmarketsMarket>): SmarketsMarket => ({
  id: "10",
  name: "Match Odds",
  event_id: "1",
  slug: "match-odds",
  market_type: null,
  state: "live",
  display_order: 1,
  hidden: false,
  ...overrides,
})

const contract = (overrides: Partial<SmarketsContract>): SmarketsContract => ({
  id: "100",
  market_id: "10",
  name: "Arsenal",
  slug: "arsenal",
  contract_type: null,
  display_order: 1,
  ...overrides,
})

describe("buildHomepageViewModel", () => {
  it("composes one featured market and its ordered contracts per event", () => {
    const markets = [market({ id: "10" }), market({ id: "20", hidden: true })]
    const contracts = [
      contract({
        id: "102",
        market_id: "10",
        name: "Chelsea",
        display_order: 2,
      }),
      contract({
        id: "101",
        market_id: "10",
        name: "Arsenal",
        display_order: 1,
      }),
      contract({ id: "999", market_id: "20", name: "Other market" }),
    ]

    const [viewModel] = buildHomepageViewModel([event], markets, contracts)

    expect(viewModel).toEqual({
      id: "1",
      name: "Arsenal vs Chelsea",
      state: "live",
      startDatetime: "2026-08-01T14:00:00Z",
      market: {
        id: "10",
        name: "Match Odds",
        contracts: [
          { id: "101", name: "Arsenal" },
          { id: "102", name: "Chelsea" },
        ],
      },
    })
  })

  it("sets market to null and contracts to [] when the event has no featurable market", () => {
    const [viewModel] = buildHomepageViewModel(
      [event],
      [market({ id: "10", hidden: true })],
      [contract({ id: "101", market_id: "10" })],
    )

    expect(viewModel.market).toBeNull()
  })
})
