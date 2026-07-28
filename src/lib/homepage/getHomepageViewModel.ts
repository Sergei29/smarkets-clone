import "server-only"

import type { FeaturedEvent } from "@/types"
import { getEvents } from "@/lib/smarkets/events"
import { getMarketsByEventIds } from "@/lib/smarkets/markets"
import { getContractsByMarketIds } from "@/lib/smarkets/contracts"
import { selectFeaturedEvents, HOMEPAGE_EVENT_LIMIT } from "./selectFeaturedEvents"
import { selectFeaturedMarket } from "./selectFeaturedMarket"
import { buildHomepageViewModel } from "./buildHomepageViewModel"

/**
 * Server-only homepage data flow (TASK.md "Homepage server flow"): events →
 * featured events → batched markets for those events → one featured market
 * per event → batched contracts for the selected markets → view model.
 * Quotes are deliberately out of scope here — the client polls them
 * separately once the initial cards are rendered.
 */
export const getHomepageViewModel = async (): Promise<FeaturedEvent[]> => {
  const events = await getEvents()
  const featuredEvents = selectFeaturedEvents(events, HOMEPAGE_EVENT_LIMIT)
  if (featuredEvents.length === 0) return []

  const markets = await getMarketsByEventIds(
    featuredEvents.map((event) => event.id),
  )
  const marketIds = featuredEvents
    .map((event) => selectFeaturedMarket(markets, event.id)?.id)
    .filter((id): id is string => id !== undefined)

  const contracts =
    marketIds.length > 0 ? await getContractsByMarketIds(marketIds) : []

  return buildHomepageViewModel(featuredEvents, markets, contracts)
}
