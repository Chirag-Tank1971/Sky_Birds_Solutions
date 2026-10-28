import axios from "axios"

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
    if (error.response?.status === 401) {
      localStorage.removeItem("skybirds-token")
      localStorage.removeItem("skybirds-user")
    }
    return Promise.reject(error)
  },
)

export default API
