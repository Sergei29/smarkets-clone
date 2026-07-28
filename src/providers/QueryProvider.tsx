"use client"

import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query"
import { useState } from "react"

/** Extracts an HTTP status from an error, if one is present. */
const statusOf = (error: unknown): number | undefined => {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: unknown }).status
    if (typeof status === "number") return status
  }
  return undefined
}

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Do not hammer auth/rate-limit failures; retry transient errors twice.
        retry: (failureCount, error) => {
          const status = statusOf(error)
          if (status && [401, 403, 429].includes(status)) return false
          return failureCount < 2
        },
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

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(getQueryClient)

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
