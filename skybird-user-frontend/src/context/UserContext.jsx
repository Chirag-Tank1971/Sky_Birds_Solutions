import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  loginWithPassword as apiLoginWithPassword,
  setPassword as apiSetPassword,
  resetPassword as apiResetPassword,
  getPurchasedCourses,
} from "../api/auth"
import { SESSION_EXPIRED_EVENT } from "../api/axios"

const TOKEN_KEY = "skybirds-token"
const USER_KEY = "skybirds-user"
const UserContext = createContext(null)

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(false)
  const [purchasedCourses, setPurchasedCourses] = useState([])
  // "idle" until the first load finishes, then "loaded" or "error".
  const [purchasesStatus, setPurchasesStatus] = useState("idle")

  const isAuthenticated = Boolean(token && user)

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  }, [user])

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  }, [token])

  const refreshPurchased = useCallback(async () => {
    if (!token) {
      setPurchasedCourses([])
      setPurchasesStatus("loaded")
      return []
    }
    try {
      const res = await getPurchasedCourses()
      if (res.success && Array.isArray(res.data)) {
        setPurchasedCourses(res.data)
        const ids = res.data.map((course) => String(course.id || course._id || "")).filter(Boolean)
        setUser((prev) => prev ? { ...prev, purchasedCourseIds: ids } : prev)
        setPurchasesStatus("loaded")
        return res.data
      }
    } catch {
      // Do not clear a previously loaded list when the API is temporarily unavailable.
    }
    setPurchasesStatus("error")
    return []
  }, [token])

  useEffect(() => {
    refreshPurchased()
  }, [refreshPurchased])

  const sendOtp = useCallback(async (identifier, purpose = "register") => {
    setLoading(true)
    try {
      const data = await apiSendOtp(identifier, purpose)
      return {
        success: true,
        message: data.message || "OTP sent",
        existingUser: Boolean(data.existingUser),
        widget: data.widget || null,
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to send OTP. Please try again.",
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyOtp = useCallback(async ({ identifier, otp, accessToken, name, purpose = "register" }) => {
    setLoading(true)
    try {
      const data = await apiVerifyOtp({ identifier, otp, accessToken, name, purpose })
      if (data.success && data.verified && data.verificationToken) {
        return {
          success: true,
          verificationToken: data.verificationToken,
          purpose: data.purpose || purpose,
        }
      }
      return { success: false, message: data.message || "Verification failed" }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Invalid OTP. Please try again.",
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const completeLogin = useCallback(async (data) => {
    if (!data?.success || !data.token || !data.user) {
      return { success: false, message: data?.message || "Unable to log in" }
    }

    const nextUser = {
      id: data.user.id,
      name: data.user.name || "Learner",
      mobile: data.user.mobile || "",
      email: data.user.email || "",
      purchasedCourseIds: [],
    }

    // Persist before fetching enrollment so the Axios interceptor can authenticate it.
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setToken(data.token)
    setUser(nextUser)

    let courses = []
    try {
      const result = await getPurchasedCourses()
      if (result.success && Array.isArray(result.data)) courses = result.data
    } catch {
      // Safe fallback: send the customer to the course catalogue if enrollment cannot be loaded.
    }
    setPurchasedCourses(courses)
    const ids = courses.map((course) => String(course.id || course._id || "")).filter(Boolean)
    const finalUser = { ...nextUser, purchasedCourseIds: ids }
    setUser(finalUser)
    localStorage.setItem(USER_KEY, JSON.stringify(finalUser))

    return { success: true, user: finalUser, redirectTo: courses.length > 0 ? "/dashboard" : "/courses" }
  }, [])

  const loginWithPassword = useCallback(async ({ identifier, password }) => {
    setLoading(true)
    try {
      const data = await apiLoginWithPassword({ identifier, password })
      return await completeLogin(data)
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Unable to log in. Please try again.",
      }
    } finally {
      setLoading(false)
    }
  }, [completeLogin])

  const registerWithPassword = useCallback(async ({ identifier, password, verificationToken, name, age, profession }) => {
    setLoading(true)
    try {
      const data = await apiSetPassword({ identifier, password, verificationToken, name, age, profession })
      return await completeLogin(data)
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Unable to create your account. Please try again.",
      }
    } finally {
      setLoading(false)
    }
  }, [completeLogin])

  const resetPassword = useCallback(async ({ identifier, password, verificationToken }) => {
    setLoading(true)
    try {
      const data = await apiResetPassword({ identifier, password, verificationToken })
      return { success: Boolean(data.success), message: data.message || "Password reset successfully" }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Unable to reset password. Please try again.",
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Merges edited profile fields (name, email, mobile) into the signed-in user.
  const updateUser = useCallback((fields) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev))
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setPurchasedCourses([])
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  // The API rejected the saved session (expired or signed out elsewhere).
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout)
  }, [logout])

  const hasCourse = useCallback((courseId) => {
    if (!user) return false
    const ids = user.purchasedCourseIds || []
    if (ids.map(String).includes(String(courseId))) return true
    return purchasedCourses.some((course) => String(course.id || course._id) === String(courseId))
  }, [user, purchasedCourses])

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    loading,
    purchasedCourses,
    purchasesStatus,
    sendOtp,
    verifyOtp,
    loginWithPassword,
    registerWithPassword,
    resetPassword,
    logout,
    hasCourse,
    refreshPurchased,
    updateUser,
  }), [
    user, token, isAuthenticated, loading, purchasedCourses, purchasesStatus, sendOtp, verifyOtp,
    loginWithPassword, registerWithPassword, resetPassword, logout, hasCourse,
    refreshPurchased, updateUser,
  ])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error("useUser must be used inside UserProvider")
  return context
}
