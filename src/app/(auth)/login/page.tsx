import type { Metadata } from "next"
import type { PageProps } from "@/types"

export const metadata: Metadata = {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LoginPage = async ({ params, searchParams }: PageProps) => {
  return (
    <>
      <h1 className="text-3xl font-bold underline text-center">Login Page</h1>
    </>
  )
}

export default LoginPage
