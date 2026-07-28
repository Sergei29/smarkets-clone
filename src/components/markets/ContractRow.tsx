"use client"

import { useLiveMarketPrices } from "@/providers/LiveMarketPricesProvider"
import {
  bestBidPrice,
  bestOfferPrice,
  formatDecimalOdds,
} from "@/lib/smarkets/mappers"
import type { FeaturedContract } from "@/types"

type Props = { contract: FeaturedContract }

/**
 * One contract's name plus its live bid/offer, read from the batched quote
 * poll via `useLiveMarketPrices`. Labelled conservatively ("Bid"/"Offer")
 * rather than back/lay until the exact upstream mapping is verified (see
 * README).
 */
const ContractRow = ({ contract }: Props) => {
  const { quotes } = useLiveMarketPrices()
  const book = quotes?.[contract.id]
  const bid = formatDecimalOdds(bestBidPrice(book))
  const offer = formatDecimalOdds(bestOfferPrice(book))

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-2 py-1 text-sm">
      <span>{contract.name}</span>
      <span className="flex gap-2 tabular-nums text-muted-foreground">
        <span aria-label={`${contract.name} bid`}>B {bid}</span>
        <span aria-label={`${contract.name} offer`}>O {offer}</span>
      </span>
    </div>
  )
}

export default ContractRow
