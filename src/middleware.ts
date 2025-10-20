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
  if (isPublicRoute(req)) return
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
    "/(api|trpc)(.*)",
  ],
}
