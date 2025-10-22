"use client"

import { useEffect, useState } from "react"

export default function PWADebugPage() {
  const [info, setInfo] = useState<any>({})

  useEffect(() => {
    const checkPWAStatus = async () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')

      const hasServiceWorker = 'serviceWorker' in navigator
      let swStatus = 'Not supported'
      
      if (hasServiceWorker) {
        const registration = await navigator.serviceWorker.getRegistration()
        swStatus = registration ? 'Registered & Active' : 'Not registered'
      }

      const manifestUrl = document.querySelector('link[rel="manifest"]')?.getAttribute('href')
      
      let manifestData = null
      if (manifestUrl) {
        try {
          const response = await fetch(manifestUrl)
          manifestData = await response.json()
        } catch (e) {
          manifestData = { error: 'Failed to fetch manifest' }
        }
      }

      setInfo({
        isStandalone,
        isSecure: window.isSecureContext,
        protocol: window.location.protocol,
        hasServiceWorker,
        swStatus,
        manifestUrl,
        manifestData,
        userAgent: navigator.userAgent,
        hasBeforeInstallPrompt: 'onbeforeinstallprompt' in window,
        displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 
                     window.matchMedia('(display-mode: fullscreen)').matches ? 'fullscreen' :
                     window.matchMedia('(display-mode: minimal-ui)').matches ? 'minimal-ui' : 'browser',
      })
    }

    checkPWAStatus()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">PWA Debug Information</h1>
      
      <div className="space-y-6">
        {/* Installation Status */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Installation Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Running as PWA:</span>
              <span className={info.isStandalone ? "text-green-500" : "text-red-500"}>
                {info.isStandalone ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Display Mode:</span>
              <span className="font-mono">{info.displayMode}</span>
            </div>
            <div className="flex justify-between">
              <span>Secure Context (HTTPS):</span>
              <span className={info.isSecure ? "text-green-500" : "text-red-500"}>
                {info.isSecure ? "✅ Yes" : "❌ No (Required for PWA)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Protocol:</span>
              <span className="font-mono">{info.protocol}</span>
            </div>
          </div>
        </div>

        {/* Service Worker Status */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Service Worker</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Supported:</span>
              <span className={info.hasServiceWorker ? "text-green-500" : "text-red-500"}>
                {info.hasServiceWorker ? "✅ Yes" : "❌ No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={info.swStatus === 'Registered & Active' ? "text-green-500" : "text-yellow-500"}>
                {info.swStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Manifest Status */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Manifest</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Manifest URL:</span>
              <span className="font-mono text-sm">{info.manifestUrl || 'Not found'}</span>
            </div>
            <div className="flex justify-between">
              <span>Install Prompt Supported:</span>
              <span className={info.hasBeforeInstallPrompt ? "text-green-500" : "text-yellow-500"}>
                {info.hasBeforeInstallPrompt ? "✅ Yes" : "⚠️ No (iOS/Safari)"}
              </span>
            </div>
          </div>
          
          {info.manifestData && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Manifest Data:</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(info.manifestData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Browser Info */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Browser Information</h2>
          <div className="text-sm font-mono break-all">
            {info.userAgent}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Installation Instructions</h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-blue-500">Android Chrome:</strong>
              <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                <li>Tap the ⋮ (three dots) menu</li>
                <li>Select "Install app" or "Add to Home screen"</li>
                <li>Follow the prompts</li>
              </ol>
            </div>
            <div>
              <strong className="text-blue-500">iOS Safari:</strong>
              <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                <li>Tap the Share button</li>
                <li>Scroll and tap "Add to Home Screen"</li>
                <li>Tap "Add"</li>
              </ol>
            </div>
            <div>
              <strong className="text-blue-500">Desktop Chrome:</strong>
              <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                <li>Look for the install icon in the address bar</li>
                <li>Or use the ⋮ menu → "Install Snaporia"</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        {!info.isSecure && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-red-500">⚠️ Issue Detected</h2>
            <p className="text-sm">
              Your site is not running on HTTPS. PWA installation requires a secure connection (HTTPS) 
              except for localhost. Deploy your app to a hosting service that provides HTTPS (like Netlify, 
              Vercel, or Cloudflare Pages) to enable PWA installation on Android Chrome.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
