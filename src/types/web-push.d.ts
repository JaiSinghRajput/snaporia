declare module 'web-push' {
  export interface PushSubscriptionKeys { p256dh: string; auth: string }
  export interface PushSubscription { endpoint: string; keys: PushSubscriptionKeys }
  export interface SendOptions { TTL?: number; urgency?: 'very-low' | 'low' | 'normal' | 'high'; [key: string]: unknown }
  const webpush: {
    setVapidDetails(mailto: string, publicKey: string, privateKey: string): void
    sendNotification(subscription: PushSubscription, payload?: string | Buffer, options?: SendOptions): Promise<unknown>
  }
  export default webpush
}
