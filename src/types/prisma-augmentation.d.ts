import '@prisma/client'

declare module '@prisma/client' {
  interface PrismaClient {
    webPushSubscription: {
      findMany(args: unknown): Promise<Array<{ endpoint: string; p256dh: string; auth: string }>>
      upsert(args: unknown): Promise<unknown>
      delete(args: unknown): Promise<unknown>
      deleteMany(args: unknown): Promise<{ count: number }>
    }
  }
}
