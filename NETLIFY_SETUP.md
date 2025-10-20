# Netlify Deployment Setup

## Environment Variables Configuration

When deploying to Netlify, add these environment variables in your Netlify dashboard:
**Site Settings → Environment Variables**

### Required Environment Variables:

```bash
# ================================
# CLERK AUTHENTICATION
# ================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
CLERK_SECRET_KEY=sk_test_your-secret-here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
CLERK_WEBHOOK_SECRET=whsec_your-webhook-secret

# ================================
# DATABASE
# ================================
DATABASE_URL=postgresql://your-connection-string
DIRECT_URL=postgresql://your-direct-connection-string

# ================================
# SUPABASE
# ================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ================================
# AWS S3 (CUSTOM VARIABLE NAMES FOR NETLIFY)
# ================================
# NOTE: Netlify reserves AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
# So we use SNAPORIA_ prefix instead
SNAPORIA_AWS_REGION=eu-north-1
SNAPORIA_AWS_ACCESS_KEY_ID=your-access-key
SNAPORIA_AWS_SECRET_ACCESS_KEY=your-secret-key
SNAPORIA_AWS_S3_BUCKET=your-bucket-name
SNAPORIA_AWS_S3_PREFIX=snaporia
```

## Build Settings

**Build command:** `pnpm run build`  
**Publish directory:** `.next`

## Important Notes:

1. **AWS Variables**: Netlify reserves standard AWS variable names (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). We use `SNAPORIA_` prefix to avoid conflicts.

2. **Database Connection**: Make sure your DATABASE_URL and DIRECT_URL are accessible from Netlify's servers.

3. **Clerk Webhook**: After deployment, update your Clerk webhook URL to point to your Netlify domain:
   - `https://your-site.netlify.app/api/webhooks/clerk`

4. **Build Optimization**: The `.vercelignore` file excludes large ffmpeg files to keep deployment size small.

## Deployment Steps:

1. Push your code to GitHub
2. Connect your GitHub repo to Netlify
3. Add all environment variables in Netlify dashboard
4. Deploy!

## Troubleshooting:

- **Build fails**: Check that all environment variables are set correctly
- **Database errors**: Verify DATABASE_URL and DIRECT_URL are correct
- **Auth issues**: Ensure Clerk environment variables match your Clerk dashboard
- **Upload errors**: Verify AWS credentials have proper S3 permissions
