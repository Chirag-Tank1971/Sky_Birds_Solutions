// MSG91 OTP Widget in "custom UI" mode (exposeMethods): MSG91 sends and checks the SMS code while
// our own OTP screens stay as they are. The API hands us { widgetId, tokenAuth } when this mode is on.
const SCRIPT_URL = "https://verify.msg91.com/otp-provider.js"

let ready = null

function loadScript() {
  return new Promise((resolve, reject) => {
    if (window.initSendOTP) return resolve()
    const script = document.createElement("script")
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Couldn't load the SMS verification service. Please check your connection."))
    document.head.appendChild(script)
  })
}

// The exposed window methods appear shortly after initSendOTP runs.
function waitForMethods(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const started = Date.now()
    const check = () => {
      if (typeof window.sendOtp === "function" && typeof window.verifyOtp === "function") return resolve()
      if (Date.now() - started > timeoutMs) return reject(new Error("SMS verification is taking too long to start. Please try again."))
      window.setTimeout(check, 100)
    }
    check()
  })
}

export function initWidget({ widgetId, tokenAuth }) {
  if (!ready) {
    ready = loadScript()
      .then(() => {
        window.initSendOTP({ widgetId, tokenAuth, exposeMethods: true, success: () => {}, failure: () => {} })
        return waitForMethods()
      })
      .catch((err) => {
        ready = null
        throw err
      })
  }
  return ready
}

const errorText = (err, fallback) => (typeof err?.message === "string" && err.message) || fallback

// Promise wrappers around the widget's callback API.
export function widgetSendOtp(mobile) {
  return new Promise((resolve, reject) =>
    window.sendOtp(`91${mobile}`, resolve, (err) => reject(new Error(errorText(err, "Couldn't send the OTP. Please try again."))))
  )
}

export function widgetRetryOtp() {
  return new Promise((resolve, reject) =>
    window.retryOtp(null, resolve, (err) => reject(new Error(errorText(err, "Couldn't resend the OTP. Please try again."))))
  )
}

// Resolves with MSG91's access token, which our API confirms with MSG91.
export function widgetVerifyOtp(otp) {
  return new Promise((resolve, reject) =>
    window.verifyOtp(
      otp,
      (data) => (data?.message ? resolve(data.message) : reject(new Error("Verification failed. Please try again."))),
      (err) => reject(new Error(errorText(err, "Invalid OTP. Please try again.")))
    )
  )
}
