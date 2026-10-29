import API from "./axios"

export async function sendOtp(mobile, purpose = "register") {
  const { data } = await API.post("/auth/customer/send-otp", { mobile, purpose })
  return data
}

export async function verifyOtp({ mobile, otp, name, purpose = "register" }) {
  const { data } = await API.post("/auth/customer/verify-otp", {
    mobile,
    otp,
    name,
    purpose,
  })
  return data
}

export async function loginWithPassword({ mobile, password }) {
  const { data } = await API.post("/auth/customer/login", { mobile, password })
  return data
}

export async function setPassword({ mobile, password, verificationToken, name }) {
  const { data } = await API.post("/auth/customer/set-password", {
    mobile,
    password,
    verificationToken,
    name,
  })
  return data
}

export async function resetPassword({ mobile, password, verificationToken }) {
  const { data } = await API.post("/auth/customer/reset-password", {
    mobile,
    password,
    verificationToken,
  })
  return data
}

export async function getProfile() {
  const { data } = await API.get("/customer/profile")
  return data
}

export async function getPurchasedCourses() {
  const { data } = await API.get("/customer/purchased")
  return data
}
