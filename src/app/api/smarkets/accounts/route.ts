import { NextResponse } from "next/server"

/** proxies GET /v3/accounts/ */
export const GET = async (req: Request) => {
  throw new Error("Not implemented yet")
  return NextResponse.json({ message: "Hello world!" })
}
