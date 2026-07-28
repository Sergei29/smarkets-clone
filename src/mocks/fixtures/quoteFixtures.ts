import type { QuotesResponse } from "@/types"

/**
 * Quote fixtures keyed by contract ID (matching contractFixtures). `price` is in
 * percentage basis points — decimal odds = 10_000 / price (5000 → 2.0).
 *
 * `quoteFixtures` is the first poll; `quoteFixturesUpdated` is a later poll with
 * moved prices, for the sequential quote-handler factory and polling tests.
 * `quoteFixturesUpdated` also omits contract "3007" to exercise the missing-quote
 * (em-dash) fallback.
 */

export const quoteFixtures: QuotesResponse = {
  "3001": {
    bids: [{ price: 4950, quantity: 12000 }],
    offers: [{ price: 5050, quantity: 8000 }],
  },
  "3002": {
    bids: [{ price: 2800, quantity: 5000 }],
    offers: [{ price: 2900, quantity: 4500 }],
  },
  "3003": {
    bids: [{ price: 2450, quantity: 6000 }],
    offers: [{ price: 2550, quantity: 5200 }],
  },
  "3004": {
    bids: [{ price: 5400, quantity: 3000 }],
    offers: [{ price: 5600, quantity: 2800 }],
  },
  "3005": {
    bids: [{ price: 4400, quantity: 3100 }],
    offers: [{ price: 4600, quantity: 2900 }],
  },
  "3006": {
    bids: [{ price: 3300, quantity: 1500 }],
    offers: [{ price: 3450, quantity: 1400 }],
  },
  "3007": {
    bids: [{ price: 2000, quantity: 900 }],
    offers: [{ price: 2150, quantity: 850 }],
  },
}

export const quoteFixturesUpdated: QuotesResponse = {
  "3001": {
    bids: [{ price: 5050, quantity: 13500 }],
    offers: [{ price: 5150, quantity: 7600 }],
  },
  "3002": {
    bids: [{ price: 2750, quantity: 5300 }],
    offers: [{ price: 2850, quantity: 4700 }],
  },
  "3003": {
    bids: [{ price: 2400, quantity: 6400 }],
    offers: [{ price: 2500, quantity: 5000 }],
  },
  "3004": {
    bids: [{ price: 5300, quantity: 3200 }],
    offers: [{ price: 5500, quantity: 2600 }],
  },
  "3005": {
    bids: [{ price: 4500, quantity: 3000 }],
    offers: [{ price: 4700, quantity: 2750 }],
  },
  "3006": {
    bids: [{ price: 3400, quantity: 1600 }],
    offers: [{ price: 3550, quantity: 1300 }],
  },
  // "3007" intentionally omitted → missing-quote fallback.
}
