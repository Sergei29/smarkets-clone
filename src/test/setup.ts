import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll, vi } from "vitest"
import { cleanup } from "@testing-library/react"
import { server } from "@/mocks/server"

// `import "server-only"` throws outside a react-server bundler condition
// (see node_modules/server-only/index.js) — Vitest never sets that condition,
// so any server-only module under test needs this no-op stand-in.
vi.mock("server-only", () => ({}))

// jsdom has no `matchMedia` — `next-themes` (via `renderWithProviders`'s
// `ThemeProvider`) calls it to resolve `enableSystem`.
window.matchMedia ??= (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
  vi.useRealTimers()
})

afterAll(() => server.close())
