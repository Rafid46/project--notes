"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export default function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs focus:outline-none"
      >
        <div className="h-[18px] w-[18px]" />
      </button>
    )
  }

  const isDark = theme === "dark" || (theme === "system" && document.documentElement.classList.contains("dark"))

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus:outline-none"
    >
      <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  )
}
