import { beforeEach, describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/mocks/server"
import {
  quotesRateLimitedHandler,
  malformedQuotesHandler,
} from "@/mocks/handlers/upstreamQuoteHandlers"
import { GET } from "./route"

const auth = vi.fn()
const getSmarketsToken = vi.fn()

vi.mock("@/lib/auth", () => ({ auth: () => auth() }))
vi.mock("@/lib/getSmarketsToken", () => ({
  getSmarketsToken: () => getSmarketsToken(),
}))

const request = (marketIds: string) =>
  new Request(`http://localhost/api/smarkets/quotes?marketIds=${marketIds}`)

beforeEach(() => {
  auth.mockReset()
  getSmarketsToken.mockReset()
})

describe("GET /api/smarkets/quotes", () => {
  it("returns 401 without calling upstream when there is no session", async () => {
    auth.mockResolvedValue(null)

    const res = await GET(request("2001"))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({
      error: "unauthorized",
      message: "Not authenticated",
    })
  })

  it("forwards the caller's Smarkets token as the Authorization header", async () => {
    auth.mockResolvedValue({ user: {} })
    getSmarketsToken.mockResolvedValue({ smkToken: "mock-session-token" })

    let capturedAuth: string | null = null
    server.use(
      http.get(
        "https://api.smarkets.com/v3/markets/:marketIds/quotes/",
        ({ request: upstreamRequest }) => {
          capturedAuth = upstreamRequest.headers.get("authorization")
          return HttpResponse.json({})
        },
      ),
    )

    const res = await GET(request("2001"))

    expect(res.status).toBe(200)
    expect(capturedAuth).toBe("Session-Token mock-session-token")
  })

  it("never echoes the Smarkets token back to the caller", async () => {
    auth.mockResolvedValue({ user: {} })
    getSmarketsToken.mockResolvedValue({ smkToken: "mock-session-token" })

    const res = await GET(request("2001"))
    const body = await res.text()

    expect(res.status).toBe(200)
    expect(body).not.toContain("mock-session-token")
  })

  it("returns 400 for a malformed market id", async () => {
    auth.mockResolvedValue({ user: {} })
    getSmarketsToken.mockResolvedValue({ smkToken: "mock-session-token" })

    const res = await GET(request("not-an-id"))

    expect(res.status).toBe(400)
  })

  it("passes through a controlled 429 on upstream rate limiting", async () => {
    auth.mockResolvedValue({ user: {} })
    getSmarketsToken.mockResolvedValue({ smkToken: "mock-session-token" })
    server.use(quotesRateLimitedHandler)

    const res = await GET(request("2001"))

    expect(res.status).toBe(429)
  })

  it("returns 502 when the upstream response is malformed", async () => {
    auth.mockResolvedValue({ user: {} })
    getSmarketsToken.mockResolvedValue({ smkToken: "mock-session-token" })
    server.use(malformedQuotesHandler)

    const res = await GET(request("2001"))

    expect(res.status).toBe(502)
  })
})
