import type { SmarketsMarket } from "@/types"
import { liveFootballEvent, upcomingRacingEvent } from "./eventFixtures"

/** Markets keyed to the event fixtures. Semantics are in `market_type.name`. */

export const matchOddsMarket = {
  id: "2001",
  name: "Match Odds",
  event_id: liveFootballEvent.id,
  slug: "match-odds",
  market_type: { name: "winner_3_way" },
  state: "live",
  display_order: 1,
  hidden: false,
} satisfies SmarketsMarket

export const totalGoalsMarket = {
  id: "2002",
  name: "Over/Under 2.5 Goals",
  event_id: liveFootballEvent.id,
  slug: "over-under-2-5-goals",
  market_type: { name: "totals", param: "2.5" },
  state: "open",
  display_order: 2,
  hidden: false,
} satisfies SmarketsMarket

export const raceWinnerMarket = {
  id: "2003",
  name: "Race Winner",
  event_id: upcomingRacingEvent.id,
  slug: "race-winner",
  market_type: { name: "winner" },
  state: "open",
  display_order: 1,
  hidden: false,
} satisfies SmarketsMarket

export const marketFixtures: SmarketsMarket[] = [
  matchOddsMarket,
  totalGoalsMarket,
  raceWinnerMarket,
]

export const marketsResponseFixture = { markets: marketFixtures }
