"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
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
  const [isNavigating, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [passwordFieldType, setPasswordFieldType] = useState<
    "text" | "password"
  >("password")

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

    /**
     * `router.push` returns void and only *starts* the navigation, so
     * `isSubmitting` would flip back to false while the destination's RSC
     * payload is still in flight — briefly re-enabling the form on a page the
     * user has already left. Wrapping it in a transition makes `isNavigating`
     * stay true until the new route actually commits.
     */
    startTransition(() => {
      router.push(callbackUrl)
    })
  })

  /**
   * Covers both halves of the flow:
   * - the credentials POST,
   * - then the navigation.
   */
  const isBusy = isSubmitting || isNavigating

  const togglePasswordFieldType = () =>
    setPasswordFieldType((current) =>
      current === "password" ? "text" : "password",
    )

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
          <div className="relative">
            <Input
              id="password"
              type={passwordFieldType}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-0 size-8 rounded-full"
              onClick={togglePasswordFieldType}
            >
              {passwordFieldType === "password" ? <Eye /> : <EyeOff />}
            </Button>
          </div>
          <FieldError
            errors={errors.password ? [errors.password] : undefined}
          />
        </Field>

        <Button type="submit" disabled={isBusy}>
          {isBusy ? "Signing in…" : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  )
}

export default LoginForm
