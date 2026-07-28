import { z } from "zod"

/**
 * Server-only environment validation.
 *
 * Credentials are form-only (see TASK.md) — no Smarkets username/password lives
 * here. Only configuration is validated: the Auth.js session secret and the
 * optional MSW mocking switch.
 */
const envSchema = z.object({
  AUTH_SECRET: z
    .string()
    .min(
      1,
      "AUTH_SECRET is required (used to sign the Auth.js session cookie)",
    ),
  API_MOCKING: z.literal("enabled").optional(),
})

const parsed = envSchema.safeParse({
  AUTH_SECRET: process.env.AUTH_SECRET,
  API_MOCKING: process.env.API_MOCKING,
})

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration:\n${z.prettifyError(parsed.error)}`,
  )
}

export const env = parsed.data

export const isMockingEnabled = env.API_MOCKING === "enabled"
