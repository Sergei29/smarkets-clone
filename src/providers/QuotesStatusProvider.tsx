"use client"

import { createContext, useContext } from "react"
import { useLiveQuotes } from "@/hooks/useLiveQuotes"

type QuotesStatusContextValue = {
  isFetching: boolean
  isError: boolean
}

const QuotesStatusContext = createContext<QuotesStatusContextValue | null>(null)

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
const QuotesStatusProvider = ({
  marketIds,
  children,
}: LiveMarketPricesProviderProps) => {
  const { data, isFetching, isError } = useLiveQuotes(marketIds)

  return (
    <QuotesStatusContext.Provider
      value={{ isFetching: isFetching && data !== undefined, isError }}
    >
      {children}
    </QuotesStatusContext.Provider>
  )
}

/** Background-refetch status for the shared poll — `isFetching` excludes the initial load. */
export const useQuotesStatus = (): {
  isFetching: boolean
  isError: boolean
} => {
  const context = useContext(QuotesStatusContext)

  if (context === null) {
    throw new Error(
      "useQuotesStatus must be used within a QuotesStatusProvider",
    )
  }

  return context
}

export default QuotesStatusProvider
