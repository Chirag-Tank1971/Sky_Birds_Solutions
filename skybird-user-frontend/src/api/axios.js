import axios from "axios"

export const SESSION_EXPIRED_EVENT = "skybirds:session-expired"

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://course-api-sp35.onrender.com/api",
  headers: { "Content-Type": "application/json" },
  timeout: 60000, // Render free tier cold start can be slow
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("skybirds-token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (res) => res,
  (error) => {
    // A rejected session token: clear it and tell UserContext to log out,
    // so the app stops showing the user as logged in.
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem("skybirds-token")
      localStorage.removeItem("skybirds-user")
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)

export default API
