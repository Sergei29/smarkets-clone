import { describe, expect, it } from "vitest"
import { buildEventViewModel } from "./buildEventViewModel"
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

describe("buildEventViewModel", () => {
  it("composes every given market with its ordered contracts", () => {
    const markets = [
      market({ id: "10", display_order: 1 }),
      market({ id: "20", name: "Total Goals", display_order: 2 }),
    ]
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
      contract({ id: "201", market_id: "20", name: "Over 2.5" }),
    ]

    const viewModel = buildEventViewModel(event, markets, contracts)

    expect(viewModel).toEqual({
      id: "1",
      name: "Arsenal vs Chelsea",
      state: "live",
      startDatetime: "2026-08-01T14:00:00Z",
      markets: [
        {
          id: "10",
          name: "Match Odds",
          contracts: [
            { id: "101", name: "Arsenal" },
            { id: "102", name: "Chelsea" },
          ],
        },
        {
          id: "20",
          name: "Total Goals",
          contracts: [{ id: "201", name: "Over 2.5" }],
        },
      ],
    })
  })

  it("returns an empty markets array when none are given", () => {
    const viewModel = buildEventViewModel(event, [], [])
    expect(viewModel.markets).toEqual([])
  })

  it("gives a market an empty contracts array when none match its id", () => {
    const viewModel = buildEventViewModel(event, [market({ id: "10" })], [])
    expect(viewModel.markets[0].contracts).toEqual([])
  })
})
