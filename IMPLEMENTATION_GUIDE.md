# 🚀 Snaporia Implementation Guide - Phase 1 Complete!

## ✅ What We've Set Up

### 1. **Database Schema (Prisma)**
Created comprehensive schema in `prisma/schema.prisma`:
- ✅ UserProfile (extends Clerk users)
- ✅ Post (with images, videos, visibility)
- ✅ Like, Comment, Share, View
- ✅ Follow relationships
- ✅ Hashtag system
- ✅ Chat/Messaging (Conversation, Message)
- ✅ Notification system

### 2. **Database Utilities**
- ✅ `src/lib/prisma.ts` - Prisma client instance
- ✅ `src/lib/user.ts` - User profile functions
- ✅ `src/lib/posts.ts` - Post CRUD operations

### 3. **API Routes**
- ✅ `src/app/api/webhooks/clerk/route.ts` - Auto-create profiles
- ✅ `src/app/api/posts/route.ts` - Get feed posts
- ✅ `src/app/api/posts/create/route.ts` - Create new posts

---

## 🔧 Next Steps - Complete Setup

### Step 1: Setup Your Database (REQUIRED)

Choose ONE option:

#### Option A: Neon (Recommended - Free & Fast)
1. Go to https://neon.tech
2. Sign up and create a project named "snaporia"
3. Copy the connection string
4. Update `.env`:
```env
DATABASE_URL="postgresql://username:password@host/snaporia?sslmode=require"
```

#### Option B: Supabase (Free)
1. Go to https://supabase.com
2. Create project, go to Settings > Database
3. Copy connection string (Connection Pooling)
4. Update `.env`

#### Option C: Local PostgreSQL
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/snaporia"
```

### Step 2: Add Environment Variables

Update your `.env` file:
```env
# Database
DATABASE_URL="your_database_url_here"

# Clerk Webhook (for auto-creating user profiles)
CLERK_WEBHOOK_SECRET="your_webhook_secret"

# Existing Clerk keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_key"
CLERK_SECRET_KEY="your_secret"
```

### Step 3: Push Database Schema

Run these commands:
```bash
# Generate Prisma Client
pnpm prisma generate

# Push schema to database (creates all tables)
pnpm prisma db push

# Open Prisma Studio to view your database
pnpm prisma studio
```

### Step 4: Setup Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to: **Webhooks** in the sidebar
3. Click **Add Endpoint**
4. Enter your endpoint URL:
   - Development: `http://localhost:3000/api/webhooks/clerk`
   - Production: `https://yourdomain.com/api/webhooks/clerk`
5. Subscribe to these events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
6. Copy the **Signing Secret**
7. Add to `.env`:
   ```env
   CLERK_WEBHOOK_SECRET="whsec_..."
   ```

---

## 📝 Implementation Roadmap - What to Build Next

### Phase 2: User Profile Pages (START HERE)

#### 1. Create Profile Page `/profile/[username]/page.tsx`
```typescript
// Features to implement:
- Display user info (avatar, bio, stats)
- Show user's posts
- Follow/Unfollow button
- Edit profile button (if own profile)
- Tabs: Posts, Likes, Media
```

#### 2. Create Edit Profile Page `/profile/edit/page.tsx`
```typescript
// Features:
- Update bio, avatar, cover image
- Change username (check availability)
- Update location, website, DOB
- Privacy settings
```

#### 3. Create Profile API Routes
```
/api/profile/[username] - GET profile data
/api/profile/update - POST update profile
/api/profile/follow - POST follow user
/api/profile/unfollow - POST unfollow user
```

### Phase 3: Post Creation & Feed

#### 1. Create Post Composer `/create/page.tsx`
```typescript
// Features:
- Rich text input
- Image upload (use UploadThing or Cloudinary)
- Preview
- Visibility settings
- Draft/Publish
```

#### 2. Post Detail Page `/post/[id]/page.tsx`
```typescript
// Features:
- Full post view with SEO
- Comments section
- Like/Share buttons
- View count
- Related posts
```

#### 3. Update Home Feed
```typescript
// In src/app/page.tsx:
- Replace mock posts with real data from API
- Infinite scroll
- Optimistic UI updates
- Pull to refresh
```

### Phase 4: Engagement Features

#### 1. Implement Like System
```
- Add like button component
- Optimistic updates
- API routes: /api/posts/[id]/like
```

#### 2. Implement Comments
```
- Comment input component
- Nested replies
- API routes: /api/posts/[id]/comments
```

#### 3. Implement Share
```
- Share modal with options
- Copy link, social media share
- Track shares
```

### Phase 5: Search & Discovery

#### 1. Search Page `/search/page.tsx`
```typescript
// Features:
- Search users, posts, hashtags
- Filters (posts, people, media)
- Recent searches
```

#### 2. Hashtag Pages `/hashtag/[tag]/page.tsx`
```typescript
// Features:
- Posts with specific hashtag
- Trending hashtags sidebar
- Related hashtags
```

### Phase 6: Real-time Chat

#### 1. Setup Pusher/Ably
```bash
pnpm add pusher-js
pnpm add pusher
```

#### 2. Messages Page `/messages/page.tsx`
```typescript
// Features:
- Conversation list
- Real-time chat
- Online status
- Read receipts
```

---

## 🎨 Component Structure Recommendations

### Create these UI components:

```
src/components/
├── posts/
│   ├── PostCard.tsx          # Individual post display
│   ├── PostComposer.tsx      # Create new post
│   ├── PostFeed.tsx          # Infinite scroll feed
│   ├── PostStats.tsx         # Like/comment/share counts
│   └── CommentSection.tsx    # Comments display
├── profile/
│   ├── ProfileHeader.tsx     # User info, stats
│   ├── ProfileTabs.tsx       # Posts/Likes/Media tabs
│   ├── FollowButton.tsx      # Follow/Unfollow
│   └── EditProfileForm.tsx   # Edit profile
├── search/
│   ├── SearchBar.tsx
│   ├── SearchResults.tsx
│   └── TrendingTags.tsx
└── chat/
    ├── ConversationList.tsx
    ├── ChatWindow.tsx
    └── MessageInput.tsx
```

---

## 🔍 SEO Implementation Checklist

### For Every Page:
- ✅ Dynamic metadata using `generateMetadata()`
- ✅ Open Graph tags (og:image, og:title, og:description)
- ✅ Twitter Card tags
- ✅ Canonical URLs
- ✅ Structured Data (JSON-LD)

### Example for Post Page:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPostById(params.id)
  
  return {
    title: `${post.author.username} on Snaporia`,
    description: post.content.slice(0, 160),
    openGraph: {
      images: post.imageUrls,
    },
  }
}
```

### Create These Files:
```
public/
├── robots.txt
├── sitemap.xml (or use next-sitemap package)
└── favicon.ico
```

---

## 📦 Recommended Packages

### Image Upload:
```bash
pnpm add uploadthing @uploadthing/react
```

### Real-time:
```bash
pnpm add pusher pusher-js
# or
pnpm add ably
```

### Rich Text Editor:
```bash
pnpm add @tiptap/react @tiptap/starter-kit
# or
pnpm add react-quill
```

### Infinite Scroll:
```bash
pnpm add react-infinite-scroll-component
```

### Form Validation:
```bash
pnpm add zod react-hook-form @hookform/resolvers
```

---

## 🚀 Quick Start Commands

```bash
# Start development server
pnpm dev

# View database
pnpm prisma studio

# Generate Prisma Client (after schema changes)
pnpm prisma generate

# Push schema changes
pnpm prisma db push

# Create migration
pnpm prisma migrate dev --name description

# Build for production
pnpm build
```

---

## 📊 Testing Your Setup

Once you've set up the database:

1. **Sign up a new user** via Clerk
2. **Check Prisma Studio** - should see new UserProfile
3. **Test API routes** using Postman or Thunder Client:
   - GET `http://localhost:3000/api/posts`
   - POST `http://localhost:3000/api/posts/create`

---

## 🎯 Priority Order

1. **NOW:** Set up database (Neon/Supabase)
2. **TODAY:** Create user profile pages
3. **THIS WEEK:** Build post creation & feed
4. **NEXT WEEK:** Add engagement features
5. **AFTER:** Search, hashtags, chat

---

## 💡 Pro Tips

- Use **optimistic UI updates** for better UX
- Implement **infinite scroll** instead of pagination
- Add **loading skeletons** for better perceived performance
- Use **React Query** or **SWR** for data fetching
- Implement **error boundaries** for graceful error handling
- Add **analytics** early (Vercel Analytics, Google Analytics)

---

## 🆘 Troubleshooting

### "Can't reach database server"
- Check your DATABASE_URL in `.env`
- Ensure database is running (for local)
- Check network connection (for remote)

### "Module @prisma/client not found"
- Run `pnpm prisma generate`

### "User profile not found"
- Ensure Clerk webhook is set up
- Check webhook logs in Clerk Dashboard
- Manually create profile via Prisma Studio

---

**Ready to continue? Let me know which phase you want to implement next!** 🚀
