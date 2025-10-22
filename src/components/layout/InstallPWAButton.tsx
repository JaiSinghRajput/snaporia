"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already running as installed PWA
    const isInStandaloneMode = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ||
        document.referrer.includes('android-app://')
      )
    }
    
    setIsStandalone(isInStandaloneMode())

    const onBeforeInstallPrompt = (e: Event) => {
      console.log('📱 beforeinstallprompt fired')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    
    const onAppInstalled = () => {
      console.log('✅ App installed successfully')
      setInstalled(true)
      setDeferredPrompt(null)
    }
    
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)
    
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  // Don't show if already installed or running as PWA
  if (installed || isStandalone) return null

  // Show button only when the prompt is available
  if (!deferredPrompt) return null

  const handleInstall = async () => {
    try {
      console.log('🎯 Triggering install prompt')
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`👤 User response: ${outcome}`)
      setDeferredPrompt(null)
    } catch (error) {
      console.error('❌ Install error:', error)
      setDeferredPrompt(null)
    }
  }

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
      title="Install Snaporia"
    >
      <Download size={16} />
      <span className="hidden sm:inline">Install</span>
    </button>
  )
}
