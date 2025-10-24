import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"
import MobileNotificationBanner from "@/components/layout/MobileNotificationBanner"
import ProfileSync from "@/components/auth/ProfileSync"
import UploadQueueProvider from "@/components/providers/UploadQueueProvider"
import RouteProgress from "@/components/layout/RouteProgress"
import PWARegister from "@/components/providers/PWARegister"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Snaporia",
  description: "Discover and share moments on Snaporia",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Snaporia",
  },
  icons: {
    apple: [
      { url: "/AppImages/ios/180.png", sizes: "180x180" },
      { url: "/AppImages/ios/152.png", sizes: "152x152" },
      { url: "/AppImages/ios/120.png", sizes: "120x120" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.webmanifest" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="application-name" content="Snaporia" />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <RouteProgress/>
          <UploadQueueProvider>
            <ProfileSync />
            <Header/>
            <MobileNotificationBanner />
            <main className="pt-16 pb-16 md:pb-0">{children}</main>
            <MobileNav/>
            <PWARegister/>
          </UploadQueueProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
