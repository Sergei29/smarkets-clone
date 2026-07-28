import { http, HttpResponse } from "msw"
import { quoteFixtures } from "../fixtures/quoteFixtures"
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

/** Scenario: logout succeeds locally even though upstream invalidation failed. */
export const internalLogoutUpstreamFailedHandler = http.post(
  "/api/smarkets/logout",
  () => HttpResponse.json(logoutSuccessFixture, { status: 200 }),
)
