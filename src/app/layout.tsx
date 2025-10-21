import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Header from "@/components/layout/Header"
import ProfileSync from "@/components/auth/ProfileSync"
import UploadQueueProvider from "@/components/providers/UploadQueueProvider"
import RouteProgress from "@/components/layout/RouteProgress"

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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <RouteProgress />
          <UploadQueueProvider>
            <ProfileSync />
            <Header/>
            <main className="pt-20">{children}</main>
          </UploadQueueProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
