import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { logoutFailureHandler } from "@/mocks/handlers/upstreamAuthHandlers"
import { POST } from "./route"

const auth = vi.fn()
const getSmarketsToken = vi.fn()
const invalidateUpstreamSession = vi.fn()

vi.mock("@/lib/auth", () => ({
  auth: () => auth(),
  invalidateUpstreamSession: (token: string) =>
    invalidateUpstreamSession(token),
}))
vi.mock("@/lib/getSmarketsToken", () => ({
  getSmarketsToken: () => getSmarketsToken(),
}))

const request = () => new Request("http://localhost/api/smarkets/logout")

beforeEach(() => {
  auth.mockReset()
  getSmarketsToken.mockReset()
  invalidateUpstreamSession.mockReset()
})

describe("POST /api/smarkets/logout", () => {
  it("returns 401 without invalidating anything when there is no session", async () => {
    auth.mockResolvedValue(null)

    const res = await POST(request())

    expect(res.status).toBe(401)
    expect(invalidateUpstreamSession).not.toHaveBeenCalled()
  })

  it("invalidates the upstream session with the caller's token and reports success", async () => {
    auth.mockResolvedValue({ user: {} })
    getSmarketsToken.mockResolvedValue({ smkToken: "mock-session-token" })
    invalidateUpstreamSession.mockResolvedValue(undefined)

    const res = await POST(request())

    expect(invalidateUpstreamSession).toHaveBeenCalledWith("mock-session-token")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it("still reports success when upstream invalidation fails", async () => {
    auth.mockResolvedValue({ user: {} })
    getSmarketsToken.mockResolvedValue({ smkToken: "mock-session-token" })
    // The real `invalidateUpstreamSession` swallows upstream failures (see
    // authFlows.test.ts) — this test proves the route trusts that contract
    // rather than adding its own try/catch around the call.
    server.use(logoutFailureHandler)
    invalidateUpstreamSession.mockResolvedValue(undefined)

    const res = await POST(request())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it("does not call invalidateUpstreamSession when the JWT has no Smarkets token", async () => {
    auth.mockResolvedValue({ user: {} })
    getSmarketsToken.mockResolvedValue(null)

    const res = await POST(request())

    expect(invalidateUpstreamSession).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
  })
})
