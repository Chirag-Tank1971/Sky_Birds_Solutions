import API from "./axios"

// Home, Footer, SiteSEO, Contact, About and the legal pages all read site
// content; share one request between them for a few minutes.
const SITE_CACHE_MS = 5 * 60 * 1000
let siteRequest = null
let siteRequestAt = 0

export function fetchSiteContent() {
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
