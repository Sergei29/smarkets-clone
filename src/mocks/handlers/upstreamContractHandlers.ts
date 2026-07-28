import { http, HttpResponse } from "msw"
import { contractFixtures } from "../fixtures/contractFixtures"

const BASE = "https://api.smarkets.com"

/**
 * Filters by requested market IDs. "Market with no contracts" falls out
 * naturally from requesting a market ID absent from `contractFixtures` — no
 * dedicated empty handler needed.
 */
export const upstreamContractHandlers = [
  http.get(`${BASE}/v3/markets/:marketIds/contracts/`, ({ params }) => {
    const marketIds = String(params.marketIds).split(",")
    const contracts = contractFixtures.filter((contract) =>
      marketIds.includes(contract.market_id),
    )
    return HttpResponse.json({ contracts }, { status: 200 })
  }),
]
