import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

// Public routes: no auth required
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/webhooks/(.*)",
  "/api/upload(.*)", // Allow FormData passthrough, auth checked in route handler
])

export default clerkMiddleware(async (auth, req) => {
  // Never redirect API routes to HTML sign-in. Let API handlers return JSON 401.
  const pathname = req.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api')

  if (isPublicRoute(req) || isApiRoute) return

  const { userId, redirectToSignIn } = await auth()
  if (!userId) {
    return redirectToSignIn()
  }
})

export const config = {
  matcher: [
    // Skip static files and _next assets, run on all other routes (including API)
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    // Note: we still match API paths so Clerk auth is available, but we do not redirect API in the handler above
    "/(api|trpc)(.*)",
  ],
}
