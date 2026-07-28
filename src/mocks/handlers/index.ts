import { upstreamAuthHandlers } from "./upstreamAuthHandlers"
import { upstreamEventHandlers } from "./upstreamEventHandlers"
import { upstreamMarketHandlers } from "./upstreamMarketHandlers"
import { upstreamContractHandlers } from "./upstreamContractHandlers"
import { upstreamQuoteHandlers } from "./upstreamQuoteHandlers"
import { internalApiHandlers } from "./internalApiHandlers"

/**
 * Default, happy-path handler set: upstream Smarkets endpoints plus the
 * same-origin internal API. Used for both `instrumentation.ts` (dev-mode
 * server mocking) and as the Vitest baseline — individual tests override
 * specific handlers with `server.use(...)` for error/edge-case scenarios.
 */
export const handlers = [
  ...upstreamAuthHandlers,
  ...upstreamEventHandlers,
  ...upstreamMarketHandlers,
  ...upstreamContractHandlers,
  ...upstreamQuoteHandlers,
  ...internalApiHandlers,
]

export * from "./upstreamAuthHandlers"
export * from "./upstreamEventHandlers"
export * from "./upstreamMarketHandlers"
export * from "./upstreamContractHandlers"
export * from "./upstreamQuoteHandlers"
export * from "./internalApiHandlers"
