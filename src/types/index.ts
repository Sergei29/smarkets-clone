import type { z } from "zod"
import type {
  eventSchema,
  marketSchema,
  marketTypeSchema,
  contractSchema,
  contractTypeSchema,
  priceLevelSchema,
  quoteBookSchema,
  quotesResponseSchema,
  sessionResponseSchema,
  profileSchema,
} from "@/lib/smarkets/schemas"

export type PageProps<
  P = Record<string, string>,
  Q = Record<string, string>,
> = {
  params: Promise<P>
  searchParams: Promise<Q>
}

export interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/** Inferred TypeScript types for the consumed Smarkets API surface. */

export type SmarketsEvent = z.infer<typeof eventSchema>
export type SmarketsMarket = z.infer<typeof marketSchema>
export type SmarketsMarketType = z.infer<typeof marketTypeSchema>
export type SmarketsContract = z.infer<typeof contractSchema>
export type SmarketsContractType = z.infer<typeof contractTypeSchema>
export type QuotePriceLevel = z.infer<typeof priceLevelSchema>
export type QuoteBook = z.infer<typeof quoteBookSchema>
export type QuotesResponse = z.infer<typeof quotesResponseSchema>

export type SmarketsSession = z.infer<typeof sessionResponseSchema>
export type SmarketsProfile = z.infer<typeof profileSchema>

/** Homepage view model — see `src/lib/homepage`. Composed server-side from the
 * raw event/market/contract payloads; deliberately excludes fields the
 * homepage doesn't render (slugs, market/contract types, display order). */
export type FeaturedContract = {
  id: string
  name: string
}

export type FeaturedMarket = {
  id: string
  name: string
  contracts: FeaturedContract[]
}

export type FeaturedEvent = {
  id: string
  name: string
  state: string
  startDatetime: string | null
  market: FeaturedMarket | null
}

/** Event-page view model — see `src/lib/event`. Same shape as `FeaturedEvent`
 * but carries the broader `markets` list the event page shows, reusing
 * `FeaturedMarket`/`FeaturedContract` rather than duplicating them. */
export type EventDetails = {
  id: string
  name: string
  state: string
  startDatetime: string | null
  markets: FeaturedMarket[]
}

/**
 * Safe, client-visible user profile exposed through the Auth.js session.
 * Deliberately excludes the Smarkets session token, refresh token and any
 * changing account values (balance, exposure). Shared by the profile mapper
 * and the `next-auth` module augmentation so there is a single source of truth.
 */
export type SmarketsSessionUser = {
  id: string
  memberId: number
  email: string
  givenName: string | null
  familyName: string | null
  currency: string | null
  country: string | null
  betPermission: boolean
  permittedCountry: boolean
}
