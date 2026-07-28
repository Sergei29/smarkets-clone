"use client"

import { useQuotesStatus } from "@/providers/LiveMarketPricesProvider"

/** Subtle, non-spinner "updating" status — reserves its own space to avoid layout shift. */
const QuotesUpdatingIndicator = () => {
  const { isFetching } = useQuotesStatus()
  return (
    <span
      role="status"
      aria-live="polite"
      className="text-xs text-muted-foreground"
    >
      {isFetching ? "Updating prices…" : " "}
    </span>
  )
}

export default QuotesUpdatingIndicator
