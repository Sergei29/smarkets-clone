import "server-only"

import type { ZodType } from "zod"
import { SmarketsError } from "./errors"

/**
 * Single server-only choke point for the real Smarkets API.
 *
 * Responsibilities: base URL, `Authorization: Session-Token` injection,
 * timeout/abort, JSON parsing, optional Zod validation, structured errors,
 * `cache: "no-store"` by default, and logging that never emits tokens or bodies.
 *
 * `import "server-only"` makes bundling this into a Client Component a build
 * error — the Smarkets token must never reach the browser.
 */

const BASE_URL = "https://api.smarkets.com"
const DEFAULT_TIMEOUT_MS = 8_000

export type SmarketsRequest<T> = {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  /** Smarkets Session-Token; omit for anonymous requests such as login. */
  token?: string
  /** JSON request body (will be serialized). */
  body?: unknown
  /** Zod schema used to validate and narrow the response; omit to skip. */
  schema?: ZodType<T>
  /** External abort signal, combined with the internal timeout. */
  signal?: AbortSignal
  timeoutMs?: number
  /** Defaults to "no-store" for authenticated / fast-changing resources. */
  cache?: RequestCache
}

const buildHeaders = ({
  token,
  hasBody,
}: {
  token?: string
  hasBody: boolean
}): HeadersInit => {
  const headers: Record<string, string> = {}
  if (hasBody) headers["Content-Type"] = "application/json"
  /** The token lives only in this header and is never logged. */
  if (token) headers["Authorization"] = `Session-Token ${token}`
  return headers
}

const logUpstreamFailure = (context: {
  method: string
  path: string
  code: string
  upstreamStatus?: number
}): void => {
  /** Deliberately excludes headers, body and token. */
  console.error("[smarkets] upstream request failed", context)
}

/**
 * @description Fetches a Smarkets API endpoint with:
 * - structured error handling,
 * - optional Zod validation, and timeout/abort support.
 * - this function is server-only and should not be used in client-side code.
 * @template T The expected type of the response data, inferred from the provided Zod schema.
 * @param {string} path endpoint path, e.g. `/v3/sessions/`
 * @param {object} params containing fetch options and optional Zod schema for response validation, timeout and abort signal
 * @returns {Promise<T>} A promise that resolves to the parsed and validated response data of type T.
 */
export const smarketsFetch = async <T = unknown>(
  path: string,
  {
    method = "GET",
    token,
    body,
    schema,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cache = "no-store",
  }: SmarketsRequest<T> = {},
): Promise<T> => {
  /** The AbortController is used to implement a timeout, and also to combine with any external abort signal. */
  const controller = new AbortController()
  /** this is to handle our own timeout abort */
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  /** 1. Handle the external abort signal, if provided. If the external signal is already aborted, we abort immediately. Otherwise, we listen for the 'abort' event and abort our internal controller when it occurs. The `{ once: true }` option ensures that the event listener is removed after it fires once, preventing memory leaks. */
  if (signal) {
    if (signal.aborted) controller.abort()
    else
      signal.addEventListener("abort", () => controller.abort(), { once: true })
  }

  let res: Response
  /** 2. Fetch the upstream Smarkets API, with timeout and abort support. Any network error or timeout is wrapped in a structured SmarketsError. */
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      cache,
      headers: buildHeaders({ token, hasBody: body !== undefined }),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (cause) {
    if (controller.signal.aborted) {
      logUpstreamFailure({ method, path, code: "timeout" })
      throw SmarketsError.timeout()
    }
    logUpstreamFailure({ method, path, code: "network_error" })
    throw SmarketsError.network(undefined, cause)
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    /**
     * Drain the body for connection reuse, but never surface it to the client.
     * why?
     * - so the current http request is fully completed,
     * - then the current tcp/conn. can be reused for next requests,
     */
    await res.text().catch(() => "")

    const error = SmarketsError.fromUpstream(res.status)
    logUpstreamFailure({
      method,
      path,
      code: error.code,
      upstreamStatus: res.status,
    })
    throw error
  }

  if (res.status === 204) return undefined as T

  /**
   * 3. Parse the JSON response, with optional Zod validation.
   * Any parsing or validation error is wrapped in a structured SmarketsError.
   */
  let json: unknown
  try {
    json = await res.json()
  } catch (cause) {
    logUpstreamFailure({
      method,
      path,
      code: "validation_error",
      upstreamStatus: res.status,
    })
    throw SmarketsError.validation("Upstream returned invalid JSON", cause)
  }

  if (!schema) return json as T

  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    logUpstreamFailure({
      method,
      path,
      code: "validation_error",
      upstreamStatus: res.status,
    })
    throw SmarketsError.validation(
      "Upstream response failed schema validation",
      parsed.error,
    )
  }

  return parsed.data
}
