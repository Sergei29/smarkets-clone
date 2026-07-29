import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"
import { smarketsFetch } from "./smarketsClient"
import { SmarketsError } from "./errors"

const BASE_URL = "https://api.smarkets.com"

const okResponse = (body: unknown = {}, status = 200) => ({
  ok: true,
  status,
  text: vi.fn().mockResolvedValue(""),
  json: vi.fn().mockResolvedValue(body),
})

const errorResponse = (status: number, text = "") => ({
  ok: false,
  status,
  text: vi.fn().mockResolvedValue(text),
  json: vi.fn(),
})

const stubFetch = (
  impl: (input: RequestInfo | URL, init?: RequestInit) => unknown,
) => {
  const fetchMock = vi.fn(impl)
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("request construction", () => {
  it("requests the full upstream URL", async () => {
    const fetchMock = stubFetch(() => okResponse())
    await smarketsFetch("/v3/events/")
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/v3/events/`,
      expect.anything(),
    )
  })

  it("defaults to GET and cache: no-store", async () => {
    const fetchMock = stubFetch(() => okResponse())
    await smarketsFetch("/v3/events/")
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe("GET")
    expect(init.cache).toBe("no-store")
  })

  it("respects an overridden method and cache", async () => {
    const fetchMock = stubFetch(() => okResponse())
    await smarketsFetch("/v3/sessions/", { method: "POST", cache: "reload" })
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe("POST")
    expect(init.cache).toBe("reload")
  })

  it("serializes the body as JSON and sets Content-Type when a body is given", async () => {
    const fetchMock = stubFetch(() => okResponse())
    await smarketsFetch("/v3/sessions/", {
      method: "POST",
      body: { username: "a", password: "b" },
    })
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body).toBe(JSON.stringify({ username: "a", password: "b" }))
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    )
  })

  it("omits Content-Type and body when no body is given", async () => {
    const fetchMock = stubFetch(() => okResponse())
    await smarketsFetch("/v3/events/")
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body).toBeUndefined()
    expect(
      (init.headers as Record<string, string>)["Content-Type"],
    ).toBeUndefined()
  })

  it("sets the Session-Token Authorization header when a token is given", async () => {
    const fetchMock = stubFetch(() => okResponse())
    await smarketsFetch("/v3/accounts/", { token: "abc123" })
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Session-Token abc123",
    )
  })

  it("omits the Authorization header when no token is given", async () => {
    const fetchMock = stubFetch(() => okResponse())
    await smarketsFetch("/v3/events/")
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(
      (init.headers as Record<string, string>)["Authorization"],
    ).toBeUndefined()
  })
})

describe("success responses", () => {
  it("returns the parsed JSON body when no schema is given", async () => {
    stubFetch(() => okResponse({ hello: "world" }))
    await expect(smarketsFetch("/v3/events/")).resolves.toEqual({
      hello: "world",
    })
  })

  it("returns undefined for a 204 without attempting to parse a body", async () => {
    const response = okResponse(undefined, 204)
    stubFetch(() => response)
    await expect(
      smarketsFetch("/v3/sessions/current/"),
    ).resolves.toBeUndefined()
    expect(response.json).not.toHaveBeenCalled()
  })

  it("validates and narrows the response when a schema is given", async () => {
    const schema = z.object({ id: z.string() })
    stubFetch(() => okResponse({ id: "1", extra: "stripped" }))
    await expect(smarketsFetch("/v3/events/1/", { schema })).resolves.toEqual({
      id: "1",
    })
  })

  it("throws a validation error when the response fails schema validation", async () => {
    const schema = z.object({ id: z.string() })
    stubFetch(() => okResponse({ id: 123 }))
    await expect(
      smarketsFetch("/v3/events/1/", { schema }),
    ).rejects.toMatchObject({
      name: "SmarketsError",
      code: "validation_error",
    })
  })
})

describe("error responses", () => {
  it("maps a 401 to an unauthorized SmarketsError", async () => {
    stubFetch(() => errorResponse(401))
    await expect(smarketsFetch("/v3/accounts/")).rejects.toMatchObject({
      name: "SmarketsError",
      code: "unauthorized",
      status: 401,
      upstreamStatus: 401,
    })
  })

  it("maps a 429 to a rate_limited SmarketsError", async () => {
    stubFetch(() => errorResponse(429))
    await expect(smarketsFetch("/v3/markets/1/quotes/")).rejects.toMatchObject({
      code: "rate_limited",
      status: 429,
    })
  })

  it("maps an unlisted upstream status to a generic upstream_error (502)", async () => {
    stubFetch(() => errorResponse(503))
    await expect(smarketsFetch("/v3/events/")).rejects.toMatchObject({
      code: "upstream_error",
      status: 502,
      upstreamStatus: 503,
    })
  })

  it("drains the response body on a non-2xx response", async () => {
    const response = errorResponse(500, "internal server error")
    stubFetch(() => response)
    await expect(smarketsFetch("/v3/events/")).rejects.toThrow(SmarketsError)
    expect(response.text).toHaveBeenCalled()
  })

  it("does not throw if draining the error body itself fails", async () => {
    const response = errorResponse(500)
    response.text.mockRejectedValue(new Error("stream already read"))
    stubFetch(() => response)
    await expect(smarketsFetch("/v3/events/")).rejects.toMatchObject({
      code: "upstream_error",
    })
  })

  it("throws a validation error when the body isn't valid JSON", async () => {
    const response = okResponse()
    response.json.mockRejectedValue(new SyntaxError("Unexpected token"))
    stubFetch(() => response)
    await expect(smarketsFetch("/v3/events/")).rejects.toMatchObject({
      code: "validation_error",
    })
  })
})

describe("timeout & abort", () => {
  it("throws a timeout error when the request exceeds timeoutMs", async () => {
    vi.useFakeTimers()
    stubFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(
              new DOMException("The operation was aborted.", "AbortError"),
            ),
          )
        }),
    )

    const promise = smarketsFetch("/v3/events/", { timeoutMs: 1_000 })
    const assertion = expect(promise).rejects.toMatchObject({
      name: "SmarketsError",
      code: "timeout",
    })
    await vi.advanceTimersByTimeAsync(1_000)
    await assertion
  })

  it("throws a network error for a generic fetch failure (not a timeout)", async () => {
    stubFetch(() => Promise.reject(new Error("getaddrinfo ENOTFOUND")))
    await expect(smarketsFetch("/v3/events/")).rejects.toMatchObject({
      name: "SmarketsError",
      code: "network_error",
    })
  })

  it("aborts when the caller-provided signal is already aborted", async () => {
    stubFetch(
      () =>
        new Promise((_resolve, reject) =>
          reject(new DOMException("The operation was aborted.", "AbortError")),
        ),
    )
    const controller = new AbortController()
    controller.abort()

    await expect(
      smarketsFetch("/v3/events/", { signal: controller.signal }),
    ).rejects.toMatchObject({ name: "SmarketsError", code: "timeout" })
  })
})

describe("failure logging never includes the token or request body", () => {
  it("logs only method/path/code/upstreamStatus on an upstream error", async () => {
    stubFetch(() => errorResponse(401))
    await expect(
      smarketsFetch("/v3/accounts/", { token: "top-secret-token" }),
    ).rejects.toThrow()

    expect(console.error).toHaveBeenCalledWith(
      "[smarkets] upstream request failed",
      {
        method: "GET",
        path: "/v3/accounts/",
        code: "unauthorized",
        upstreamStatus: 401,
      },
    )
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logged).not.toContain("top-secret-token")
  })

  it("never logs the request body on a network failure", async () => {
    stubFetch(() => Promise.reject(new Error("network down")))
    await expect(
      smarketsFetch("/v3/sessions/", {
        method: "POST",
        token: "top-secret-token",
        body: { username: "a", password: "super-secret-password" },
      }),
    ).rejects.toThrow()

    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logged).not.toContain("top-secret-token")
    expect(logged).not.toContain("super-secret-password")
  })
})
