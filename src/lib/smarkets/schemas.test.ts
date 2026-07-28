import { describe, expect, it } from "vitest"
import {
  contractsResponseSchema,
  eventsResponseSchema,
  marketsResponseSchema,
  quotesResponseSchema,
} from "./schemas"
import { eventsResponseFixture } from "@/mocks/fixtures/eventFixtures"
import { marketsResponseFixture } from "@/mocks/fixtures/marketFixtures"
import { contractsResponseFixture } from "@/mocks/fixtures/contractFixtures"
import { quoteFixtures } from "@/mocks/fixtures/quoteFixtures"

describe("eventsResponseSchema", () => {
  it("parses a valid events payload", () => {
    expect(eventsResponseSchema.safeParse(eventsResponseFixture).success).toBe(
      true,
    )
  })

  it("rejects a payload missing a required field", () => {
    const malformed = { events: [{ id: "1" }] }
    expect(eventsResponseSchema.safeParse(malformed).success).toBe(false)
  })

  it("rejects a payload with the wrong shape entirely", () => {
    expect(
      eventsResponseSchema.safeParse({ events: "not-an-array" }).success,
    ).toBe(false)
  })
})

describe("marketsResponseSchema", () => {
  it("parses a valid markets payload", () => {
    expect(
      marketsResponseSchema.safeParse(marketsResponseFixture).success,
    ).toBe(true)
  })

  it("rejects a market missing its event_id", () => {
    const malformed = {
      markets: [{ id: "1", name: "Market", slug: "market", state: "live" }],
    }
    expect(marketsResponseSchema.safeParse(malformed).success).toBe(false)
  })
})

describe("contractsResponseSchema", () => {
  it("parses a valid contracts payload", () => {
    expect(
      contractsResponseSchema.safeParse(contractsResponseFixture).success,
    ).toBe(true)
  })

  it("rejects a contract missing its market_id", () => {
    const malformed = {
      contracts: [{ id: "1", name: "Contract", slug: "contract" }],
    }
    expect(contractsResponseSchema.safeParse(malformed).success).toBe(false)
  })
})

describe("quotesResponseSchema", () => {
  it("parses a valid quotes payload keyed by contract id", () => {
    expect(quotesResponseSchema.safeParse(quoteFixtures).success).toBe(true)
  })

  it("rejects a quote book whose bids are not an array", () => {
    const malformed = { "3001": { bids: "not-an-array", offers: [] } }
    expect(quotesResponseSchema.safeParse(malformed).success).toBe(false)
  })

  it("rejects a price level with a non-integer price", () => {
    const malformed = {
      "3001": { bids: [{ price: 49.5, quantity: 1 }], offers: [] },
    }
    expect(quotesResponseSchema.safeParse(malformed).success).toBe(false)
  })
})
