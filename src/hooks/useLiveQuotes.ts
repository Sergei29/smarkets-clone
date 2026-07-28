"use client"

import { useQuery, type UseQueryResult } from "@tanstack/react-query"
import type { QuotesResponse } from "@/types"
import { compareNumericStrings } from "@/lib/smarkets/idPath"

const QUOTES_REFETCH_INTERVAL_MS = 5_000
const QUOTES_STALE_TIME_MS = 2_000

/** Carries the response status so `QueryProvider`'s retry policy can skip 401/403/429. */
export class QuotesFetchError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "QuotesFetchError"
    this.status = status
  }
}

const fetchQuotes = async (marketIds: string[]): Promise<QuotesResponse> => {
  const res = await fetch(
    `/api/smarkets/quotes?marketIds=${marketIds.join(",")}`,
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { message?: string })
    throw new QuotesFetchError(
      res.status,
      body.message ?? `Failed to load quotes (${res.status})`,
    )
  }
  return res.json()
}

/**
 * One batched quote poll for every currently visible market id — callers share
 * a single TanStack Query instance per unique, sorted id set (canonical query
 * key), so rendering many cards never multiplies polling requests.
 * `staleTime` keeps re-renders of the same id set from double-fetching, and
 * TanStack Query retains the last successful `data` across refetch/failure by
 * default (see `QueryProvider`'s retry policy for the 401/403/429 cutoff).
 */
export const useLiveQuotes = (
  marketIds: ReadonlyArray<string>,
): UseQueryResult<QuotesResponse> => {
  const sortedIds = [...marketIds].sort(compareNumericStrings)

  return useQuery({
    queryKey: ["quotes", sortedIds],
    queryFn: () => fetchQuotes(sortedIds),
    enabled: sortedIds.length > 0,
    refetchInterval: QUOTES_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: false,
    staleTime: QUOTES_STALE_TIME_MS,
  })
}
