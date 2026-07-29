import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import LogoutButton from "./LogoutButton"

const signOut = vi.fn()

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOut(...args),
}))

afterEach(() => {
  signOut.mockReset()
  vi.unstubAllGlobals()
})

describe("LogoutButton", () => {
  it("calls the logout route, then signs out locally", async () => {
    const fetchMock = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("fetch", fetchMock)
    signOut.mockResolvedValue(undefined)

    const user = userEvent.setup()
    render(<LogoutButton />)
    await user.click(screen.getByRole("button", { name: /sign out/i }))

    await waitFor(() => expect(signOut).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledWith("/api/smarkets/logout", {
      method: "POST",
    })
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" })
    expect(fetchMock.mock.invocationCallOrder[0]).toBeLessThan(
      signOut.mock.invocationCallOrder[0],
    )
  })

  it("still signs out locally when the upstream logout call fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))
    signOut.mockResolvedValue(undefined)

    const user = userEvent.setup()
    render(<LogoutButton />)
    await user.click(screen.getByRole("button", { name: /sign out/i }))

    await waitFor(() =>
      expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" }),
    )
  })

  it("disables the button and shows a pending label while signing out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(undefined))
    let resolveSignOut!: () => void
    signOut.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSignOut = resolve
      }),
    )

    const user = userEvent.setup()
    render(<LogoutButton />)
    await user.click(screen.getByRole("button", { name: /sign out/i }))

    const pendingButton = await screen.findByRole("button", {
      name: /signing out/i,
    })
    expect(pendingButton).toBeDisabled()

    resolveSignOut()
  })
})
