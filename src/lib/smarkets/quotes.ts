import "server-only"

import type { QuotesResponse } from "@/types"
import { smarketsFetch } from "./smarketsClient"
import { quotesResponseSchema } from "./schemas"
import { buildIdPath, ID_LIMITS } from "./idPath"

/**
 * GET /v3/markets/{market_ids}/quotes/ — batched by market id, up to 200.
 * `token` is optional (quotes are documented as available anonymously, just
 * possibly delayed); pass the caller's Smarkets token when available for
 * un-delayed prices.
 */
export const getQuotes = async (
  marketIds: ReadonlyArray<string>,
  token?: string,
): Promise<QuotesResponse> => {
  const path = buildIdPath(marketIds, ID_LIMITS.quotes)
  return smarketsFetch(`/v3/markets/${path}/quotes/`, {
    token,
    schema: quotesResponseSchema,
  })
}
