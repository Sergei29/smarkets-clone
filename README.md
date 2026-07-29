## SMarket Clone

Smarkets API: https://api.smarkets.com/v0/control/openapi/

#### Functional requirements:

- Log-in: Users should be able to log into their Smarkets account. If you do not have one
  yourself, go to https://smarkets.com/members/signup/ and create an account. If you have any personal circumstances preventing you from doing so, please reach out to the recruiter and requirements for this exercise can be adjusted.
- Homepage: Users should see a homepage with various events and markets featured.
  The markets displayed should have contracts with prices that update regularly.
- Event page: Users can click on a specific event to see more details and more available markets.

#### Implementation details:

- You are free to pick the libraries and tools of your choice, but you should justify why you
  picked them. The only technical requirement is that you use React.
- You are free to use any AI coding tool to help you build the project.
- You should not spend more than 6 hours on this exercise.
- You should write a brief summary explaining your choices, challenges and technical
  decisions, as well as how you would improve your project if you had additional time.

🚀 Have fun! 🎉

## API contract verification (Phase 0)

Verified against the live OpenAPI 3.0.2 document at
`https://api.smarkets.com/v0/control/openapi/` (a 2.5&nbsp;MB inline JSON spec)
by inspecting the operation objects directly. Findings:

| Item                              | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Login method**                  | `POST /v3/sessions/` **confirmed** by the operation object (the endpoint exposes `post` + `delete`, no `get`). The OpenAPI intro text that links login as `GET /v3/sessions/` is misleading — resolved in favour of **POST**. Success status is **`201 Created`** (documented responses: 201/400/401/403/429/451/500/503), so the client treats 201 as success.                                                                                                                                                                         |
| **Login request body**            | Only `username` + `password` are `required`. Optional: `create_social_member`, `remember`, `reopen_account`, `use_auth_v2` (all boolean). The HAR-confirmed body in `TASK.md` is valid. Note: `refresh_token` is an auth-v2 feature — send `use_auth_v2: true` if a refresh token is needed. (The `mode: "header"\|"cookie"` field belongs to the older `/v0/sessions/` variant, **not** v3.)                                                                                                                                           |
| **Logout**                        | `DELETE /v0/sessions/current/` exists (used by `TASK.md`). `DELETE /v3/sessions/` also exists; `/v3/sessions/current/` only supports `PUT`.                                                                                                                                                                                                                                                                                                                                                                                             |
| **Path-array serialisation**      | `{market_ids}`/`{event_ids}` are `path` params typed `array<integer>`, `uniqueItems: true`, default `simple` style → **comma-joined** in the path segment (e.g. `/v3/markets/1,2,3/quotes/`). Limits: quotes `maxItems: 200`, contracts `100`.                                                                                                                                                                                                                                                                                          |
| **Quote response shape**          | Object **keyed by contract ID** → `{ bids: [{ price, quantity }], offers: [{ price, quantity }] }`. `price` is in **percentage basis points** (spec example `5000`), confirming `decimalOdds = 10_000 / price` (`5000` → `2.0`). `quantity` is the summed pot.                                                                                                                                                                                                                                                                          |
| **v3 resource model**             | All MVP endpoints present: `/v3/events/`, `/v3/events/{event_ids}/`, `/v3/events/{event_ids}/markets/`, `/v3/markets/{market_ids}/contracts/`, `/v3/markets/{market_ids}/quotes/`, plus optional `last_executed_prices/`, `volumes/`, `{event_ids}/states/`, `{event_ids}/competitors/`.                                                                                                                                                                                                                                                |
| **`/v3/events/` defaults**        | Confirmed against the **live API**, not just the spec: default `sort=id` + `limit=20` returns the platform's oldest 20 events matching the default `state` filter (`new,upcoming,live`) — almost none of which are still `bettable`, so an unparameterised call renders an empty homepage. Fixed by requesting `sort=display_order,start_datetime,id&limit=100&state=live&state=upcoming` explicitly (`src/lib/smarkets/events.ts`); array query params use repeated-key form (`state=live&state=upcoming`), confirmed via a live call. |
| **Unknown event id (event page)** | The spec documents only a `200` response for `GET /v3/events/{event_ids}/` — an unmatched id isn't a `404`, it's simply filtered out of the returned `events` array (consistent with the comma-joined, partial-match path-array style used throughout). `getEventById` treats an empty result as "not found" and the event page calls Next's `notFound()`, rather than routing it through `SmarketsError`.                                                                                                                              |

**Deferred — needs one live authenticated call (blocked: credentials are
form-only and not available at scaffold time):**

- Confirming the exact `Authorization: Session-Token <token>` follow-up header on
  an authenticated request (sanitised HAR may omit it).
- Determining the definitive **back/lay** display mapping of `bids`/`offers`.
  Until verified, bid/offer are labelled conservatively per `TASK.md`.

This does not block mock-driven UI development, per the Phase 0 rule.

## This project

A [Next.js](https://nextjs.org) 16 App Router clone of the Smarkets login,
homepage and event-detail screens, built against the real Smarkets API
(`https://api.smarkets.com`). Originally bootstrapped with `create-next-app`;
everything under `src/` beyond the initial scaffold is this exercise's work.

## Setup

```bash
npm install
cp .env.example .env
# generate a value for AUTH_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# paste the output into .env as AUTH_SECRET=...

npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Node version is pinned in
`.nvmrc` (`v22`).

By default the app calls the real Smarkets API — logging in requires a real
Smarkets account (see the brief above for signup). To develop/test without one,
use mock mode below.

### Mock-enabled development

Set `API_MOCKING=enabled` in `.env` (see `.env.example`) to run against
MSW-mocked Smarkets responses instead of the real API. `API_MOCKING` is read
once when the dev server boots (`src/instrumentation.ts`) — **restart
`next dev` after changing it**; toggling it in `.env` while a server is
already running has no effect until restarted.

With mocking enabled, log in with:

- Username: `test.user@example.com`
- Password: `correct-horse-battery-staple`

Any other credentials correctly return a `401 invalid credentials` error — the
mock only recognises this one pair (see
`src/mocks/fixtures/authFixtures.ts`). A second fixture account,
`mfa.user@example.com` / `correct-horse-battery-staple`, exercises the
unsupported-MFA error path instead of a successful login.

### Other scripts

```bash
npm run test        # Vitest unit/component/integration suite
npm run test:watch  # Vitest, watch mode
npm run test:e2e     # Playwright E2E (spins up its own mock-enabled server on :3100)
npm run test:e2e:ui  # same, in Playwright's interactive UI mode
npm run validate     # format:check + lint + typecheck + test + build — what Husky runs pre-commit
```

## Stack and why

| Choice                                                        | Why                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16 (App Router, Cache Components, React Compiler)** | Pinned per the exercise scaffold. Cache Components' explicit dynamic/`"use cache"` split maps cleanly onto this app's real shape: auth/quotes are inherently dynamic, almost nothing else is. React Compiler removes manual `useMemo`/`useCallback` bookkeeping.  |
| **TypeScript, strict**                                        | Required; also the only realistic way to keep the Smarkets response shapes, Zod schemas and Auth.js module augmentation (`next-auth.d.ts`) consistent as the app grew across phases.                                                                              |
| **Zod**                                                       | One schema library for both untrusted-upstream validation (`smarketsClient.ts`) and form validation (login), so parsing rules aren't duplicated between two libraries.                                                                                            |
| **React Hook Form**                                           | Uncontrolled-by-default form state keeps the login form's re-renders cheap and pairs directly with Zod via `@hookform/resolvers`.                                                                                                                                 |
| **TanStack Query**                                            | Owns the batched quote poll: interval refetch, retry policy, and — critically — retaining the last good `data` across a failed refetch, which is exactly the "preserve stale prices" requirement.                                                                 |
| **Auth.js v5 (beta), Credentials provider, JWT session**      | Only credentials-based login is needed (no OAuth), and JWT sessions keep the Smarkets token off any server-side session store while still letting `getSmarketsToken` decode it server-side.                                                                       |
| **MSW**                                                       | Intercepts at the network layer (both the real `api.smarkets.com` URLs and same-origin `/api/smarkets/*`), so server-only data functions, Route Handlers and isolated Client Component tests all exercise the same fetch code paths as production, mocked or not. |
| **Vitest + RTL**                                              | Vite-native, fast, jsdom + RTL for component behaviour, shares TypeScript config with the app.                                                                                                                                                                    |
| **Playwright**                                                | Real-browser journeys Vitest/RTL can't cover: full-page navigation, redirects, and genuine polling-interval timing.                                                                                                                                               |
| **Tailwind v4 + a handful of shadcn/ui primitives**           | CSS-first Tailwind v4 needs no separate config file; shadcn/ui components are copied in (not an installed dependency) so only what's actually used (`Card`, `Alert`, `Badge`, `Button`, `Input`, `Field`, `Skeleton`) ships.                                      |
| **next-themes**                                               | Small, well-trodden light/dark toggle with no FOUC, minimal justification needed beyond "it's the standard choice".                                                                                                                                               |
| **Husky**                                                     | Pre-commit gate (format, lint, typecheck, Vitest, build) catches regressions before they reach CI, per `TASK.md`'s explicit quality-gate spec.                                                                                                                    |

## Endpoint composition

```text
Events → Markets → Contracts → Quotes
```

The app calls eight endpoints in total, all listed below —
`POST /v3/sessions/`, `DELETE /v0/sessions/current/`,
`GET /v0/users/current/info-without-rate/`, `GET /v3/events/`,
`GET /v3/events/{event_ids}/`, `GET /v3/events/{event_ids}/markets/`,
`GET /v3/markets/{market_ids}/contracts/` and
`GET /v3/markets/{market_ids}/quotes/`. Deliberately **not** used:
`/v0/navigation/` and the odds-feed (`/oddsfeed.xml.gz`) — `TASK.md` calls
these out as non-foundational, and the v3 resource model above already gives
the homepage and event page everything they need.

- **Homepage** (`getHomepageViewModel`): `getEvents()` → `selectFeaturedEvents`
  → `getMarketsByEventIds` (batched) → one `selectFeaturedMarket` per event →
  `getContractsByMarketIds` (batched) → `buildHomepageViewModel`.
- **Event page** (`getEventViewModel`): event + markets fetched concurrently →
  `selectDisplayableMarkets` (broader than the homepage's one-per-event pick) →
  `getContractsByMarketIds` → `buildEventViewModel`.
- **Quotes** (both pages): client polls same-origin `/api/smarkets/quotes`,
  which independently calls `auth()`, forwards the caller's Smarkets token, and
  proxies `GET /v3/markets/{market_ids}/quotes/`.
- **Auth**: `authorize()` calls `POST /v3/sessions/`, then
  `GET /v0/users/current/info-without-rate/` for the profile, before Auth.js
  ever issues a session — see `src/lib/authFlows.ts`.
- ID batching/serialisation (`src/lib/smarkets/idPath.ts`) validates, dedupes,
  sorts and caps ID sets against each endpoint's documented `maxItems` before
  building the comma-joined path segment.
- `src/lib/smarkets/smarketsClient.ts` is the single server-only choke point
  for every real Smarkets call: base URL, `Authorization: Session-Token`
  injection, timeout/abort, JSON parsing, optional Zod validation, and
  structured `SmarketsError`s — reused by every data function and Route
  Handler above.

## Security decisions

- **Credentials are form-only.** Typed into the login form; never read from
  `.env` or stored anywhere outside the request that submits them.
- **Token isolation.** The Smarkets session token and refresh token live only
  on the server-side Auth.js `JWT` (`src/types/next-auth.d.ts` augmentation
  keeps this a compile-time invariant — `Session.user` has no token fields at
  all, not just empty ones). Protected Route Handlers decode the JWT
  server-side via `getSmarketsToken` (`next-auth/jwt`'s `getToken`); the token
  is never reachable through `useSession()`/`auth()` on the client.
  `authFlows.test.ts` asserts this by literal value, not just by key absence.
- **Browser never calls `api.smarkets.com` directly.** `smarketsClient.ts` is
  marked `import "server-only"`, making it a build error to reach it from a
  Client Component. Client Components only ever call same-origin
  `/api/smarkets/*`.
- **Defense in depth.** `src/proxy.ts` gates page navigation, but every
  protected Route Handler and server data function independently calls
  `auth()`/requires the server-only token rather than trusting the proxy alone.
- **No upstream detail leaks to the client.** `SmarketsError.toClientJson()`
  returns only a stable `{ error, message }` shape — upstream bodies, headers
  and stack traces never cross the boundary; `smarketsClient.ts`'s logging
  explicitly excludes headers, bodies and the token.

## Polling and rate-limit decisions

`TASK.md` documents Smarkets' quote endpoint as limited to ~50 requests/60s
(stricter than the account-wide 1,200/60s), and instructs a 5–10s refresh
interval with no aggressive `429` retries. Accordingly:

- `useLiveQuotes` polls every **5 seconds** (`refetchInterval`), stops in the
  background tab (`refetchIntervalInBackground: false`), and batches every
  currently visible market ID behind **one** shared TanStack Query per unique,
  sorted ID set — rendering more cards never multiplies requests.
- `shouldRetryQuery` (`QueryProvider.tsx`) skips retries entirely on
  `401`/`403`/`429`, retrying other transient failures at most twice.
- TanStack Query's default behaviour — retaining the last successful `data`
  across a failed refetch — is what satisfies "preserve stale prices on
  failure"; no extra state was needed for it, just not fighting the default.
  Covered by `errors.spec.ts`'s rate-limit Playwright journey.
- A subtle `role="status"` text indicator (`QuotesUpdatingIndicator`) shows
  background refetches without replacing content with a spinner.

## Tests included

**Vitest + React Testing Library** — 22 files, 134 tests, all network-mocked
(MSW for upstream/internal-API boundaries, `vi.stubGlobal("fetch", ...)` for
the low-level HTTP client itself; verified empirically that no test can reach
the live network — see "Challenges" below):

- **Unit** — ID batching/serialisation, upstream error normalisation, quote
  formatting/best-bid/best-offer, Zod schema parsing (valid + malformed),
  featured-event/market selection, view-model composition, the retry policy.
- **Component** — login form validation/submission/error states, event and
  market cards, contract rows (including the missing-quote fallback), the
  header's static-shell/session-slot split.
- **Route/integration** — `/api/smarkets/quotes` and `/api/smarkets/logout`
  against MSW-intercepted upstream URLs: auth forwarding, missing-session
  `401`, malformed-ID `400`, upstream `429` passthrough, malformed-upstream
  `502`, and that the token never appears in the client response.
- **`authFlows.test.ts`** — `authorize()` end-to-end against MSW (valid /
  malformed / invalid / MFA / profile-failure / login-failure), JWT/session
  shaping, and upstream logout invalidation.

**Playwright** — 5 spec files (1 setup + 4 journey specs), 9 tests, covering
all 8 journeys `TASK.md` requires: login success/redirect, invalid credentials,
homepage renders events/markets/contracts, a displayed price changing after a
poll, clicking through to an event page, the event page showing more markets
than its homepage card, an unauthenticated deep link redirecting to login and
back, and a rate-limited quote refetch preserving the existing prices. Runs
against its own mock-enabled `next dev` server on port 3100 (isolated from a
locally running dev server); all specs but the login spec itself reuse a
storage-state session seeded once by `auth.setup.ts`, per `TASK.md`'s "don't
repeat form login in every spec" guidance. Sequential/degraded quote responses
for the polling and rate-limit journeys are driven by `page.route()`
interception rather than the MSW server, per `TASK.md`'s Playwright strategy.

**CI** — `.github/workflows/ci.yml` runs `validate` (format, lint, typecheck,
Vitest, build) then the Playwright suite on every pull request into `main`.
Playwright is deliberately **not** in the Husky pre-commit hook (`TASK.md`:
"run E2E in CI and manually before submission") — it's slower and needs a full
browser + server boot, a bad cost to impose on every local commit.

## Challenges and confirmed API discrepancies

See the "API contract verification (Phase 0)" table above for the confirmed
login method/body, path-array serialisation, quote-response shape and the
`/v3/events/` default-filter surprise (an unparameterised call returns almost
no `bettable` events).

Beyond the API contract itself:

- **Cache Components' dynamic-read rule** (`cookies()`/`headers()`/
  `searchParams`/dynamic `params` outside `<Suspense>` throws a build/dev
  error) shaped the login page (`searchParams.callbackUrl`) and the protected
  layout. The header was split into a static shell (`UserHeader`) plus a
  narrowly-scoped async session slice (`AuthedProfileSlot`/`UserDisplayName`),
  so the static chrome and page content never wait on the session-cookie read
  — only that one slice sits behind its own `<Suspense>` boundary.
- **Vitest can't import root `next-auth`** — it transitively pulls in a
  `next/server` dependency Vitest's resolver can't load. Solved by extracting
  the testable login/session-shaping logic into `src/lib/authFlows.ts`
  (importing `CredentialsSignin` from `@auth/core/errors` instead of the root
  package — a zero-behavior-difference re-export), leaving `src/lib/auth.ts`
  as a thin `NextAuth({...})` wiring module no test imports directly.
- **Back/lay mapping unverified.** Confirming the definitive `bids`/`offers` →
  back/lay display mapping needs one live authenticated quote call, which
  wasn't available at scaffold time (credentials are form-only, not present in
  any env). Labelled conservatively as "Bid"/"Offer" per `TASK.md`'s fallback
  guidance rather than guessing.

## Known limitations

- The optional endpoints (`/v3/accounts/` balance, `/v3/markets/{ids}/volumes/`,
  `/v3/events/{ids}/states/`, competitors) are not implemented — `TASK.md`
  explicitly marks all four as post-MVP, and the six-hour scope favoured a
  complete, well-tested required vertical slice over any of them.
- No session/token refresh-rotation flow; a session simply expires when the
  underlying Smarkets token does.
- Homepage event selection is a single bounded fetch (`limit=100`,
  `state=live,upcoming`) — there's no pagination or "load more".
- Playwright runs Chromium only; no cross-browser or mobile-viewport coverage.
- Accessibility is attribute-level (`aria-label`s, `role="status"` live
  regions, labelled form fields) but hasn't had an automated audit (e.g.
  `axe-core`) run against it.

## Improvements with more time

- Make one live authenticated call to confirm the exact
  `Authorization: Session-Token` follow-up header shape and the back/lay
  mapping, then relabel `ContractRow` accordingly.
- Add the account-balance widget and event states/competitors as genuinely
  optional, separately-loaded enhancements (not gating the core pages).
- Broaden Playwright to Firefox/WebKit and a mobile viewport project.
- Add `axe-core` (or `@axe-core/playwright`) accessibility assertions to the
  existing E2E journeys rather than a separate audit pass.
- Session refresh-token rotation instead of a hard session expiry.
