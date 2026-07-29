import type {
  SmarketsEvent,
  SmarketsMarket,
  SmarketsContract,
  EventDetails,
} from "@/types"
import { compareByDisplayOrder } from "@/lib/homepage/ordering"

/**
 * Pure composition: one event plus its already-selected displayable markets
 * and their candidate contracts → the event-page view model. No network
 * calls, so this is unit-testable against fixtures in isolation from fetching
 * (mirrors `buildHomepageViewModel`).
 */
export const buildEventViewModel = (
  event: SmarketsEvent,
  markets: ReadonlyArray<SmarketsMarket>,
  contracts: ReadonlyArray<SmarketsContract>,
): EventDetails => ({
  id: event.id,
  name: event.name,
  state: event.state,
  startDatetime: event.start_datetime,
  markets: markets.map((market) => ({
    id: market.id,
    name: market.name,
    contracts: contracts
      .filter((contract) => contract.market_id === market.id)
      .slice()
      .sort(compareByDisplayOrder)
      .map((contract) => ({ id: contract.id, name: contract.name })),
  })),
})
