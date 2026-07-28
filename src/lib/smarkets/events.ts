import "server-only"

import type { SmarketsEvent } from "@/types"
import { smarketsFetch } from "./smarketsClient"
import { eventsResponseSchema } from "./schemas"

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
