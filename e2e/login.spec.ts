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

test("the form stays pending for the whole navigation, not just the sign-in call", async ({
  page,
}) => {
  await page.goto("/login")
  await page.getByLabel("Email or username").fill(validCredentials.username)
  await page.getByLabel("Password").fill(validCredentials.password)
  await page.getByRole("button", { name: "Sign in" }).click()

  // `router.push` only *starts* the navigation, so a pending state tied to the
  // sign-in promise alone would clear here and leave the login form briefly
  // interactive on a page the user has already left. Sample the button until
  // the homepage commits; it must never return to an enabled "Sign in".
  const leaked = await page.evaluate(async () => {
    let sawEnabled = false
    const start = Date.now()
    while (location.pathname !== "/" && Date.now() - start < 10_000) {
      const button = Array.from(document.querySelectorAll("button")).find((b) =>
        /Sign in|Signing in/.test(b.textContent ?? ""),
      )
      if (
        button &&
        !button.hasAttribute("disabled") &&
        button.textContent?.trim() === "Sign in"
      ) {
        sawEnabled = true
      }
      await new Promise((resolve) => setTimeout(resolve, 5))
    }
    return sawEnabled
  })

  expect(leaked).toBe(false)
  await expect(page).toHaveURL("/")
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
