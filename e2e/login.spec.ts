import { test, expect } from "@playwright/test"
import { validCredentials } from "../src/mocks/fixtures/authFixtures"

// Login itself must run unauthenticated, overriding the project's default
// (authenticated) storage state.
test.use({ storageState: { cookies: [], origins: [] } })

test("login success redirects to the homepage", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email or username").fill(validCredentials.username)
  await page.getByLabel("Password").fill(validCredentials.password)
  await page.getByRole("button", { name: "Sign in" }).click()

  await expect(page).toHaveURL("/")
  await expect(
    page.getByRole("heading", { name: "Featured events" }),
  ).toBeVisible()
})

test("invalid credentials show an error and stay on the login page", async ({
  page,
}) => {
  await page.goto("/login")
  await page.getByLabel("Email or username").fill("wrong@example.com")
  await page.getByLabel("Password").fill("wrong-password")
  await page.getByRole("button", { name: "Sign in" }).click()

  await expect(page.getByText("Invalid username or password.")).toBeVisible()
  await expect(page).toHaveURL("/login")
})
