"use client"

import { createContext, useContext } from "react"
import { useLiveQuotes } from "@/hooks/useLiveQuotes"
import type { QuotesResponse } from "@/types"

type QuotesContextValue = {
  quotes?: QuotesResponse
}

const QuotesContext = createContext<QuotesContextValue | null>(null)

type QuotesContextProviderProps = {
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
const QuotesContextProvider = ({
  marketIds,
  children,
}: QuotesContextProviderProps) => {
  const { data } = useLiveQuotes(marketIds)

  return (
    <QuotesContext.Provider value={{ quotes: data }}>
      {children}
    </QuotesContext.Provider>
  )
}

/**
 * The full shared quote-poll context — callers pull what they need from it
 * (e.g. `quotes?.[contractId]`), so one hook serves any shape of consumer.
 * Throws if used outside a `QuotesContextProvider`.
 */
export const useQuotesContext = (): QuotesContextValue => {
  const context = useContext(QuotesContext)

  if (context === null) {
    throw new Error(
      "useQuotesContext must be used within a QuotesContextProvider",
    )
  }

  return context
}

export default QuotesContextProvider
