"use client"

import { createContext, useContext } from "react"
import { useLiveQuotes } from "@/hooks/useLiveQuotes"
import type { QuoteBook, QuotesResponse } from "@/types"

type QuotesContextValue = {
  quotes: QuotesResponse | undefined
  isFetching: boolean
  isError: boolean
}

const QuotesContext = createContext<QuotesContextValue>({
  quotes: undefined,
  isFetching: false,
  isError: false,
})

/**
 * Batches every currently visible market id behind one polling TanStack Query
 * and makes the resulting quote book available to descendants via
 * `useContractQuote`/`useQuotesStatus` — one poll covers every rendered card,
 * and (being data-only, not homepage-shaped) this is reusable as-is on the
 * event page. `children` is real JSX from the server, not a render prop:
 * functions can't cross the Server→Client boundary as props.
 */
const LiveMarketPrices = ({
  marketIds,
  children,
}: {
  marketIds: ReadonlyArray<string>
  children: React.ReactNode
}) => {
  const { data, isFetching, isError } = useLiveQuotes(marketIds)

  return (
    <QuotesContext.Provider value={{ quotes: data, isFetching, isError }}>
      {children}
    </QuotesContext.Provider>
  )
}

/** The live quote book for one contract, or `undefined` while loading/missing. */
export const useContractQuote = (contractId: string): QuoteBook | undefined =>
  useContext(QuotesContext).quotes?.[contractId]

/** Background-refetch status for the shared poll — `isFetching` excludes the initial load. */
export const useQuotesStatus = (): {
  isFetching: boolean
  isError: boolean
} => {
  const { quotes, isFetching, isError } = useContext(QuotesContext)
  return { isFetching: isFetching && quotes !== undefined, isError }
}

/** Subtle, non-spinner "updating" status — reserves its own space to avoid layout shift. */
export const QuotesUpdatingIndicator = () => {
  const { isFetching } = useQuotesStatus()
  return (
    <span
      role="status"
      aria-live="polite"
      className="text-xs text-muted-foreground"
    >
      {isFetching ? "Updating prices…" : " "}
    </span>
  )
}

export default LiveMarketPrices
