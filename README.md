# 📸 Snaporia - Social Media Platform

A modern, feature-rich social media platform built with Next.js 15, Clerk Authentication, Prisma ORM, and PostgreSQL.

## ✨ Features

### ✅ Implemented
- 🔐 **Authentication** - Clerk-based authentication with email/password
- 🎨 **Modern UI** - Clean, responsive design with dark/light mode
- 👤 **User Profiles** - Extended user profiles with avatars, bio, and stats
- 📝 **Posts** - Create, read, update, delete posts with images/videos
- 💬 **Comments** - Nested comment system with replies
- ❤️ **Likes** - Like posts and comments
- 👥 **Follow System** - Follow/unfollow users
- 📊 **Analytics** - Track post views and engagement
- 🔍 **Hashtags** - Hashtag system for content discovery

### 🚧 In Progress
- 💬 **Real-time Chat** - Direct messaging between users
- 🔔 **Notifications** - Real-time notification system
- 📱 **PWA Support** - Progressive Web App capabilities

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) with App Router & Turbopack
- **Authentication:** [Clerk](https://clerk.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Type Safety:** [TypeScript](https://www.typescriptlang.org/)

## 📦 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database (local or remote)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd snaporia
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk Dashboard
- `CLERK_SECRET_KEY` - From Clerk Dashboard
- `CLERK_WEBHOOK_SECRET` - From Clerk Webhooks (after setup)
 - `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`, `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` - For realtime (Pusher)
 - `SNAPORIA_AWS_REGION`, `SNAPORIA_AWS_S3_BUCKET`, `SNAPORIA_AWS_ACCESS_KEY_ID`, `SNAPORIA_AWS_SECRET_ACCESS_KEY` - For media uploads (S3)
 - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` - For Web Push notifications (see below)

### 4. Set up the database

```bash
# Generate Prisma Client
pnpm prisma generate

# Push schema to database
pnpm prisma db push

# (Optional) Open Prisma Studio to view/edit data
pnpm prisma studio
```

### 5. Set up Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** → **Add Endpoint**
3. Add endpoint URL:
   - Development: `http://localhost:3000/api/webhooks/clerk`
   - Production: `https://yourdomain.com/api/webhooks/clerk`
4. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
5. Copy the **Signing Secret** and add to `.env` as `CLERK_WEBHOOK_SECRET`

### 6. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🔔 PWA Push Notifications (Web Push)

This project supports real-time push notifications for new messages via the browser’s Push API.

Setup steps:

1) Generate VAPID keys (one-time)

You can generate keys with:

```
npx web-push generate-vapid-keys
```

Add the output as environment variables:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY
```

2) Ensure HTTPS (or localhost)

Web Push requires a secure context. Use localhost for development or HTTPS in production.

3) Allow notifications in the UI

Open the app and click “Enable notifications” in the right sidebar prompt. You can re-trigger via a helper available in the browser console:

```
window.enablePushNotifications?.()
```

4) Test delivery

Log in as User A in one browser and send a message to User B (who has enabled notifications) from another session/account. You should see a push notification; clicking it deep-links to the conversation.

Notes:
- If you deny permission, you’ll need to manually re-enable notifications in the browser site settings.
- Expired subscriptions are auto-cleaned when detected during delivery.
- For production, rotate and store VAPID keys securely.

## 📁 Project Structure

```
snaporia/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static files
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── api/              # API routes
│   │   │   ├── posts/        # Post-related endpoints
│   │   │   └── webhooks/     # Clerk webhook handler
│   │   ├── sign-in/          # Sign-in page
│   │   ├── sign-up/          # Sign-up page
│   │   └── page.tsx          # Home feed
│   ├── components/           # React components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # UI components (shadcn)
│   └── lib/                  # Utilities and helpers
│       ├── prisma.ts         # Prisma client
│       ├── posts.ts          # Post-related functions
│       └── user.ts           # User-related functions
├── DATABASE_SETUP.md         # Database setup guide
├── IMPLEMENTATION_GUIDE.md   # Step-by-step implementation guide
└── package.json
```

## 📚 Documentation

- **[Database Setup Guide](./DATABASE_SETUP.md)** - Detailed database configuration
- **[Implementation Guide](./IMPLEMENTATION_GUIDE.md)** - Step-by-step feature implementation

## 🗄️ Database Schema

The application uses the following main models:

- **UserProfile** - Extended user information
- **Post** - User posts with media
- **Like** - Post likes
- **Comment** - Nested comments
- **Share** - Post shares
- **View** - Post view analytics
- **Follow** - User relationships
- **Hashtag** - Content tagging
- **Conversation** - Chat conversations
- **Message** - Chat messages
- **Notification** - User notifications

## 🔧 Available Scripts

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm dev:db           # Start database and dev server

# Database
pnpm prisma generate  # Generate Prisma Client
pnpm prisma db push   # Push schema to database
pnpm prisma migrate dev # Create and run migrations
pnpm prisma studio    # Open Prisma Studio

# Build & Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
```

## 🎯 Roadmap

### Phase 2: User Profiles
- [ ] Public profile pages
- [ ] Edit profile functionality
- [ ] Profile stats and analytics

### Phase 3: Post Creation & Feed
- [ ] Post composer with image upload
- [ ] Individual post pages
- [ ] Infinite scroll feed
- [ ] Post filters and sorting

### Phase 4: Engagement
- [ ] Like/unlike interactions
- [ ] Comment system with replies
- [ ] Share functionality
- [ ] View tracking

### Phase 5: Discovery
- [ ] Search functionality
- [ ] Hashtag pages
- [ ] Trending content
- [ ] User suggestions

### Phase 6: Real-time Features
- [ ] Direct messaging
- [ ] Online status
- [ ] Read receipts
- [ ] Push notifications

### Phase 7: SEO & Performance
- [ ] Dynamic meta tags
- [ ] Sitemap generation
- [ ] Open Graph images
- [ ] Performance optimization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- Check the [Database Setup Guide](./DATABASE_SETUP.md)
- Open an issue on GitHub

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Clerk](https://clerk.com/)
- [Prisma](https://www.prisma.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/)

---

Built with ❤️ using Next.js
