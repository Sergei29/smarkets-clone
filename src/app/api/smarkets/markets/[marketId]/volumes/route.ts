import { NextResponse } from "next/server"

/** proxies GET market volumes data */
export const GET = async (req: Request) => {
  return NextResponse.json({ message: "Hello world!" })
}
