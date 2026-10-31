import API from "./axios"
import { getPreviewContent, isSitePreview } from "../lib/sitePreview"

// Home, Footer, SiteSEO, Contact, About and the legal pages all read site
// content; share one request between them for a few minutes.
const SITE_CACHE_MS = 5 * 60 * 1000
let siteRequest = null
let siteRequestAt = 0

// Links from site content become clickable: only web addresses, never javascript: and the like.
export function safeWebUrl(value) {
  try {
    const { protocol } = new URL(String(value || "").trim())
    return protocol === "https:" || protocol === "http:" ? String(value).trim() : ""
  } catch {
    return ""
  }
}

export function fetchSiteContent() {
  if (isSitePreview) {
    return getPreviewContent().then((content) => (content ? { success: true, data: content } : publishedSiteContent()))
  }
  return publishedSiteContent()
}

function publishedSiteContent() {
  if (!siteRequest || Date.now() - siteRequestAt > SITE_CACHE_MS) {
    siteRequestAt = Date.now()
    siteRequest = API.get("/site")
      .then(({ data }) => data)
      .catch((error) => {
        // Don't keep a failed request; the next caller tries again.
        siteRequest = null
        throw error
      })
  }
  return siteRequest
}

export async function fetchTestimonials() {
  const { data } = await API.get("/testimonials")
  return data
}
