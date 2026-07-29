"use client"

import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, type PropsWithChildren } from "react"

/** Extracts an HTTP status from an error, if one is present. */
export const statusOf = (error: unknown): number | undefined => {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: unknown }).status
    if (typeof status === "number") return status
  }
  return undefined
}

/**
 * Do not hammer auth/rate-limit failures; retry other transient errors twice.
 * Exported (rather than left inline) so this policy is directly unit-testable
 * without going through a `QueryClient` instance.
 */
export const shouldRetryQuery = (
  failureCount: number,
  error: unknown,
): boolean => {
  const status = statusOf(error)
  if (status && [401, 403, 429].includes(status)) return false
  return failureCount < 2
}

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
      },
    },
  })

let browserQueryClient: QueryClient | undefined

/** One client on the server per request; a single stable client in the browser. */
const getQueryClient = () => {
  if (isServer) return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

const QueryProvider = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(getQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default QueryProvider
