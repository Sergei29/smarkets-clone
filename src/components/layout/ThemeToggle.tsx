"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

const noopSubscribe = () => () => {}
/** True only after client hydration — avoids a server/client render mismatch on `resolvedTheme`. */
const useMounted = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      disabled={!mounted}
      onClick={() =>
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
      }
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun aria-hidden="true" />
      ) : (
        <Moon aria-hidden="true" />
      )}
    </Button>
  )
}

export default ThemeToggle
