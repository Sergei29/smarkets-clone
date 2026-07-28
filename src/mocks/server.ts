import { setupServer } from "msw/node"
import { handlers } from "./handlers"

/**
 * Node-side MSW server. Used by `src/instrumentation.ts` for mock-enabled
 * development and by `src/test/setup.ts` for Vitest's request interception.
 */
export const server = setupServer(...handlers)
