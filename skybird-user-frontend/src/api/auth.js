import API from "./axios"

// `identifier` is a 10-digit mobile number or an email address.
export async function sendOtp(identifier, purpose = "register") {
  const { data } = await API.post("/auth/customer/send-otp", { identifier, purpose })
  return data
}

// accessToken: MSG91 widget token, sent instead of otp when the API runs in widget mode.
export async function verifyOtp({ identifier, otp, accessToken, name, purpose = "register" }) {
  const { data } = await API.post("/auth/customer/verify-otp", {
    identifier,
    otp,
    accessToken,
    name,
    purpose,
  })
  return data
}

export async function loginWithPassword({ identifier, password }) {
  const { data } = await API.post("/auth/customer/login", { identifier, password })
  return data
}

export async function setPassword({ identifier, password, verificationToken, name, age, profession }) {
  const { data } = await API.post("/auth/customer/set-password", {
    identifier,
    password,
    verificationToken,
    name,
    age,
    profession,
  })
  return data
}

export async function resetPassword({ identifier, password, verificationToken }) {
  const { data } = await API.post("/auth/customer/reset-password", {
    identifier,
    password,
    verificationToken,
  })
  return data
}

export async function getProfile() {
  const { data } = await API.get("/customer/profile")
  return data
}

export async function updateProfile({ name, age, profession }) {
  const { data } = await API.put("/customer/profile", { name, age, profession })
  return data
}

// Adds the email or mobile number the customer did not sign up with, after an OTP check.
export async function sendContactOtp(identifier) {
  const { data } = await API.post("/customer/contact/send-otp", { identifier })
  return data
}

export async function verifyContactOtp({ identifier, otp, accessToken }) {
  const { data } = await API.post("/customer/contact/verify-otp", { identifier, otp, accessToken })
  return data
}

export async function getTransactions() {
  const { data } = await API.get("/customer/transactions")
  return data
}

export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await API.post("/customer/password", { currentPassword, newPassword })
  return data
}

export async function getPurchasedCourses() {
  const { data } = await API.get("/customer/purchased")
  return data
}

export async function getCourseProgress(courseId) {
  const { data } = await API.get(`/customer/progress/${encodeURIComponent(courseId)}`)
  return data
}

export async function getWatchHistory() {
  const { data } = await API.get("/customer/history")
  return data
}

export async function getLearningContent(type) {
  const { data } = await API.get(`/customer/learning-content/${type}`)
  return data
}
