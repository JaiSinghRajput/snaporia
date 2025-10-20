# Database Setup Guide for Snaporia

## Option 1: Use a Free PostgreSQL Database (Recommended for Development)

### Neon (Free PostgreSQL - Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Sign up for free
3. Create a new project called "snaporia"
4. Copy the connection string
5. Replace `DATABASE_URL` in your `.env` file

### Supabase (Free PostgreSQL)
1. Go to [supabase.com](https://supabase.com)
2. Sign up and create a new project
3. Go to Settings > Database
4. Copy the connection string (Pooling mode)
5. Replace `DATABASE_URL` in your `.env` file

### Railway (Free PostgreSQL)
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL database
4. Copy the DATABASE_URL
5. Replace `DATABASE_URL` in your `.env` file

## Option 2: Local PostgreSQL

### Install PostgreSQL locally:
1. Download from [postgresql.org](https://www.postgresql.org/download/)
2. Install and set a password
3. Update `.env`:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/snaporia"
```

## After Setting Up Your Database

Run these commands:

```bash
# Generate Prisma Client
pnpm prisma generate

# Create database tables
pnpm prisma db push

# Or use migrations (recommended for production)
pnpm prisma migrate dev --name init

# Open Prisma Studio to view your database
pnpm prisma studio
```

## Database Schema Overview

Your Snaporia database includes:

### Core Models:
- ✅ **UserProfile** - Extended user data (linked to Clerk)
- ✅ **Post** - User posts with images/videos
- ✅ **Like** - Post likes
- ✅ **Comment** - Nested comments system
- ✅ **Share** - Post shares tracking
- ✅ **View** - Post view analytics
- ✅ **Follow** - User follow relationships
- ✅ **Hashtag** - Hashtag system
- ✅ **HashtagOnPost** - Link hashtags to posts

### Chat System:
- ✅ **Conversation** - Chat conversations
- ✅ **ConversationParticipant** - Users in conversations
- ✅ **Message** - Chat messages

### Future:
- ✅ **Notification** - User notifications system

## Next Steps

1. Choose a database provider above
2. Update your `.env` file with the DATABASE_URL
3. Run `pnpm prisma db push` to create tables
4. Start building your API routes!
