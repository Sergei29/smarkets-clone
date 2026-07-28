"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

const loginSchema = z.object({
  username: z.string().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
})

type LoginValues = z.infer<typeof loginSchema>

/** Maps `authorize()` error codes to user-facing copy. */
const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid username or password.",
  mfa_required:
    "This account requires multi-factor authentication, which isn't supported here.",
  profile_unavailable:
    "You were signed in, but we couldn't load your profile. Please try again.",
  login_unavailable:
    "Login is temporarily unavailable. Please try again shortly.",
}
const DEFAULT_ERROR = "Something went wrong signing in. Please try again."

const LoginForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const result = await signIn("credentials", { ...values, redirect: false })

    if (!result || result.error) {
      const code = result?.code ?? undefined
      setFormError((code && ERROR_MESSAGES[code]) || DEFAULT_ERROR)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  })

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Sign in failed</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="username">Email or username</FieldLabel>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            aria-invalid={Boolean(errors.username)}
            {...register("username")}
          />
          <FieldError
            errors={errors.username ? [errors.username] : undefined}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FieldError
            errors={errors.password ? [errors.password] : undefined}
          />
        </Field>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  )
}

export default LoginForm
