import type { QuoteBook } from "@/types"

const EM_DASH = "—"

/** `price` is percentage basis points; 5000 → 2.00 decimal odds. */
export const toDecimalOdds = (price: number): number => 10_000 / price

/** Best bid = highest price a buyer is currently willing to pay. */
export const bestBidPrice = (book: QuoteBook | undefined): number | null =>
  book && book.bids.length > 0
    ? Math.max(...book.bids.map((level) => level.price))
    : null

/** Best offer = lowest price a seller is currently willing to accept. */
export const bestOfferPrice = (book: QuoteBook | undefined): number | null =>
  book && book.offers.length > 0
    ? Math.min(...book.offers.map((level) => level.price))
    : null

/** Formats a basis-point price as decimal odds, or an em dash when absent. */
export const formatDecimalOdds = (price: number | null): string =>
  price === null ? EM_DASH : toDecimalOdds(price).toFixed(2)
