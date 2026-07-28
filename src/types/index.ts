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
