import { NextResponse } from "next/server"

/** proxies GET /v0/users/current/info-without-rate/ */
export const GET = async (req: Request) => {
  throw new Error("Not implemented yet")
  return NextResponse.json({ message: "Hello world!" })
}
