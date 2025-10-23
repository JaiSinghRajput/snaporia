export function getSafeRedirect(url: URL, fallback: string = "/") {
  const next = url.searchParams.get("next") || url.searchParams.get("redirect") || url.searchParams.get("returnTo") || ""
  if (!next) return fallback
  try {
    // Disallow absolute URLs, protocols, and protocol-relative URLs
    const decoded = decodeURIComponent(next)
    if (
      decoded.startsWith("/") &&
      !decoded.startsWith("//") &&
      !decoded.startsWith("/\\")
    ) {
      return decoded
    }
  } catch {
    // ignore parse errors
  }
  return fallback
}
