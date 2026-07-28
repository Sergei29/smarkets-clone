import { http, HttpResponse } from "msw"
import type { QuotesResponse } from "@/types"
import { contractFixtures } from "../fixtures/contractFixtures"
import { quoteFixtures, quoteFixturesUpdated } from "../fixtures/quoteFixtures"

const BASE = "https://api.smarkets.com"
const QUOTES_PATH = `${BASE}/v3/markets/:marketIds/quotes/`

const upstreamError = (
  error_type: string,
  status: number,
  data: unknown = {},
) => HttpResponse.json({ error_type, data }, { status })

/** Quotes are keyed by contract ID; filter a book down to one market's contracts. */
const quotesForMarkets = (
  book: QuotesResponse,
  marketIds: string[],
): QuotesResponse => {
  const contractIds = new Set(
    contractFixtures
      .filter((contract) => marketIds.includes(contract.market_id))
      .map((contract) => contract.id),
  )
  return Object.fromEntries(
    Object.entries(book).filter(([contractId]) => contractIds.has(contractId)),
  )
}

/** Baseline handler: always returns the first-poll fixture, filtered by market. */
export const upstreamQuoteHandlers = [
  http.get(QUOTES_PATH, ({ params }) => {
    const marketIds = String(params.marketIds).split(",")
    return HttpResponse.json(quotesForMarkets(quoteFixtures, marketIds), {
      status: 200,
    })
  }),
]

/**
 * Sequential quote handler factory for polling tests: the first request
 * returns `quoteFixtures`, every request after that returns
 * `quoteFixturesUpdated` (which omits contract "3007" to exercise the
 * missing-quote fallback). Call this per test via
 * `server.use(createSequentialQuotesHandler())` — each call creates a new
 * closure-scoped counter so state never leaks across tests.
 */
export const createSequentialQuotesHandler = () => {
  let callCount = 0
  return http.get(QUOTES_PATH, ({ params }) => {
    callCount += 1
    const marketIds = String(params.marketIds).split(",")
    const book = callCount === 1 ? quoteFixtures : quoteFixturesUpdated
    return HttpResponse.json(quotesForMarkets(book, marketIds), { status: 200 })
  })
}

/** Scenario: 429 rate limit — do not retry aggressively. */
export const quotesRateLimitedHandler = http.get(QUOTES_PATH, () =>
  upstreamError("RATE_LIMIT_EXCEEDED", 429),
)

/** Scenario: upstream quote service unavailable — retain stale prices. */
export const quotesUnavailableHandler = http.get(QUOTES_PATH, () =>
  upstreamError("SBK_PRICER_UNAVAILABLE", 503),
)

/** Scenario: malformed upstream payload (fails schema validation). */
export const malformedQuotesHandler = http.get(QUOTES_PATH, () =>
  HttpResponse.json(
    { "3001": { bids: "not-an-array", offers: [] } },
    { status: 200 },
  ),
)
