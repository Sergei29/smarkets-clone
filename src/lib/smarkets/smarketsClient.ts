/** Single upstream fetch choke point for the real Smarkets API. Server-only. */

const SMARKETS_API_BASE_URL = "https://api.smarkets.com"

export class SmarketsApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "SmarketsApiError"
    this.status = status
  }
}

export const smarketsFetch = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const res = await fetch(`${SMARKETS_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!res.ok) {
    throw new SmarketsApiError(
      res.status,
      `Smarkets API error: ${res.status} ${res.statusText} (${path})`,
    )
  }

  if (res.status === 204) {
    return undefined as T
  }

  return (await res.json()) as T
}
