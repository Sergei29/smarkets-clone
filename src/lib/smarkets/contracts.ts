import "server-only"

import type { SmarketsContract } from "@/types"
import { smarketsFetch } from "./smarketsClient"
import { contractsResponseSchema } from "./schemas"
import { buildIdPath, ID_LIMITS } from "./idPath"

/** GET /v3/markets/{market_ids}/contracts/ — batched by market id, up to 100. */
export const getContractsByMarketIds = async (
  marketIds: ReadonlyArray<string>,
): Promise<SmarketsContract[]> => {
  const path = buildIdPath(marketIds, ID_LIMITS.contracts)
  const { contracts } = await smarketsFetch(`/v3/markets/${path}/contracts/`, {
    schema: contractsResponseSchema,
  })
  return contracts
}
