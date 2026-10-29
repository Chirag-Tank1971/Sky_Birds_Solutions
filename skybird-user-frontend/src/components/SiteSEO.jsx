import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { fetchSiteContent } from "../api/site"

// Used when the admin hasn't set a title for these pages.
const FALLBACK_TITLES = {
  login: "Login | Sky Birds Solution",
  dashboard: "My Dashboard | Sky Birds Solution",
  privacy: "Privacy Policy | Sky Birds Solution",
  terms: "Terms & Conditions | Sky Birds Solution",
}

function setMeta(name, content) {
  if (!content) return
  let node = document.head.querySelector(`meta[name="${name}"]`)
  if (!node) {
    node = document.createElement("meta")
    node.setAttribute("name", name)
    document.head.appendChild(node)
  }
  node.setAttribute("content", content)
}

// SEO key for a path. null means the page sets its own title
// (a single course, or the 404 page).
function pageKey(pathname) {
  if (pathname === "/") return "home"
  if (pathname.startsWith("/about")) return "about"
  if (pathname.startsWith("/contact")) return "contact"
  if (pathname === "/courses" || pathname === "/courses/") return "courses"
  if (pathname.startsWith("/courses/")) return null
  if (pathname.startsWith("/watch")) return "watch"
  if (pathname.startsWith("/login")) return "login"
  if (pathname.startsWith("/dashboard")) return "dashboard"
  if (pathname.startsWith("/privacy-policy")) return "privacy"
  if (pathname.startsWith("/terms")) return "terms"
  return null
}

export default function SiteSEO() {
  const location = useLocation()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetchSiteContent()
        if (cancelled || !res.success) return

        const seo = res.data?.seo || {}
        const key = pageKey(location.pathname)
        const page = (key && seo.pages?.[key]) || {}
        const title = page.title || FALLBACK_TITLES[key] || seo.defaultTitle
        const description = page.description || seo.defaultDescription
        const keywords = page.keywords || seo.defaultKeywords

        if (key && title) document.title = title
        setMeta("description", description)
        setMeta("keywords", keywords)
      } catch {
        // Keep the existing document metadata on failure.
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  return null
}
