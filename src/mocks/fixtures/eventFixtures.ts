import type { SmarketsEvent } from "@/types"

/**
 * Representative, sanitised event fixtures. IDs are numeric strings (as the real
 * API returns) and are referenced by the market/contract/quote fixtures.
 */

export const liveFootballEvent = {
  id: "1001",
  name: "Arsenal vs Chelsea",
  short_name: "ARS v CHE",
  full_slug: "/football/england/premier-league/arsenal-vs-chelsea",
  state: "live",
  type: "football_match",
  start_datetime: "2026-07-28T14:00:00Z",
  display_order: 1,
  bettable: true,
  hidden: false,
} satisfies SmarketsEvent

export const upcomingRacingEvent = {
  id: "1002",
  name: "14:30 Ascot",
  short_name: "Ascot 14:30",
  full_slug: "/horse-racing/uk/ascot/14-30",
  state: "upcoming",
  type: "horse_racing_race",
  start_datetime: "2026-07-28T14:30:00Z",
  display_order: 2,
  bettable: true,
  hidden: false,
} satisfies SmarketsEvent

export const eventFixtures: SmarketsEvent[] = [
  liveFootballEvent,
  upcomingRacingEvent,
]

export const eventsResponseFixture = { events: eventFixtures }
