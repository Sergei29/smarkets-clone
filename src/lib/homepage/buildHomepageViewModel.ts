import type {
  SmarketsEvent,
  SmarketsMarket,
  SmarketsContract,
  FeaturedEvent,
} from "@/types"
import { selectFeaturedMarket } from "./selectFeaturedMarket"
import { compareByDisplayOrder } from "./ordering"

/**
 * Pure composition: pre-selected featured events plus the full candidate
 * markets/contracts → the homepage view model (one primary market and its
 * ordered contracts per event). No network calls, so this is unit-testable
 * against fixtures in isolation from fetching.
 */
export const buildHomepageViewModel = (
  featuredEvents: ReadonlyArray<SmarketsEvent>,
  markets: ReadonlyArray<SmarketsMarket>,
  contracts: ReadonlyArray<SmarketsContract>,
): FeaturedEvent[] =>
  featuredEvents.map((event) => {
    const market = selectFeaturedMarket(markets, event.id)
    const marketContracts = market
      ? contracts
          .filter((contract) => contract.market_id === market.id)
          .toSorted(compareByDisplayOrder)
      : []

    return {
      id: event.id,
      name: event.name,
      state: event.state,
      startDatetime: event.start_datetime,
      market: market
        ? {
            id: market.id,
            name: market.name,
            contracts: marketContracts.map((contract) => ({
              id: contract.id,
              name: contract.name,
            })),
          }
        : null,
    }
  })
