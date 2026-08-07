import type { SetupServer } from "msw/node"
import { isMockingEnabled } from "@/lib/env"

const LISTEN_OPTIONS = { onUnhandledRequest: "bypass" } as const

/** Flag Next.js sets on `globalThis` while `globalThis.fetch` is wrapped for caching. */
const NEXT_PATCH_SYMBOL = Symbol.for("next-patch")

/**
 * Keeps MSW attached to `globalThis.fetch` across dev recompiles.
 *
 * `next dev` snapshots `globalThis.fetch` while booting its router server —
 * before `register()` runs — and restores that snapshot after every server-code
 * rebuild (`resetFetch()` in `next/dist/server/lib/router-server.js`, called by
 * the Turbopack hot reloader's `clearRequireCache`). Because the snapshot
 * predates MSW, the first recompile silently unhooks the interceptor and every
 * server-side request from then on hits the real Smarkets API.
 *
 * `resetFetch()` also flips Next's patch flag back to `false`, which is the one
 * observable signal that a reset happened — so watch the flag and re-attach.
 * `close()` first: it clears the interceptor's "already applied" bookkeeping,
 * without which `listen()` is a no-op and the mocks stay detached.
 */
const keepAttachedAcrossRecompiles = (server: SetupServer): void => {
  let nextPatched: unknown = Reflect.get(globalThis, NEXT_PATCH_SYMBOL)

  Object.defineProperty(globalThis, NEXT_PATCH_SYMBOL, {
    configurable: true,
    get: () => nextPatched,
    set: (value: unknown) => {
      nextPatched = value
      if (value !== false) return
      server.close()
      server.listen(LISTEN_OPTIONS)
    },
  })
}

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
  const { logInterceptedRequests } = await import("./mocks/logRequests")

  server.listen(LISTEN_OPTIONS)
  logInterceptedRequests(server.events, "node")
  keepAttachedAcrossRecompiles(server)
}
