import type { SetupServer } from "msw/node"

/**
 * The life-cycle event emitter shared by `setupServer()` and `setupWorker()` —
 * both expose the same `HttpNetworkFrameEventMap`, so one logger serves the
 * Node server and a browser worker alike.
 */
type LifeCycleEvents = SetupServer["events"]

/**
 * Logs every request MSW *intercepts*, and nothing else.
 *
 * `response:mocked` only fires once a handler has produced the response.
 * Requests that fall through emit `response:bypass` (an explicit
 * `passthrough()`) or `request:unhandled` (no matching handler) instead, and
 * are deliberately left silent here — with `onUnhandledRequest: "bypass"` those
 * are the requests hitting the real Smarkets API, which is normal in a
 * partially-mocked session and would otherwise drown out the mocked traffic.
 *
 * Attach once per MSW instance: the emitter is created in `defineNetwork()` and
 * outlives `close()`, so listeners survive the dev-recompile re-attach in
 * `src/instrumentation.ts` and re-registering would duplicate every line.
 */
export const logInterceptedRequests = (
  events: LifeCycleEvents,
  scope: "node" | "browser",
): void => {
  events.on("response:mocked", ({ request, response }) => {
    console.log(
      `[msw:${scope}] ${request.method} ${request.url} -> ${response.status}`,
    )
  })

  events.on("unhandledException", ({ request, error }) => {
    console.error(
      `[msw:${scope}] handler threw for ${request.method} ${request.url}`,
      error,
    )
  })
}
