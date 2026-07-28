import { QueryClient } from "@tanstack/react-query"

/**
 * A fresh, isolated `QueryClient` per test render — never share the production
 * client (`src/providers/QueryProvider.tsx`) across tests. No retries so
 * error-state tests resolve immediately; `gcTime: Infinity` keeps a test's
 * cache alive for the duration of that single render.
 */
export const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        gcTime: Infinity,
      },
      mutations: { retry: false },
    },
  })
