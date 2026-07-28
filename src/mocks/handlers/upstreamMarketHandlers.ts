import { http, HttpResponse } from "msw"
import { marketFixtures } from "../fixtures/marketFixtures"

const BASE = "https://api.smarkets.com"

/**
 * Filters by requested event IDs. "Event with no markets" falls out naturally
 * from requesting an event ID absent from `marketFixtures` — no dedicated
 * empty handler needed.
 */
export const upstreamMarketHandlers = [
  http.get(`${BASE}/v3/events/:eventIds/markets/`, ({ params }) => {
    const eventIds = String(params.eventIds).split(",")
    const markets = marketFixtures.filter((market) =>
      eventIds.includes(market.event_id),
    )
    return HttpResponse.json({ markets }, { status: 200 })
  }),
]
