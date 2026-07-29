import { test as setup, expect } from "@playwright/test"
import { validCredentials } from "../src/mocks/fixtures/authFixtures"

const STORAGE_STATE = "e2e/.auth/user.json"

/**
 * Runs once (the "setup" project) before the "chromium" project's specs, all
 * of which depend on it and reuse the resulting storage state — per TASK.md,
 * only the login-flow spec itself performs form login; every other spec
 * seeds its session from here instead of repeating it.
 */
setup("authenticate", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email or username").fill(validCredentials.username)
  await page.getByLabel("Password").fill(validCredentials.password)
  await page.getByRole("button", { name: "Sign in" }).click()

  await expect(page).toHaveURL("/")
  await page.context().storageState({ path: STORAGE_STATE })
})
