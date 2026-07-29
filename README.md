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

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Mock-enabled development

Set `API_MOCKING=enabled` in `.env` (see `.env.example`) to run against MSW-mocked
Smarkets responses instead of the real API. `API_MOCKING` is read once when the
dev server boots (`src/instrumentation.ts`) — **restart `next dev` after
changing it**; toggling it in `.env` while a server is already running has no
effect until restarted.

With mocking enabled, log in with:

- Username: `test.user@example.com`
- Password: `correct-horse-battery-staple`

Any other credentials correctly return a `401 invalid credentials` error — the
mock only recognises this one pair (see
`src/mocks/fixtures/authFixtures.ts`). A second fixture account,
`mfa.user@example.com` / `correct-horse-battery-staple`, exercises the
unsupported-MFA error path instead of a successful login.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
