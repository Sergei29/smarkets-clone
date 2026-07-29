import { describe, expect, it } from "vitest"
import { selectDisplayableMarkets } from "./selectDisplayableMarkets"
import type { SmarketsMarket } from "@/types"

const baseMarket: SmarketsMarket = {
  id: "1",
  name: "Market",
  event_id: "100",
  slug: "market",
  market_type: null,
  state: "live",
  display_order: null,
  hidden: false,
}

const market = (overrides: Partial<SmarketsMarket>): SmarketsMarket => ({
  ...baseMarket,
  ...overrides,
})

describe("selectDisplayableMarkets", () => {
  it("returns every live/open, non-hidden market for the event, ordered by display order", () => {
    const markets = [
      market({ id: "1", event_id: "100", state: "settled" }),
      market({ id: "2", event_id: "100", state: "live", display_order: 2 }),
      market({ id: "3", event_id: "100", state: "open", display_order: 1 }),
      market({ id: "4", event_id: "200", state: "live", display_order: 0 }),
    ]

    expect(selectDisplayableMarkets(markets, "100").map((m) => m.id)).toEqual([
      "3",
      "2",
    ])
  })

  it("excludes hidden markets", () => {
    const markets = [
      market({ id: "1", event_id: "100", state: "live", hidden: true }),
    ]
    expect(selectDisplayableMarkets(markets, "100")).toEqual([])
  })

  it("returns an empty array when no market matches the event", () => {
    const markets = [market({ id: "1", event_id: "999" })]
    expect(selectDisplayableMarkets(markets, "100")).toEqual([])
  })
})
