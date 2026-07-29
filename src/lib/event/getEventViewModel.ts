import "server-only"

import type { EventDetails } from "@/types"
import { getEventById } from "@/lib/smarkets/events"
import { getMarketsByEventIds } from "@/lib/smarkets/markets"
import { getContractsByMarketIds } from "@/lib/smarkets/contracts"
import { selectDisplayableMarkets } from "./selectDisplayableMarkets"
import { buildEventViewModel } from "./buildEventViewModel"

/**
 * Server-only event-page data flow (TASK.md "Event-page server flow"): event
 * and its markets are fetched concurrently, then contracts are fetched for
 * the selected displayable markets. Returns `undefined` when the event id
 * doesn't resolve to an event, so the caller can render a 404 — per the
 * spec, an unknown id isn't a thrown error (see `getEventById`).
 */
export const getEventViewModel = async (
  eventId: string,
): Promise<EventDetails | undefined> => {
  const [event, markets] = await Promise.all([
    getEventById(eventId),
    getMarketsByEventIds([eventId]),
  ])
  if (!event) return undefined

  const displayableMarkets = selectDisplayableMarkets(markets, eventId)
  const marketIds = displayableMarkets.map((market) => market.id)
  const contracts =
    marketIds.length > 0 ? await getContractsByMarketIds(marketIds) : []

  return buildEventViewModel(event, displayableMarkets, contracts)
}
