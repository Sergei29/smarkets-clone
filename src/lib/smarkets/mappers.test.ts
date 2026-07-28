import { describe, expect, it } from "vitest"
import {
  bestBidPrice,
  bestOfferPrice,
  formatDecimalOdds,
  toDecimalOdds,
} from "./mappers"
import type { QuoteBook } from "@/types"

describe("toDecimalOdds", () => {
  it("converts percentage basis points to decimal odds", () => {
    expect(toDecimalOdds(5000)).toBe(2)
    expect(toDecimalOdds(2500)).toBe(4)
  })
})

describe("bestBidPrice", () => {
  it("returns the highest bid price", () => {
    const book: QuoteBook = {
      bids: [
        { price: 4950, quantity: 1 },
        { price: 5100, quantity: 1 },
        { price: 4800, quantity: 1 },
      ],
      offers: [],
    }
    expect(bestBidPrice(book)).toBe(5100)
  })

  it("returns null when there are no bids", () => {
    expect(bestBidPrice({ bids: [], offers: [] })).toBeNull()
  })

  it("returns null when the book is undefined", () => {
    expect(bestBidPrice(undefined)).toBeNull()
  })
})

describe("bestOfferPrice", () => {
  it("returns the lowest offer price", () => {
    const book: QuoteBook = {
      bids: [],
      offers: [
        { price: 5200, quantity: 1 },
        { price: 5050, quantity: 1 },
        { price: 5300, quantity: 1 },
      ],
    }
    expect(bestOfferPrice(book)).toBe(5050)
  })

  it("returns null when there are no offers", () => {
    expect(bestOfferPrice({ bids: [], offers: [] })).toBeNull()
  })

  it("returns null when the book is undefined", () => {
    expect(bestOfferPrice(undefined)).toBeNull()
  })
})

describe("formatDecimalOdds", () => {
  it("formats a price to two decimal places", () => {
    expect(formatDecimalOdds(5000)).toBe("2.00")
    expect(formatDecimalOdds(4950)).toBe("2.02")
  })

  it("renders an em dash when the price is null", () => {
    expect(formatDecimalOdds(null)).toBe("—")
  })
})
