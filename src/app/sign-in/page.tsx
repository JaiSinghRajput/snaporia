"use client"

import React, { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Loader from "@/components/ui/Loader"
import { motion, AnimatePresence } from "framer-motion"

export default function SignIn() {
  // Type guard for Clerk error shape
  const isClerkError = (e: unknown): e is { errors?: Array<{ message?: string }> } => {
    return (
      typeof e === 'object' &&
      e !== null &&
      'errors' in e &&
      Array.isArray((e as Record<string, unknown>).errors)
    )
  }

  const { isLoaded, signIn, setActive } = useSignIn()
  const router = useRouter()
  const [redirectTo, setRedirectTo] = useState<string>("/")
  // Compute safe redirect from query string once on mount
  React.useEffect(() => {
    try {
      const url = new URL(window.location.href)
      import("@/lib/redirect").then(({ getSafeRedirect }) => {
        const safe = getSafeRedirect(url, "/")
        setRedirectTo(safe)
      }).catch(() => setRedirectTo("/"))
    } catch {
      setRedirectTo("/")
    }
  }, [])

  const [emailAddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (!isLoaded) return <Loader />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return
    setError("")
    setLoading(true)

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        router.push(redirectTo || "/")
      } else {
        setError("Sign-in incomplete. Please try again.")
      }
    } catch (err: unknown) {
      console.error("Sign-in error:", err)
      const message = isClerkError(err) && err.errors?.[0]?.message
        ? err.errors[0].message
        : 'Invalid credentials.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // Handle Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: redirectTo || "/",
      })
    } catch (err) {
      console.error("Google Sign-in failed:", err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-all duration-500">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-gray-200 dark:border-gray-700"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key="signin-form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl font-extrabold text-center text-gray-900 dark:text-gray-100 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
              Sign in to your account
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
              autoComplete="off"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 transition-all duration-200 rounded-xl shadow-md"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Don’t have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/sign-up")}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-grow h-px bg-gray-300 dark:bg-gray-700" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                or
              </span>
              <div className="flex-grow h-px bg-gray-300 dark:bg-gray-700" />
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
            >
              <Mail className="w-4 h-4" />
              Continue with Google
            </Button>
            {/* Smart CAPTCHA mount point for Clerk bot protection */}
            <div id="clerk-captcha" className="mt-4" />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
