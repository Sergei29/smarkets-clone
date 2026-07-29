import { defineConfig, devices } from "@playwright/test"

const PORT = 3100
const baseURL = `http://localhost:${PORT}`

/**
 * Runs against a mock-enabled Next.js dev server (TASK.md "Playwright
 * strategy") on a dedicated port so it never collides with a locally running
 * `npm run dev`. `AUTH_SECRET` is generated fresh here rather than read from
 * `.env` so the suite boots deterministically in CI, where no `.env` file
 * exists.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: {
      API_MOCKING: "enabled",
      AUTH_SECRET:
        "139d381774b712bcd2c8d7c97165299d5d973ae631701590644be2036b19bc75",
    },
    stdout: "pipe",
    stderr: "pipe",
  },
})
