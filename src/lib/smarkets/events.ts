import "server-only"

import type { SmarketsEvent } from "@/types"
import { smarketsFetch } from "./smarketsClient"
import { eventsResponseSchema } from "./schemas"
import { buildIdPath, ID_LIMITS } from "./idPath"

/**
 * GET /v3/events/ — homepage selection filters/limits the result further, but
 * the upstream defaults (`sort=id`, `limit=20`) are unusable for that: sorting
 * by ascending id surfaces the platform's oldest events, almost none of which
 * are still bettable. Request a `display_order`-first sort, a large-enough
 * candidate pool, and skip the "new" state (not upcoming/live yet) upstream.
 */
const EVENTS_QUERY = new URLSearchParams([
  ["state", "live"],
  ["state", "upcoming"],
  ["sort", "display_order,start_datetime,id"],
  ["limit", "100"],
]).toString()

export const getEvents = async (): Promise<SmarketsEvent[]> => {
  const { events } = await smarketsFetch(`/v3/events/?${EVENTS_QUERY}`, {
    schema: eventsResponseSchema,
  })
  return events
}

/**
 * GET /v3/events/{event_ids}/ for a single event id. The spec documents only a
 * `200` response for this operation — an unknown id isn't a `404`, it just
 * comes back filtered out of `events` — so "not found" is `events[0] ===
 * undefined`, not a caught error (see README "API contract verification").
 */
export const getEventById = async (
  eventId: string,
): Promise<SmarketsEvent | undefined> => {
  const path = buildIdPath([eventId], ID_LIMITS.events)
  const { events } = await smarketsFetch(`/v3/events/${path}/`, {
    schema: eventsResponseSchema,
  })
  return events[0]
}
