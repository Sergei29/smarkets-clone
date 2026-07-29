import type { SmarketsMarket } from "@/types"
import { compareByDisplayOrder } from "@/lib/homepage/ordering"

const DISPLAYABLE_MARKET_STATES = new Set(["live", "open"])

/**
 * Event-page market selection: every visible, live/open market for the given
 * event, ordered by `display_order` then numeric id. Unlike the homepage's
 * `selectFeaturedMarket` (one market, for a compact card), the event page
 * shows the broader list, so this returns all matches instead of just the
 * first.
 */
export const selectDisplayableMarkets = (
  markets: ReadonlyArray<SmarketsMarket>,
  eventId: string,
): SmarketsMarket[] =>
  markets
    .filter(
      (market) =>
        market.event_id === eventId &&
        !market.hidden &&
        DISPLAYABLE_MARKET_STATES.has(market.state),
    )
    .slice()
    .sort(compareByDisplayOrder)
