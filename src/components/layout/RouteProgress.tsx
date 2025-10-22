"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export default function RouteProgress() {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const incTimer = useRef<number | null>(null)
  const hideTimer = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (incTimer.current) window.clearInterval(incTimer.current)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    incTimer.current = null
    hideTimer.current = null
  }, [])

  const start = useCallback(() => {
    clearTimers()
    // small delay to avoid flashing on instant navigations
    window.setTimeout(() => {
      setVisible(true)
      setProgress(10)
      // increment towards 90%
      incTimer.current = window.setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.max(1, (90 - p) * 0.03) : p))
      }, 120)
    }, 100)
  }, [clearTimers])

  const done = useCallback(() => {
    // finish the bar and hide shortly after
    setProgress(100)
    hideTimer.current = window.setTimeout(() => {
      setVisible(false)
      setProgress(0)
      clearTimers()
    }, 250)
  }, [clearTimers])

  useEffect(() => {
    // Patch history to detect navigations in App Router
    const origPush = history.pushState
    const origReplace = history.replaceState

    history.pushState = function (this: History, data, unused, url) {
      start()
      return origPush.apply(this, [data, unused, url])
    }

    history.replaceState = function (this: History, data, unused, url) {
      start()
      return origReplace.apply(this, [data, unused, url])
    }

    const onPop = () => start()
    const onLoad = () => done()
    const onVisibility = () => {
      if (document.visibilityState === "visible") done()
    }

    window.addEventListener("popstate", onPop)
    window.addEventListener("load", onLoad)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      history.pushState = origPush
      history.replaceState = origReplace
      window.removeEventListener("popstate", onPop)
      window.removeEventListener("load", onLoad)
      document.removeEventListener("visibilitychange", onVisibility)
      clearTimers()
    }
  }, [start, done, clearTimers])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[1000] h-0.5 bg-transparent w-screen">
      <div
        className="h-full w-screen max-w-full origin-left bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(99,102,241,0.6)] transition-[transform,opacity] duration-150 ease-out"
        style={{ transform: `scaleX(${Math.max(0.02, progress / 100)})` }}
      />
    </div>
  )
}

