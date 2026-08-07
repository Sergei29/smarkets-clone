import type { Metadata } from "next"
import { Suspense } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import LoginForm from "@/components/auth/LoginForm"

export const metadata: Metadata = {
  title: "Sign in",
}

const LoginPage = () => {
  return (
    <Card size="sm" className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Log in to your Smarkets account</CardDescription>
      </CardHeader>
      <CardContent>
        {/* LoginForm reads `callbackUrl` via useSearchParams → needs Suspense. */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}

export default LoginPage
