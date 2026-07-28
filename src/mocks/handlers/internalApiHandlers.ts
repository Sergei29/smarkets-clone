import { http, HttpResponse } from "msw"
import { quoteFixtures, quoteFixturesUpdated } from "../fixtures/quoteFixtures"
import { logoutSuccessFixture } from "../fixtures/authFixtures"

/**
 * Same-origin internal API handlers, for isolated Client Component tests that
 * call `fetch("/api/smarkets/...")` directly without a running Next.js server.
 *
 * Auth.js credential submission is intentionally NOT intercepted here — per
 * TASK.md, focused LoginForm/UserHeader tests mock `next-auth/react` directly,
 * reserving real Auth.js wiring for the credentials-flow integration/E2E test.
 */
export const internalApiHandlers = [
  http.get("/api/smarkets/quotes", ({ request }) => {
    const marketIds = new URL(request.url).searchParams.get("marketIds")
    if (!marketIds) {
      return HttpResponse.json(
        { error: "bad_request", message: "marketIds is required" },
        { status: 400 },
      )
    }
    return HttpResponse.json(quoteFixtures, { status: 200 })
  }),

  http.post("/api/smarkets/logout", () => {
    return HttpResponse.json(logoutSuccessFixture, { status: 200 })
  }),
]

/** Scenario: quotes rate-limited at the internal API boundary. */
export const internalQuotesRateLimitedHandler = http.get(
  "/api/smarkets/quotes",
  () =>
    HttpResponse.json(
      { error: "rate_limited", message: "Too many requests" },
      { status: 429 },
    ),
)

/**
 * Scenario: the upstream quote service is unavailable. Mirrors what
 * `/api/smarkets/quotes` itself returns for a `503` upstream response
 * (`SmarketsError.fromUpstream` maps it to the generic `upstream_error` code,
 * client-facing status `502`) — see `src/lib/smarkets/errors.ts`.
 */
export const internalQuotesUnavailableHandler = http.get(
  "/api/smarkets/quotes",
  () =>
    HttpResponse.json(
      { error: "upstream_error", message: "Upstream error (503)" },
      { status: 502 },
    ),
)

/**
 * Sequential quote handler factory for polling tests at the internal API
 * boundary: the first request returns `quoteFixtures`, every request after
 * that returns `quoteFixturesUpdated`. Call this per test via
 * `server.use(createSequentialInternalQuotesHandler())` — each call creates a
 * new closure-scoped counter so state never leaks across tests.
 */
export const createSequentialInternalQuotesHandler = () => {
  let callCount = 0
  return http.get("/api/smarkets/quotes", () => {
    callCount += 1
    const book = callCount === 1 ? quoteFixtures : quoteFixturesUpdated
    return HttpResponse.json(book, { status: 200 })
  })
}

/** Scenario: logout succeeds locally even though upstream invalidation failed. */
export const internalLogoutUpstreamFailedHandler = http.post(
  "/api/smarkets/logout",
  () => HttpResponse.json(logoutSuccessFixture, { status: 200 }),
)
