import "server-only"

import type { SmarketsMarket } from "@/types"
import { smarketsFetch } from "./smarketsClient"
import { marketsResponseSchema } from "./schemas"
import { buildIdPath, ID_LIMITS } from "./idPath"

/** GET /v3/events/{event_ids}/markets/ — batched by event id (simple-style path). */
export const getMarketsByEventIds = async (
  eventIds: ReadonlyArray<string>,
): Promise<SmarketsMarket[]> => {
  const path = buildIdPath(eventIds, ID_LIMITS.events)
  const { markets } = await smarketsFetch(`/v3/events/${path}/markets/`, {
    schema: marketsResponseSchema,
  })
  return markets
}
