import type { ReactElement, PropsWithChildren } from "react"
import { render, type RenderOptions } from "@testing-library/react"
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import type { Session } from "next-auth"
import ThemeProvider from "@/providers/ThemeProvider"
import { createTestQueryClient } from "./testQueryClient"

type RenderWithProvidersOptions = RenderOptions & {
  queryClient?: QueryClient
  session?: Session | null
}

/**
 * Render helper wrapping `ThemeProvider` + `SessionProvider` +
 * `QueryClientProvider` — the full provider stack any component under test
 * might need, mirroring the root layout (`src/app/layout.tsx`) and the
 * `(protected)/layout.tsx` provider tree, but with an isolated `QueryClient`
 * per call. Returns the `queryClient` alongside RTL's result so a test can
 * inspect or clear it directly.
 */
export const renderWithProviders = (
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    session = null,
    ...options
  }: RenderWithProvidersOptions = {},
) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  )

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  }
}

export * from "@testing-library/react"
