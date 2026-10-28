import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { fetchSiteContent } from "../api/site"

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

export default function SiteSEO() {
  const location = useLocation()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetchSiteContent()
        if (cancelled || !res.success) return

        const seo = res.data?.seo || {}
        const key = location.pathname === "/"
          ? "home"
          : location.pathname.startsWith("/about")
            ? "about"
            : location.pathname.startsWith("/contact")
              ? "contact"
              : location.pathname.startsWith("/courses")
                ? "courses"
                : location.pathname.startsWith("/watch")
                  ? "watch"
                  : "default"

        const page = seo.pages?.[key] || {}
        const title = page.title || seo.defaultTitle
        const description = page.description || seo.defaultDescription
        const keywords = page.keywords || seo.defaultKeywords

        if (title) document.title = title
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
