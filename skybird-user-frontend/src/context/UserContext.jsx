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
  purchaseCourseApi,
  getPurchasedCourses,
} from "../api/auth"

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
      return []
    }
    try {
      const res = await getPurchasedCourses()
      if (res.success && Array.isArray(res.data)) {
        setPurchasedCourses(res.data)
        const ids = res.data.map((course) => String(course.id || course._id || "")).filter(Boolean)
        setUser((prev) => prev ? { ...prev, purchasedCourseIds: ids } : prev)
        return res.data
      }
    } catch {
      // Do not clear a previously loaded list when the API is temporarily unavailable.
    }
    return []
  }, [token])

  useEffect(() => {
    refreshPurchased()
  }, [refreshPurchased])

  const sendOtp = useCallback(async (mobile, purpose = "register") => {
    setLoading(true)
    try {
      const data = await apiSendOtp(mobile, purpose)
      return {
        success: true,
        message: data.message || "OTP sent",
        existingUser: Boolean(data.existingUser),
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

  const verifyOtp = useCallback(async ({ mobile, otp, name, purpose = "register" }) => {
    setLoading(true)
    try {
      const data = await apiVerifyOtp({ mobile, otp, name, purpose })
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
      mobile: data.user.mobile,
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

  const loginWithPassword = useCallback(async ({ mobile, password }) => {
    setLoading(true)
    try {
      const data = await apiLoginWithPassword({ mobile, password })
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

  const registerWithPassword = useCallback(async ({ mobile, password, verificationToken, name }) => {
    setLoading(true)
    try {
      const data = await apiSetPassword({ mobile, password, verificationToken, name })
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

  const resetPassword = useCallback(async ({ mobile, password, verificationToken }) => {
    setLoading(true)
    try {
      const data = await apiResetPassword({ mobile, password, verificationToken })
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

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setPurchasedCourses([])
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  const hasCourse = useCallback((courseId) => {
    if (!user) return false
    const ids = user.purchasedCourseIds || []
    if (ids.map(String).includes(String(courseId))) return true
    return purchasedCourses.some((course) => String(course.id || course._id) === String(courseId))
  }, [user, purchasedCourses])

  const purchaseCourse = useCallback(async (course) => {
    if (!user) return { success: false, message: "Please login first" }
    try {
      const res = await purchaseCourseApi(course.id)
      if (res.success) {
        await refreshPurchased()
        return { success: true }
      }
      return { success: false, message: res.message || "Purchase failed" }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Purchase failed" }
    }
  }, [user, refreshPurchased])

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    loading,
    purchasedCourses,
    sendOtp,
    verifyOtp,
    loginWithPassword,
    registerWithPassword,
    resetPassword,
    logout,
    hasCourse,
    purchaseCourse,
    refreshPurchased,
  }), [
    user, token, isAuthenticated, loading, purchasedCourses, sendOtp, verifyOtp,
    loginWithPassword, registerWithPassword, resetPassword, logout, hasCourse,
    purchaseCourse, refreshPurchased,
  ])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error("useUser must be used inside UserProvider")
  return context
}
