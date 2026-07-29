@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A take-home exercise cloning key Smarkets betting-exchange screens (login, homepage with live market prices, event detail page) against the real Smarkets API (`https://api.smarkets.com/v0/control/openapi/`). See `README.md` for the full brief. The project is a fresh `create-next-app` scaffold — most pages and every API route are still stubs (`throw new Error("Not implemented yet")`).

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test runner configured yet. Formatting is via Prettier (`.prettierrc`: `semi: false`) — no separate `format` script, run `npx prettier --write .`.

## Read this before writing any code

`node_modules/next/dist/docs/` is the authoritative doc set for the exact Next.js version pinned here (`16.2.12` — newer than this model's training data, with real breaking changes vs. the Next.js you know). Before implementing a feature, check the relevant guide there rather than assuming familiar Next.js behavior. Two changes in particular affect almost everything in this repo:

### `cacheComponents: true` is enabled (`next.config.ts`)

This turns on Cache Components (Partial Prerendering by default). Practical consequences:

- Nothing is cached or statically shelled unless marked. Reading `cookies()`, `headers()`, `searchParams`, or dynamic route `params` outside a `<Suspense>` boundary throws a build/dev error (`blocking-route`) instead of silently making the route dynamic.
- To cache a data-fetching function or a component/page, add the `"use cache"` directive at the top of it, plus `cacheLife(...)` from `next/cache` for TTL and `cacheTag(...)` for invalidation.
- Old route segment configs (`export const dynamic`, `revalidate`, `fetchCache`, `experimental_ppr`) and `unstable_cache`/`unstable_noStore` are gone/no-ops under this model — use `"use cache"` + `cacheLife`/`cacheTag` + `updateTag`/`revalidateTag` instead. Full mapping: `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`.
- `GET` route handlers follow the same prerender-or-cache rules as pages — see `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.
- `runtime = 'edge'` is not supported under Cache Components; Node.js runtime only.
- Component state now survives client-side navigation away and back (routes are kept via React `<Activity>` instead of unmounted) — don't rely on unmount to reset local state.

### `middleware.ts` has been renamed/replaced by `proxy.ts`

If auth gating or request rewriting is added, it belongs in a root `src/proxy.ts` (or `proxy.js`), not `middleware.ts`. See `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.

`reactCompiler: true` is also on (`babel-plugin-react-compiler` in devDependencies) — avoid manual `useMemo`/`useCallback` busywork the compiler already handles.

## Architecture

- **App Router only**, source rooted at `src/app`, path alias `@/*` → `src/*` (see `tsconfig.json`).
- Two route groups under `src/app/`:
  - `(auth)/` — unauthenticated pages (`login`). Has its own layout.
  - `(protected)/` — the authenticated app shell: homepage (`page.tsx`) and `events/[eventId]/page.tsx`. Has its own layout. No auth enforcement exists yet (would presumably live in `proxy.ts` per above).
- **Shared page prop types** live in `src/types/index.ts`: `PageProps<P, Q>` (App Router `params`/`searchParams` are Promises — always `await` them) and `ErrorPageProps`.
- **API proxy layer**: `src/app/api/smarkets/**/route.ts` — thin server-side proxies in front of the real Smarkets API. **`TASK.md` at the repo root is the authoritative spec for this project; where this file and `TASK.md` disagree, `TASK.md` wins.** Per `TASK.md`, credentials are **form-only**: users type them into the login form, Auth.js `authorize()` exchanges them for a Smarkets session token, and that token lives **only** inside the encrypted HTTP-only Auth.js JWT — never in `.env`, never in client JavaScript. The MVP proxy routes are:
  - `api/auth/[...nextauth]` → Auth.js (Credentials provider, JWT session)
  - `api/smarkets/logout` → `DELETE /v0/sessions/current/` (best-effort upstream invalidation)
  - `api/smarkets/quotes` → `GET /v3/markets/{market_ids}/quotes/` (batched, polled client-side)
  - `api/smarkets/account` → `GET /v3/accounts/` (optional balance widget)
  - The current scaffold still contains earlier stub routes (`accounts`, `profile`, `navigation`, `markets/[marketId]/volumes`) that reflect a superseded plan — `TASK.md` demotes navigation/volumes to optional and folds profile into `authorize()`; these are being refactored out.
- `src/lib/smarkets/smarketsClient.ts` (currently the flat `src/lib/smarketsClient.ts`) is the single server-only place for Smarkets auth/fetching — base URL, `Authorization: Session-Token`, timeout/abort, JSON parsing, Zod validation, structured errors, `cache: "no-store"` and redacted logging — reused by the route handlers above.
- Env vars (see `.env.example`, real values in untracked `.env`): `AUTH_SECRET` (Auth.js session/cookie signing) and `API_MOCKING` (`enabled` starts MSW via `instrumentation.ts`). **No Smarkets credentials belong in env** — they are form-only per `TASK.md`. With `API_MOCKING=enabled`, log in via the form with `test.user@example.com` / `correct-horse-battery-staple` (fixture in `src/mocks/fixtures/authFixtures.ts`; any other credentials correctly 401). `API_MOCKING` is read once at server boot, so **restart `next dev` after changing it** — toggling it in `.env` while a dev server is already running has no effect.
- Styling: Tailwind CSS v4 via `@tailwindcss/postcss` (no `tailwind.config.*` — v4 is CSS-first, see `src/app/globals.css`), Geist/Geist Mono fonts loaded through `next/font/google` in the root layout.

## Conventions

- No semicolons (Prettier `semi: false`) — match existing files.
- Route/page/layout `Metadata` exports and the `PageProps<P, Q>` type from `@/types` are used consistently even in stub pages — follow that pattern for new routes.
