import { isMockingEnabled } from "@/lib/env"

/**
 * Starts the MSW Node server once, at Next.js server startup, when
 * `API_MOCKING=enabled`. Guarded on the Node.js runtime — this project does
 * not use `runtime = "edge"`, but `instrumentation.ts` is invoked for any
 * runtime present, so the guard keeps the Node-only MSW import out of an edge
 * bundle if one is ever added.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (!isMockingEnabled) return

  const { server } = await import("./mocks/server")
  server.listen({ onUnhandledRequest: "bypass" })
}
