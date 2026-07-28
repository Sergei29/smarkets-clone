import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LoginForm from "./LoginForm"

const push = vi.fn()
const refresh = vi.fn()
const signIn = vi.fn()

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signIn(...args),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => new URLSearchParams(),
}))

const fillAndSubmit = async (username: string, password: string) => {
  const user = userEvent.setup()
  render(<LoginForm />)

  if (username) {
    await user.type(screen.getByLabelText("Email or username"), username)
  }
  if (password) {
    await user.type(screen.getByLabelText("Password"), password)
  }
  await user.click(screen.getByRole("button", { name: /sign in/i }))
}

describe("LoginForm", () => {
  beforeEach(() => {
    push.mockReset()
    refresh.mockReset()
    signIn.mockReset()
  })

  it("shows validation errors and never calls signIn when fields are empty", async () => {
    await fillAndSubmit("", "")

    expect(
      await screen.findByText("Enter your email or username"),
    ).toBeInTheDocument()
    expect(screen.getByText("Enter your password")).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })

  it("redirects to the callback URL on successful sign in", async () => {
    signIn.mockResolvedValue({ error: undefined, code: undefined, ok: true })

    await fillAndSubmit("test.user@example.com", "correct-horse-battery-staple")

    expect(signIn).toHaveBeenCalledWith("credentials", {
      username: "test.user@example.com",
      password: "correct-horse-battery-staple",
      redirect: false,
    })
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"))
    expect(refresh).toHaveBeenCalled()
  })

  it("shows an invalid-credentials message and does not redirect", async () => {
    signIn.mockResolvedValue({
      error: "CredentialsSignin",
      code: "invalid_credentials",
    })

    await fillAndSubmit("test.user@example.com", "wrong-password")

    expect(
      await screen.findByText("Invalid username or password."),
    ).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })

  it("shows an unsupported-MFA message for an mfa_required error code", async () => {
    signIn.mockResolvedValue({
      error: "CredentialsSignin",
      code: "mfa_required",
    })

    await fillAndSubmit("mfa.user@example.com", "correct-horse-battery-staple")

    expect(
      await screen.findByText(
        "This account requires multi-factor authentication, which isn't supported here.",
      ),
    ).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })
})
