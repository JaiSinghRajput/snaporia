"use client"

import { useState, useEffect } from "react"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Sun, Moon } from "lucide-react"
import NotificationDropdown from "./NotificationDropdown"

export default function Header() {
  const router = useRouter()
  const [theme, setTheme] = useState<"light" | "dark">("light")

  // On mount, check localStorage or default to system preference
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null
    if (saved) {
      setTheme(saved)
      document.documentElement.classList.toggle("dark", saved === "dark")
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(prefersDark ? "dark" : "light")
      document.documentElement.classList.toggle("dark", prefersDark)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light"
    setTheme(nextTheme)
    localStorage.setItem("theme", nextTheme)
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
  }

  return (
    <header className="w-full h-16 px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 fixed top-0 left-0 z-50">
      <h1
        className="text-xl font-bold cursor-pointer"
        onClick={() => router.push("/")}
      >
        Snaporia
      </h1>

      <div className="flex items-center gap-4">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5 text-gray-700" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-400" />
          )}
        </button>

        <SignedOut>
          <Button
            onClick={() => router.push("/sign-up")}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Sign Up
          </Button>
        </SignedOut>

        <SignedIn>
          <NotificationDropdown />
          <UserButton />
        </SignedIn>
      </div>
    </header>
  )
}
