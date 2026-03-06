"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800"
            aria-label="Alternar tema escuro/claro"
        >
            <Sun className="h-4 w-4 text-amber-500 transition-all dark:hidden" />
            <Moon className="hidden h-4 w-4 text-blue-400 transition-all dark:block" />
            <span className="sr-only">Alternar tema</span>
        </button>
    )
}
