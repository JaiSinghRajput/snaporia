# Deployment Troubleshooting Guide

## Common Netlify Deployment Issues & Solutions

### Issue 1: "Export encountered an error on /_error: /404"

**Cause:** Next.js trying to statically generate dynamic routes at build time without database access or unknown route parameters.

**Solution:** ✅ Fixed by adding `export const dynamic = 'force-dynamic'` to dynamic pages.

Files affected:
- `src/app/profile/[username]/page.tsx` - Now renders dynamically

### Issue 2: Reserved AWS Environment Variables

**Error:** 
```
AWS_REGION: AWS_REGION is a reserved environment variable
AWS_ACCESS_KEY_ID: AWS_ACCESS_KEY_ID is a reserved environment variable
AWS_SECRET_ACCESS_KEY: AWS_SECRET_ACCESS_KEY is a reserved environment variable
```

**Cause:** Netlify reserves these variable names for their own AWS integration.

**Solution:** ✅ Renamed to use `SNAPORIA_` prefix:
- `AWS_REGION` → `SNAPORIA_AWS_REGION`
- `AWS_ACCESS_KEY_ID` → `SNAPORIA_AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` → `SNAPORIA_AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET` → `SNAPORIA_AWS_S3_BUCKET`
- `AWS_S3_PREFIX` → `SNAPORIA_AWS_S3_PREFIX`

### Issue 3: Next.js 15 Params Type Error

**Error:**
```
Type error: Type 'ProfilePageProps' does not satisfy the constraint 'PageProps'.
Types of property 'params' are incompatible.
```

**Cause:** Next.js 15 requires `params` to be a Promise in page components.

**Solution:** ✅ Updated params type:
```typescript
// Before
interface ProfilePageProps {
  params: { username: string }
}

// After
interface ProfilePageProps {
  params: Promise<{ username: string }>
}

// And await it in the component
const { username } = await params
```

### Issue 4: Turbopack in Production Build

**Error:** Various compilation errors and instability.

**Cause:** Turbopack (--turbopack flag) is not production-ready yet.

**Solution:** ✅ Removed `--turbopack` from production build:
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",  // No --turbopack
    "build:turbo": "next build --turbopack"  // Optional for local testing
  }
}
```

### Issue 5: Large Deployment Size (Vercel Timeout)

**Error:** Deployment stuck at "Deploying outputs..." for extended time.

**Cause:** Large ffmpeg.wasm files (~31MB) included in deployment.

**Solution:** ✅ Created `.vercelignore`:
```
# Exclude ffmpeg files (not currently used)
public/ffmpeg/
```

### Issue 6: SSO Callback Prerendering Error

**Error:** 
```
Export encountered an error on /sso-callback/page
Error: Event handlers cannot be passed to Client Component props
```

**Cause:** Next.js trying to prerender pages with client-side only components (like Clerk's auth callback).

**Solution:** ✅ Added dynamic rendering to auth pages:
```typescript
// In src/app/sso-callback/page.tsx
export const dynamic = 'force-dynamic'
```

### Issue 7: Missing 404 Page

**Error:** Build failing when trying to generate 404 page.

**Cause:** No custom not-found page for App Router.

**Solution:** ✅ Created `src/app/not-found.tsx` with 'use client' directive.

## Build Configuration

### netlify.toml (Simplified)
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

# The plugin handles everything automatically
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**Note:** Removed custom redirects and headers - the Next.js plugin handles these automatically.

### Environment Variables Checklist

Make sure ALL these variables are set in Netlify:

**Clerk:**
- ✅ CLERK_SECRET_KEY
- ✅ CLERK_WEBHOOK_SECRET
- ✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- ✅ NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
- ✅ NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
- ✅ NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
- ✅ NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

**Database:**
- ✅ DATABASE_URL
- ✅ DIRECT_URL

**Supabase:**
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY

**AWS S3 (with SNAPORIA_ prefix!):**
- ✅ SNAPORIA_AWS_REGION
- ✅ SNAPORIA_AWS_ACCESS_KEY_ID
- ✅ SNAPORIA_AWS_SECRET_ACCESS_KEY
- ✅ SNAPORIA_AWS_S3_BUCKET
- ✅ SNAPORIA_AWS_S3_PREFIX

**App Config:**
- ✅ NODE_ENV=production
- ✅ NEXT_PUBLIC_APP_URL=https://your-site.netlify.app

## Verification Steps

1. **Check build logs** for specific error messages
2. **Verify all environment variables** are set correctly
3. **Test locally** with `npm run build` (not pnpm if using Netlify)
4. **Check database connectivity** from Netlify's network
5. **Verify Prisma schema** is up to date (`prisma generate` runs in postinstall)

## Post-Deployment Tasks

1. **Update Clerk Webhook URL:**
   - Go to Clerk Dashboard → Webhooks
   - Update endpoint to: `https://your-site.netlify.app/api/webhooks/clerk`

2. **Test critical flows:**
   - Sign up / Sign in
   - Create post
   - Upload image/video
   - Follow user
   - Notifications

3. **Check production logs:**
   - Netlify Functions logs
   - Browser console for client errors
   - Database logs for connection issues

## Still Having Issues?

1. Check Netlify build logs for the exact error message
2. Verify environment variable names match exactly (case-sensitive!)
3. Make sure DATABASE_URL is accessible from Netlify's servers
4. Check if Prisma schema needs migration: `npm run db:migrate`
5. Clear Netlify build cache: Deploy Settings → Clear cache and retry deploy

## Success Indicators

✅ Build completes without errors
✅ All pages load correctly
✅ Database queries work
✅ File uploads to S3 work
✅ Authentication flow works
✅ Webhooks receive events

---

Last Updated: After fixing dynamic rendering for profile pages
Status: All known issues resolved ✅
