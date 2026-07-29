import { test, expect } from "@playwright/test"
import { validCredentials } from "../src/mocks/fixtures/authFixtures"
import { quoteFixtures } from "../src/mocks/fixtures/quoteFixtures"

test.describe("unauthenticated access", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("deep link redirects to login and returns there after login", async ({
    page,
  }) => {
    await page.goto("/events/1001")

    const redirectUrl = new URL(page.url())
    expect(redirectUrl.pathname).toBe("/login")
    expect(redirectUrl.searchParams.get("callbackUrl")).toBe("/events/1001")

    await page.getByLabel("Email or username").fill(validCredentials.username)
    await page.getByLabel("Password").fill(validCredentials.password)
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL("/events/1001")
    await expect(
      page.getByRole("heading", { name: "Arsenal vs Chelsea", level: 1 }),
    ).toBeVisible()
  })
})

test("a rate-limited quote refetch preserves the existing prices", async ({
  page,
}) => {
  let callCount = 0
  await page.route("**/api/smarkets/quotes**", async (route) => {
    callCount += 1
    if (callCount === 1) {
      await route.fulfill({ json: quoteFixtures })
      return
    }
    await route.fulfill({
      status: 429,
      json: { error: "rate_limited", message: "Too many requests" },
    })
  })

  await page.goto("/events/1001")
  await expect(page.getByLabel("Arsenal bid")).toHaveText("B 2.02")

  await page.waitForResponse(
    (res) => res.url().includes("/api/smarkets/quotes") && res.status() === 429,
  )
  await expect(page.getByLabel("Arsenal bid")).toHaveText("B 2.02")
})
