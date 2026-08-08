# TASK.md — Smarkets Front-End Take-Home Test

## Goal

Build a focused, production-minded Next.js application that:

1. lets a user log in to an existing Smarkets account;
2. displays a homepage containing featured events and markets;
3. displays contracts with current exchange prices that refresh regularly;
4. lets the user open an event page and view more markets and contracts;
5. demonstrates sensible API-boundary, testing, mocking, error-handling and quality-control decisions;
6. remains appropriately scoped for the assignment's six-hour implementation limit.

The application must use React. This implementation uses Next.js App Router,
TypeScript and a small supporting library set selected for fast delivery,
security and testability.

Read this entire file before implementation. Preserve the MVP scope. Do not add
bet placement, cash-out, transaction history or other trading functionality.

---

## Source-of-truth hierarchy

Use sources in this order:

1. the take-home assignment;
2. the live OpenAPI document at `https://api.smarkets.com/v0/control/openapi/`;
3. verified live responses or captured HAR traffic;
4. assumptions, only when clearly marked and verified before relying on them.

Where the OpenAPI document and captured traffic disagree, record the discrepancy
and run one controlled live verification before finalising the implementation.
Do not silently guess.

The supplied Claude transcript records HAR-confirmed contracts for login, account,
profile and logout. Do not commit the original HAR files or any real account PII to
the repository. Use sanitised fixtures only.

---

## Important corrections to the earlier plan

### 1. Use the quotes endpoint for contract prices

The assignment explicitly asks for markets whose contracts have prices that
update regularly. The OpenAPI specification provides:

```http
GET /v3/markets/{market_ids}/quotes/
```

This endpoint is described as returning current exchange prices. It accepts up
to 200 market IDs and has a documented API-user limit of 50 requests per 60
seconds. Prices may be delayed when no session token is supplied.

Do **not** replace prices with traded volume. Volume is a useful optional field,
but it does not satisfy the contract-price requirement.

### 2. Treat the login method as a verification item

Captured HAR traffic indicates:

```http
POST /v3/sessions/
```

with JSON credentials. The OpenAPI introductory text currently links the login
route as:

```http
GET /v3/sessions/
```

Before implementing auth permanently, make one controlled request or inspect the
operation object directly and confirm the actual supported method and request
shape. Keep the API client isolated so this discrepancy can be corrected in one
place.

### 3. Authenticated request header is documented

Use:

```http
Authorization: Session-Token <token>
```

Do not expose the token to browser JavaScript.

### 4. Navigation and odds-feed endpoints are not the primary MVP path

The v3 resource endpoints provide a clearer application model:

```text
Events → Markets → Contracts → Quotes
```

Use these endpoints for the MVP rather than making `/v0/navigation/` or
`/oddsfeed.xml.gz` foundational dependencies.

---

## Hard constraints

1. **Browser CORS boundary**  
   Client Components must never call `api.smarkets.com` directly. Browser-side
   requests call same-origin Next.js Route Handlers. Server Components and
   server-only data functions may call the shared Smarkets server client
   directly.

2. **Session-token security**  
   Persist the Smarkets token only inside the encrypted, HTTP-only Auth.js JWT
   cookie. Keep it on the server-facing JWT object and explicitly exclude it from
   the client-visible Auth.js `Session`. Never expose it through React state or
   store it in `localStorage`/`sessionStorage`.

3. **Credentials are form-only**  
   Users type credentials into the login form. Never commit credentials or place
   them in `.env.local`. Environment files contain configuration only.

4. **No signup UI**  
   Account creation happens on the Smarkets website. The application only needs
   login and logout.

5. **Real contract prices**  
   Poll the quotes endpoint conservatively and batch visible market IDs into a
   single request.

6. **Rate limits**  
   The API documents a default account limit of 1,200 requests per 60 seconds.
   Quotes have a stricter limit of 50 requests per 60 seconds for API users, with
   lower limits possible for non-API users. Use a default quote refresh interval
   of 5–10 seconds, stop background polling, batch IDs and do not retry `429`
   responses aggressively.

7. **Strict TypeScript**  
   Enable strict mode. Avoid `any`. Validate untrusted upstream responses at the
   API boundary.

8. **Six-hour scope**  
   Prefer a complete, well-tested vertical slice over optional features. Time may
   be extended beyond six hours where it materially improves the vertical slice,
   but do not add excluded features.

---

## Next.js 16 Cache Components constraints

This project pins Next.js `16.2.12` with `cacheComponents: true` and
`reactCompiler: true` (`next.config.ts`). This is not the Next.js in most
training data — read `node_modules/next/dist/docs/` before implementing. The
rules below are load-bearing for auth, the login page and quote polling:

- **Dynamic reads must sit inside `<Suspense>`.** Reading `cookies()`,
  `headers()`, `searchParams`, or dynamic route `params` outside a `<Suspense>`
  boundary throws a build/dev `blocking-route` error. The login page consuming
  `searchParams.callbackUrl`, and any component reading the session, must be
  wrapped accordingly.
- **Never mark auth/quote code paths `"use cache"`.** Route Handlers and server
  functions that call `auth()`, read cookies, or fetch fast-changing quotes are
  inherently dynamic. Use `cache: "no-store"` on those upstream fetches; reserve
  `"use cache"` + `cacheLife`/`cacheTag` for genuinely cacheable, non-personal
  data only.
- **No `runtime = 'edge'`.** Cache Components is Node.js runtime only — this
  affects Route Handlers, `proxy.ts` and `instrumentation.ts`.
- **Legacy segment configs are no-ops.** Do not use `export const dynamic`,
  `revalidate`, `fetchCache`, `experimental_ppr`, `unstable_cache` or
  `unstable_noStore`. Use `"use cache"` + `cacheLife`/`cacheTag` +
  `updateTag`/`revalidateTag` instead.
- **Auth gating lives in `src/proxy.ts`, not `middleware.ts`** (renamed in this
  version).
- **Let the React Compiler handle memoisation** — avoid manual
  `useMemo`/`useCallback` busywork.

---

## Technical stack

### Application

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui only for components that materially speed up implementation
- Native server-side `fetch`
- TanStack Query for client-side quote polling and cached async state
- Zod for request and upstream-response validation
- React Hook Form for LoginForm state and validation integration

### Development and tests

- MSW for deterministic API mocking
  - `msw/node` for Vitest and server-side development interception
  - optional browser worker only where browser-level mocks are useful
- Vitest
- React Testing Library
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- Playwright

### Quality controls

- ESLint
- Prettier
- TypeScript compiler check
- Husky pre-commit hook

### Authentication implementation decision

Use **Auth.js (NextAuth) v5** with the Credentials provider and JWT session
strategy.

Authentication flow:

1. the unauthenticated user can access only `/login` and the Auth.js callback
   routes required to complete authentication;
2. the Credentials provider calls the Smarkets login endpoint;
3. after successful Smarkets authentication, `authorize()` retrieves the
   current Smarkets user profile;
4. safe profile fields are copied into the Auth.js `User`, JWT and client-visible
   `Session` through typed callbacks;
5. the Smarkets session token remains JWT-only and server-only;
6. `src/proxy.ts` protects the homepage and event routes;
7. an authenticated user visiting `/login` is redirected to `/`;
8. logout invalidates the upstream Smarkets session on a best-effort basis and
   then calls Auth.js `signOut()`.

Use module augmentation for `Session`, `User` and `JWT`; do not use `any`.
The Auth.js provider makes the safe user profile available client-side, but must
never expose the Smarkets token or refresh token.

---

## Required Smarkets API endpoints

### Authentication

#### Login

HAR-confirmed live contract:

```http
POST /v3/sessions/
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "secret",
  "remember": false,
  "create_social_member": true
}
```

Expected successful response:

```json
{
  "created_social_member": false,
  "factor": "complete",
  "refresh_token": "string",
  "token": "string",
  "stop": "ISO datetime",
  "verify": false
}
```

Implementation rules:

- use the HAR-confirmed `POST` method and request body above;
- verify the authenticated follow-up header once because sanitised HAR exports may omit it;
- accept only `factor === "complete"` for the MVP;
- return a clear unsupported-MFA error for `totp` or other factors;
- never return `token` or `refresh_token` to the Client Component;
- normalise invalid-credential and upstream errors.

#### Logout

Captured contract:

```http
DELETE /v0/sessions/current/
```

Expected response:

```json
{ "success": true }
```

Call upstream logout on a best-effort basis, then clear the local session cookie
even if upstream invalidation fails.

### Homepage events

```http
GET /v3/events/
```

Use filters such as upcoming/live state, domain, pagination and hidden-event
exclusion. Select a small homepage set, for example 6–10 bettable events.

Relevant fields:

- `id`
- `name`
- `short_name`
- `state`
- `start_datetime`
- `bettable`
- `hidden`
- `display_order`
- `type`
- `full_slug`

### Event details

```http
GET /v3/events/{event_ids}/
```

Use a single event ID on the event page. IDs are the API identity; slugs are for
presentation only.

### Markets for events

```http
GET /v3/events/{event_ids}/markets/
```

Use one batched request for the selected homepage event IDs where supported.
Filter out hidden and unavailable markets. Select one primary market per event
for the homepage and show a broader list on the event page.

Identify market semantics through `market_type`, not display `name` or `slug`.

### Contracts for markets

```http
GET /v3/markets/{market_ids}/contracts/
```

The endpoint supports up to 100 market IDs. Batch selected markets, group the
returned contracts by `market_id` and order them by `display_order`.

Identify contract semantics through `contract_type`, not display `name` or
`slug`.

### Current quotes

```http
GET /v3/markets/{market_ids}/quotes/
```

The endpoint supports up to 200 market IDs and returns an object keyed by
contract ID. Each contract book contains:

```ts
type QuoteBook = {
  bids: Array<{ price: number; quantity: number }>
  offers: Array<{ price: number; quantity: number }>
}
```

Price is expressed in percentage basis points:

```ts
const decimalOdds = 10_000 / price
```

Implementation rules:

- batch every currently displayed market ID into one polling request;
- default to a 5-second interval, configurable to 10 seconds if the account has
  lower limits;
- set `refetchIntervalInBackground: false`;
- retain the last successful prices during refetch or temporary failure;
- stop automatic retries for `401`, `403` and `429`;
- display an em dash when no quote exists;
- label bid/offer conservatively until the exact back/lay mapping is verified.

---

## Optional endpoints — only after MVP

### Last executed prices

```http
GET /v3/markets/{market_ids}/last_executed_prices/
```

Useful for a “last traded” value, but not a replacement for current quotes.

### Traded volumes

```http
GET /v3/markets/{market_ids}/volumes/
```

Useful as secondary market metadata, for example “£12,500 traded”. Do not use it
as the primary regularly updating contract price.

### Event state / scores

```http
GET /v3/events/{event_ids}/states/
```

Useful stretch goal for live score and clock information.

### Competitors

```http
GET /v3/events/{event_ids}/competitors/
```

Useful for structured home/away presentation.

### User profile — required during authentication

```http
GET /v0/users/current/info-without-rate/
```

After the Smarkets session is created, Auth.js `authorize()` must retrieve the
current user profile before returning an authenticated user.

Expose only safe, useful fields through the Auth.js client session, for example:

- `id` / `memberId`
- `email`
- `givenName`
- `familyName`
- `currency`
- `country`
- `betPermission`
- `permittedCountry`

Keep the following server-only:

- Smarkets session token
- refresh token
- raw upstream response fields not used by the UI
- changing account values such as balance, exposure and available balance

### Account balance — optional enhancement

```http
GET /v3/accounts/
```

Balance is not required for the assignment. If implemented, fetch it live from a
protected server route rather than storing a changing balance permanently in the
Auth.js JWT.

---

## Explicitly excluded

Do not implement:

- order placement;
- order cancellation or amendment;
- cash-out;
- deposits or withdrawals;
- transaction history;
- exposure management;
- account settings;
- signup;
- full MFA/TOTP flow;
- streaming or odds-feed parsing unless the quotes endpoint proves unusable.

---

## Application architecture

```text
Browser
  ├── Server-rendered pages
  │     └── server-only Smarkets client
  └── Client Components
        └── same-origin /api routes
              └── server-only Smarkets client
                    └── api.smarkets.com
```

### Naming convention

Apply these names consistently:

- **React components and component files:** PascalCase, for example
  `LoginForm.tsx`, `EventCard.tsx`, `QuotesContextProvider.tsx`.
- **Logic, utilities, hooks, schemas, fixtures and test helpers:** camelCase, for
  example `smarketsClient.ts`, `marketMappers.ts`, `useLiveQuotes.ts`,
  `testQueryClient.tsx`.
- **Next.js convention files:** retain framework-required lowercase names such as
  `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx` and `proxy.ts`.
- **Test files:** match the source filename, for example `LoginForm.test.tsx` and
  `smarketsClient.test.ts`.
- Do not introduce kebab-case source filenames. Route URL segments may remain
  lowercase because they form public URLs.

### Suggested source tree

```text
src/
  app/
    (auth)/
      login/
        page.tsx
    (protected)/
      layout.tsx
      page.tsx
      events/[eventId]/page.tsx
    api/
      auth/
        [...nextauth]/route.ts
      smarkets/
        logout/route.ts
        quotes/route.ts
        account/route.ts            # optional
  components/
    auth/
      LoginForm.tsx
      LogoutButton.tsx
    events/
      EventCard.tsx
      EventList.tsx
    markets/
      MarketCard.tsx
      ContractRow.tsx
    layout/
      UserHeader.tsx
    ui/
  lib/
    auth.ts                          # Auth.js config and callbacks
    smarkets/
      smarketsClient.ts
      events.ts
      markets.ts
      contracts.ts
      quotes.ts
      schemas.ts
      errors.ts
      mappers.ts
      idPath.ts
  mocks/
    fixtures/
      authFixtures.ts
      eventFixtures.ts
      marketFixtures.ts
      contractFixtures.ts
      quoteFixtures.ts
    handlers/
      upstreamAuthHandlers.ts
      upstreamEventHandlers.ts
      upstreamMarketHandlers.ts
      upstreamContractHandlers.ts
      upstreamQuoteHandlers.ts
      internalApiHandlers.ts
      index.ts
    browser.ts                       # only if browser-level mocks are needed
    server.ts
  providers/
    AppProviders.tsx                # SessionProvider + QueryClientProvider
    QueryProvider.tsx
    QuotesContextProvider.tsx
    QuotesStatusProvider.tsx
  test/
    setup.ts
    renderWithProviders.tsx
    testQueryClient.tsx
  types/
    next-auth.d.ts                  # Session/User/JWT augmentation
    index.ts                        # reusable types
  instrumentation.ts
  proxy.ts                           # Auth.js route protection
e2e/
  fixtures/
  login.spec.ts
  homepage.spec.ts
  eventPage.spec.ts
  errors.spec.ts
.env.example
README.md
playwright.config.ts
vitest.config.ts
```

### Auth.js configuration

Use `src/lib/auth.ts` as the single Auth.js configuration module.

Recommended configuration:

```ts
NextAuth({
  session: { strategy: "jwt" },
  providers: [Credentials(...)],
  pages: { signIn: "/login" },
  callbacks: {
    jwt,
    session,
    authorized,
  },
});
```

`authorize()` responsibilities:

```text
validate credentials with Zod
  → POST /v3/sessions/
  → reject factor !== "complete"
  → GET /v0/users/current/info-without-rate/
  → optionally GET /v3/accounts/ in parallel when account summary is displayed
  → return typed Auth.js User containing safe profile fields plus server-only
    token fields needed by the jwt callback
```

JWT callback responsibilities:

- persist the Smarkets token and optional refresh token in the encrypted Auth.js
  JWT cookie;
- persist the safe profile fields required to rebuild the session;
- never return the token to browser code.

Session callback responsibilities:

- copy only safe profile fields to `session.user`;
- make that profile available through `SessionProvider`, `useSession()` and
  server-side `auth()`;
- never add `smkToken` or `refreshToken` to the session object.

Suggested augmented client session shape:

```ts
type SessionUser = {
  id: string
  memberId: number
  email: string
  givenName: string
  familyName: string
  currency: string
  country: string
  betPermission: boolean
  permittedCountry: boolean
}
```

Use the exact nullability observed in the real response rather than forcing
fields to be non-null without validation.

### Route protection with `proxy.ts`

Use the Next.js/Auth.js `proxy.ts` convention supported by the selected Next.js
version.

Access policy:

```text
Unauthenticated:
  /login                       allowed
  /api/auth/*                  allowed for Auth.js
  protected application pages redirected to /login?callbackUrl=...

Authenticated:
  /                            allowed
  /events/[eventId]            allowed
  /login                       redirected to /
```

Do not rely only on the proxy for security. Protected Route Handlers and
server-side Smarkets functions must call `auth()` and reject requests without a
valid server session/token.

The protected layout should call `auth()` and pass the initial session into
`AppProviders`. `SessionProvider` then makes the safe profile summary immediately
available to Client Components through `useSession()` without exposing the Smarkets
token. TanStack Query is nested in the same provider composition.

### Logout flow

The logout control should:

1. call the protected `/api/smarkets/logout` Route Handler;
2. let that handler send `DELETE /v0/sessions/current/` with the server-only
   Smarkets token;
3. clear the local Auth.js session by calling `signOut({ callbackUrl: "/login" })`;
4. clear the local session even when upstream logout fails.

### Shared Smarkets client

All upstream calls go through one server-only wrapper responsible for:

- base URL;
- `Authorization: Session-Token ...`;
- timeout/abort handling;
- JSON parsing;
- Zod validation;
- structured errors;
- `cache: "no-store"` for authenticated and fast-changing resources;
- safe logging with credentials and tokens redacted.

Do not put mock branching inside the client. MSW should intercept network calls
in mock-enabled environments.

### View-model composition

Homepage server flow:

```text
GET events
  → choose featured events
  → GET markets for selected event IDs
  → choose one featured market per event
  → GET contracts for selected market IDs
  → render initial cards
  → Client Component polls quotes for all visible market IDs
```

Event-page server flow:

```text
GET event + GET markets in parallel
  → filter/order displayable markets
  → GET contracts for selected market IDs
  → render event details
  → Client Component polls quotes for all visible market IDs
```

Create explicit view models rather than passing raw API payloads throughout the
component tree.

---

## MSW strategy

MSW is required for efficient development and deterministic tests.

### Mock two boundaries

1. **Upstream Smarkets handlers**  
   Intercept `https://api.smarkets.com/...`. Use these for server data-function
   and Route Handler integration tests, and for full mock-enabled development.

2. **Internal application API handlers**  
   Intercept Auth.js credential submission where needed, plus
   `/api/smarkets/logout` and `/api/smarkets/quotes`. Use these for isolated
   Client Component tests. Prefer mocking `next-auth/react` directly in focused
   LoginForm unit tests, while retaining at least one integration/E2E test of
   the actual Auth.js credentials flow.

### Development mode

Environment variable:

```env
API_MOCKING=enabled
```

`instrumentation.ts` starts the MSW Node server only when mocking is enabled.
Use `onUnhandledRequest: "bypass"` in development so Next.js internal requests
are not treated as failures.

Do not require a browser worker for Server Component data. A browser worker may
be added only for client-only development scenarios.

### Mock scenarios

Provide deterministic handlers for:

- successful login followed by profile retrieval;
- invalid credentials;
- profile retrieval failure after login;
- unsupported MFA response;
- expired session;
- featured events;
- no events;
- event with no markets;
- market with no contracts;
- first quote response;
- updated quote response;
- missing quote;
- `429` rate limit;
- `503` upstream unavailable;
- malformed upstream payload.

Use handler factories for sequential quote responses so mutable counters do not
leak across tests.

---

## TanStack Query design

Use TanStack Query only where client-side revalidation is valuable, primarily
quotes.

Suggested defaults:

```ts
{
  queries: {
    retry(failureCount, error) {
      if ([401, 403, 429].includes(error.status)) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: false
  }
}
```

Quote query:

```ts
{
  queryKey: ["quotes", sortedMarketIds],
  queryFn: () => getQuotes(sortedMarketIds),
  refetchInterval: 5_000,
  refetchIntervalInBackground: false,
  staleTime: 2_000
}
```

Normalise and sort IDs before building the query key so equivalent selections do
not create duplicate caches.

---

## Testing strategy

Authentication tests must cover both the Auth.js boundary and the UI behaviour.

- unit-test credential validation and upstream error mapping;
- test `authorize()` with MSW intercepting login and profile requests;
- test JWT/session callbacks to prove the Smarkets token remains absent from the
  client-visible session;
- mock `next-auth/react` in focused LoginForm and UserHeader component tests;
- use Playwright for the real application redirect flow: protected deep link →
  login → callback URL → authenticated page;
- test that an authenticated visit to `/login` redirects to `/`;
- test logout even when upstream session invalidation returns an error.

### Vitest configuration

Install and configure:

- `vitest`
- `@vitejs/plugin-react`
- `vite-tsconfig-paths`
- `jsdom`
- React Testing Library packages
- MSW

`src/test/setup.ts` must:

```text
beforeAll  → server.listen({ onUnhandledRequest: "error" })
afterEach  → cleanup(), server.resetHandlers(), restore real timers
afterAll   → server.close()
```

Unexpected network calls must fail automated tests.

### Test QueryClient

Create a new `QueryClient` per test render:

```ts
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
```

Never share the production QueryClient across tests. Return the client from the
custom render helper so a test can inspect or clear it.

### Unit tests

Prioritise:

- price-to-decimal-odds conversion;
- best bid/offer extraction;
- featured-event selection;
- featured-market selection;
- market/contract grouping;
- ID batching/path serialisation;
- Zod parsing of valid and malformed payloads;
- upstream error normalisation.

### Component tests

Prioritise:

- login validation and submission;
- invalid credentials and unsupported MFA;
- event-card rendering;
- contract rows with formatted quotes;
- quote loading state;
- quote update after polling interval;
- stale-price retention during a failed refetch;
- missing-price fallback;
- rate-limit state.

Use fake timers only around polling tests and always restore real timers.

### Route/data integration tests

Test server data functions and Route Handlers with MSW intercepting the actual
upstream URLs.

Important cases:

- token forwarded using the correct Authorization header;
- missing session returns `401`;
- malformed market IDs return `400`;
- upstream `429` remains a controlled `429`;
- malformed upstream response becomes `502`;
- token never appears in the client response.

Do not spend time unit-rendering async Server Components. Cover them through
plain data-function tests and Playwright.

---

## Playwright strategy

Run the Next.js test server with:

```env
API_MOCKING=enabled
```

This allows MSW Node handlers to intercept server-side Smarkets requests made by
Server Components. Use Playwright routing for browser-originated internal API
requests where a test needs precise sequential control, especially
`/api/smarkets/quotes`.

Required journeys:

1. login success and redirect;
2. invalid login error;
3. homepage renders featured events, markets and contracts;
4. displayed contract price changes after a polling interval;
5. clicking an event opens the event page;
6. event page displays more markets than its homepage card;
7. unauthenticated deep link redirects to login and returns after login;
8. rate-limit or temporary quote failure preserves the existing UI.

For tests other than the login-flow test, seed the expected secure session using
a supported test helper or test-only login route. Do not duplicate form login in
every spec.

Avoid third-party analytics, remote fonts and unrelated services. Mock or block
any unavoidable third-party browser request.

---

## Husky pre-commit quality gate

The requested pre-commit hook must run all of the following:

1. formatting check;
2. ESLint;
3. TypeScript type safety;
4. Vitest unit/component/integration tests;
5. Next.js production build.

Suggested scripts:

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "build": "next build",
    "validate": "npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build"
  }
}
```

`.husky/pre-commit`:

```sh
npm run validate
```

Do not run Playwright in pre-commit unless explicitly requested later. Run E2E
in CI and manually before submission.

---

## Implementation plan

Tasks are ordered by dependency. Parallelise only genuinely independent work.

### Phase 0 — verify contracts

- Save or inspect the current OpenAPI JSON.
- Confirm the login method and request body.
- Confirm path-array serialisation for multiple event/market IDs.
- Confirm one authenticated quote response and determine the display mapping of
  `bids`/`offers`.
- Record any discrepancy in `README.md`; do not block mock-driven UI development
  while waiting for every live case.

### Phase 1 — scaffold

- Create Next.js App Router project with strict TypeScript and Tailwind.
- Add minimal shadcn/ui components actually used.
- Install TanStack Query, Zod and React Hook Form.
- Create folder structure and `.env.example`.
- Add environment validation for `API_MOCKING` and session secret.

### Phase 2 — API contracts and fixtures

- Implement Zod schemas and TypeScript inferred types for consumed fields only.
- Create representative event, market, contract and quote fixtures.
- Implement the shared server-only Smarkets client.
- Implement ID batching/path encoding helper.
- Implement structured application errors.

### Phase 3 — MSW

- Implement upstream Smarkets handlers.
- Implement sequential quote-handler factory.
- Add `mocks/server.ts` and test lifecycle.
- Add conditional server mocking through `instrumentation.ts`.
- Add internal API handlers for isolated Client Component tests.

### Phase 4 — Auth.js authentication and protected routing

- Install and configure Auth.js v5 with the Credentials provider and JWT session
  strategy.
- Implement `src/lib/auth.ts` and
  `src/app/api/auth/[...nextauth]/route.ts`.
- In `authorize()`, validate credentials, call the Smarkets login endpoint, then
  retrieve `/v0/users/current/info-without-rate/` before returning the user.
- Implement typed JWT and session callbacks: keep Smarkets tokens JWT-only and
  expose safe profile fields through `session.user`.
- Add `src/types/next-auth.d.ts` module augmentation for `Session`, `User` and
  `JWT` without `any`.
- Add the root `SessionProvider` alongside the TanStack Query provider and pass
  the initial server session where practical.
- Implement `src/proxy.ts`: unauthenticated users may land only on `/login`;
  homepage and event pages require authentication; authenticated visits to
  `/login` redirect to `/`; preserve `callbackUrl` for deep-link return.
- Build the accessible login form using `signIn("credentials", ...)` and surface
  invalid credentials, profile-fetch failure and unsupported MFA clearly.
- Build `/api/smarkets/logout` for best-effort upstream invalidation, followed by
  Auth.js `signOut()` regardless of upstream outcome.
- Ensure protected Route Handlers and server data functions independently call
  `auth()` and require the server-only Smarkets token; do not rely on proxy-only
  protection.

### Phase 5 — homepage data

- Implement `getEvents`, `getMarketsByEventIds` and
  `getContractsByMarketIds`.
- Compose a small featured-event view model.
- Render homepage Server Component with loading, empty and error states.
- Keep market selection logic deterministic and tested.

### Phase 6 — quotes

- Build `/api/smarkets/quotes?marketIds=...`.
- Validate and cap IDs before calling upstream.
- Implement `QuotesContextProvider`, `QuotesStatusProvider` using one batched TanStack Query.
- Format decimal odds.
- Preserve prior data during refetch/failure.
- Add subtle updating status without replacing content with a spinner.

### Phase 7 — event page

- Build `/events/[eventId]`.
- Fetch event and markets concurrently.
- Fetch contracts after market selection.
- Display a broader market list than the homepage.
- Reuse the same batched quote component.

### Phase 8 — unit/component/integration tests

- Configure Vitest, JSDOM, RTL and MSW.
- Add isolated QueryClient render helper.
- Implement the high-priority tests listed above.
- Ensure no test reaches the live internet.

### Phase 9 — Playwright

- Configure a mock-enabled Next.js web server.
- Add login, homepage, price-update and event-page journeys.
- Add one degraded quote-response journey.
- configure ci run for merge to main.

### Phase 10 — quality and documentation

- Configure Prettier, ESLint and Husky.
- Run `npm run validate`.
- Run Playwright before submission.
- Complete `README.md` with:
  - setup instructions;
  - test/mock credentials behaviour;
  - stack justification;
  - endpoint composition;
  - security decisions;
  - polling/rate-limit decisions;
  - tests included;
  - challenges and confirmed API discrepancies;
  - known limitations;
  - improvements with more time.

---

## Six-hour priority order

### Must complete

- Auth.js login/logout with protected routing and client-visible safe profile;
- homepage event → market → contract composition;
- real current quotes with batched conservative polling;
- event details page;
- MSW mock mode;
- representative unit and component tests;
- at least one Playwright happy-path journey;
- formatting, linting, typecheck, tests and build passing;
- README technical summary.

### Complete if time remains

- more quote error-state tests;
- account balance widget;
- event states/live scores;
- volume display;
- price movement animation;
- broader Playwright coverage;
- accessibility automation.

### Do not spend time on

- trading operations;
- exhaustive schema reproduction;
- elaborate design system;
- full MFA;
- streaming feed integration;
- arbitrary coverage targets;
- complex caching optimisation.

---

## Definition of done

- Login works at least once against the real current Smarkets contract, or the
  exact external blocker is documented honestly.
- Unauthenticated users can access only the login experience and required
  Auth.js endpoints; protected deep links return to their original URL after
  login.
- Authenticated users visiting `/login` are redirected to `/`.
- The Smarkets session token is never exposed through the Auth.js client session
  or browser JavaScript.
- The Auth.js client session contains the validated safe Smarkets profile fields.
- The homepage displays multiple events with a featured market and contracts.
- Contract prices come from `/v3/markets/{market_ids}/quotes/` and update without
  a full page refresh.
- Quote polling is batched and remains within the documented route limit.
- The event page is reachable from the homepage and shows additional markets.
- Mock-enabled development and all automated tests avoid live Smarkets calls.
- Tests use isolated QueryClients and reset MSW handlers after each test.
- Playwright demonstrates the core user journey with deterministic data.
- No credentials or tokens are committed.
- `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test` and
  `npm run build` pass.
- The Husky pre-commit hook enforces the requested quality gate.
- `README.md` explains choices, challenges, trade-offs, limitations and next
  improvements.
