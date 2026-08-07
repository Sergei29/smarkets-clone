"use client"

import { createContext, useContext } from "react"
import { useLiveQuotes } from "@/hooks/useLiveQuotes"
import type { QuotesResponse } from "@/types"

type LiveMarketPricesContextValue = {
  quotes?: QuotesResponse
  isFetching: boolean
  isError: boolean
}

const LiveMarketPricesContext =
  createContext<LiveMarketPricesContextValue | null>(null)

type LiveMarketPricesProviderProps = {
  marketIds: ReadonlyArray<string>
  children: React.ReactNode
}

/**
 * Batches every currently visible market id behind one polling TanStack Query
 * and makes the resulting quote book available to descendants via
 * `useLiveMarketPrices`/`useQuotesStatus` — one poll covers every rendered
 * card, and (being data-only, not homepage-shaped) this is reusable as-is on
 * the event page. `children` is real JSX from the server, not a render prop:
 * functions can't cross the Server→Client boundary as props.
 */
const LiveMarketPricesProvider = ({
  marketIds,
  children,
}: LiveMarketPricesProviderProps) => {
  const { data, isFetching, isError } = useLiveQuotes(marketIds)

  return (
    <LiveMarketPricesContext.Provider
      value={{ quotes: data, isFetching, isError }}
    >
      {children}
    </LiveMarketPricesContext.Provider>
  )
}

/**
 * The full shared quote-poll context — callers pull what they need from it
 * (e.g. `quotes?.[contractId]`), so one hook serves any shape of consumer.
 * Throws if used outside a `LiveMarketPricesProvider`.
 */
export const useLiveMarketPrices = (): LiveMarketPricesContextValue => {
  const context = useContext(LiveMarketPricesContext)

  if (context === null) {
    throw new Error(
      "useLiveMarketPrices must be used within a LiveMarketPricesProvider",
    )
  }

  return context
}

/** Background-refetch status for the shared poll — `isFetching` excludes the initial load. */
export const useQuotesStatus = (): {
  isFetching: boolean
  isError: boolean
} => {
  const { quotes, isFetching, isError } = useLiveMarketPrices()

  return { isFetching: isFetching && quotes !== undefined, isError }
}

export default LiveMarketPricesProvider
