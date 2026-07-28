import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSmarketsToken } from "@/lib/getSmarketsToken"
import { getQuotes } from "@/lib/smarkets/quotes"
import { toSmarketsError } from "@/lib/smarkets/errors"

/**
 * Same-origin proxy for `GET /v3/markets/{market_ids}/quotes/`, polled from the
 * browser by `useLiveQuotes`. Independently enforces authentication (does not
 * rely on `proxy.ts`), forwards the caller's Smarkets token for un-delayed
 * prices, and lets `getQuotes` → `buildIdPath` validate/cap the id list.
 */
export const GET = async (req: Request) => {
  const session = await auth()
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized", message: "Not authenticated" },
      { status: 401 },
    )
  }

  const { searchParams } = new URL(req.url)
  const marketIds = (searchParams.get("marketIds") ?? "").split(",")

  try {
    const token = await getSmarketsToken(req)
    const quotes = await getQuotes(marketIds, token?.smkToken)
    return NextResponse.json(quotes)
  } catch (error) {
    const smarketsError = toSmarketsError(error)
    return NextResponse.json(smarketsError.toClientJson(), {
      status: smarketsError.status,
    })
  }
}
