import { NextResponse } from "next/server"

/** proxies GET /v0/users/current/info-without-rate/ */
export const GET = async (req: Request) => {
  return NextResponse.json({ message: "Hello world!" })
}
