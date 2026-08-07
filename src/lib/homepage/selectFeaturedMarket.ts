import type { SmarketsMarket } from "@/types"
import { compareByDisplayOrder } from "./ordering"

const FEATURABLE_MARKET_STATES = new Set(["live", "open"])

/**
 * Deterministic primary-market selection for one event: visible, live/open
 * markets for that event, ordered by `display_order` then numeric id — the
 * first is the homepage's featured market. `market_type` identifies market
 * semantics for callers but isn't a selection criterion: there's no single
 * "correct" market type across sports (football vs. horse racing).
 */
export const selectFeaturedMarket = (
  markets: ReadonlyArray<SmarketsMarket>,
  eventId: string,
): SmarketsMarket | undefined =>
  markets
    .filter(
      (market) =>
        market.event_id === eventId &&
        !market.hidden &&
        FEATURABLE_MARKET_STATES.has(market.state),
    )
    .toSorted(compareByDisplayOrder)[0]
