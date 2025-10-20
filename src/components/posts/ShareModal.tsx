"use client"

import { useState } from "react"
import { X, Link2, Facebook, Twitter, MessageCircle as WhatsApp, Mail, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  postUrl: string
}

export default function ShareModal({ isOpen, onClose, postId, postUrl }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const copyLink = () => {
    navigator.clipboard.writeText(postUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOptions = [
    {
      name: "Copy Link",
      icon: copied ? Check : Link2,
      color: "text-gray-700 dark:text-gray-300",
      bg: "bg-gray-100 dark:bg-gray-800",
      action: copyLink,
    },
    {
      name: "WhatsApp",
      icon: WhatsApp,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
      action: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(postUrl)}`, "_blank")
      },
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}`,
          "_blank"
        )
      },
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
          "_blank"
        )
      },
    },
    {
      name: "Email",
      icon: Mail,
      color: "text-gray-700 dark:text-gray-300",
      bg: "bg-gray-100 dark:bg-gray-800",
      action: () => {
        window.location.href = `mailto:?subject=Check out this post&body=${encodeURIComponent(
          postUrl
        )}`
      },
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - Bottom drawer on mobile, centered on desktop */}
      <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-2xl shadow-2xl max-w-md w-full p-6 z-10 max-h-[85vh] overflow-y-auto">
        {/* Mobile Handle Bar */}
        <div className="md:hidden flex justify-center mb-4">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Share Post
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Share Options Grid */}
        <div className="grid grid-cols-3 gap-4">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={option.action}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group"
            >
              <div
                className={`w-14 h-14 rounded-full ${option.bg} flex items-center justify-center group-hover:scale-110 transition`}
              >
                <option.icon className={`w-6 h-6 ${option.color}`} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {option.name}
              </span>
            </button>
          ))}
        </div>

        {/* URL Display */}
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {postUrl}
          </p>
        </div>
      </div>
    </div>
  )
}
