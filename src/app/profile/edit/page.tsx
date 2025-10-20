"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function EditProfilePage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    bio: "",
    location: "",
    website: "",
    dateOfBirth: "",
    isPrivate: false,
  })
  const [initialProfile, setInitialProfile] = useState<{
    bio?: string;
    location?: string;
    website?: string;
    dateOfBirth?: string;
    isPrivate?: boolean;
  } | null>(null)

  useEffect(() => {
    // Fetch current profile from API
    const fetchProfile = async () => {
      const res = await fetch("/api/profile/update", { method: "GET" })
      if (res.ok) {
        const { profile } = await res.json()
        setInitialProfile(profile)
        setFormData({
          bio: profile.bio || "",
          location: profile.location || "",
          website: profile.website || "",
          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
          isPrivate: profile.isPrivate || false,
        })
      }
    }
    fetchProfile()
  }, [])

  if (!isLoaded || !initialProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    router.push("/sign-in")
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Only send changed fields, keep existing for blank
    const payload: Record<string, string | boolean> = {};
    (Object.keys(formData) as (keyof typeof formData)[]).forEach((key: keyof typeof formData) => {
      if (formData[key] !== (initialProfile?.[key] ?? "")) {
        payload[key] = formData[key]
      }
    })
    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push(`/profile/${user.username}`)
      } else {
        const data = await response.json()
        console.error("Failed to update profile:", data.error)
        alert("Failed to update profile. Please try again.")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio */}
            <div>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                maxLength={160}
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.bio.length}/160 characters
              </p>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
              />
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>

            {/* Privacy */}
            <div className="flex items-center gap-2">
              <input
                id="isPrivate"
                name="isPrivate"
                type="checkbox"
                checked={formData.isPrivate}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <Label htmlFor="isPrivate" className="cursor-pointer">
                Make profile private
              </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
