import { describe, expect, it } from "vitest"
import { selectFeaturedMarket } from "./selectFeaturedMarket"
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

describe("selectFeaturedMarket", () => {
  it("picks the first live/open, non-hidden market for the given event", () => {
    const markets = [
      market({ id: "1", event_id: "100", state: "settled" }),
      market({ id: "2", event_id: "100", state: "live", display_order: 2 }),
      market({ id: "3", event_id: "100", state: "open", display_order: 1 }),
      market({ id: "4", event_id: "200", state: "live", display_order: 0 }),
    ]

    expect(selectFeaturedMarket(markets, "100")?.id).toBe("3")
  })

  it("excludes hidden markets", () => {
    const markets = [
      market({ id: "1", event_id: "100", state: "live", hidden: true }),
    ]
    expect(selectFeaturedMarket(markets, "100")).toBeUndefined()
  })

  it("returns undefined when no market matches the event", () => {
    const markets = [market({ id: "1", event_id: "999" })]
    expect(selectFeaturedMarket(markets, "100")).toBeUndefined()
  })
})
