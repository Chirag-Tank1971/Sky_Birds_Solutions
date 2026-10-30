import API from "./axios"

// `identifier` is a 10-digit mobile number or an email address.
export async function sendOtp(identifier, purpose = "register") {
  const { data } = await API.post("/auth/customer/send-otp", { identifier, purpose })
  return data
}

export async function verifyOtp({ identifier, otp, name, purpose = "register" }) {
  const { data } = await API.post("/auth/customer/verify-otp", {
    identifier,
    otp,
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

export async function getPurchasedCourses() {
  const { data } = await API.get("/customer/purchased")
  return data
}
