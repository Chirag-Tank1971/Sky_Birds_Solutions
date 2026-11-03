// Identifies this browser to the video device limit. All tabs share it, so they count as one device.
import API from "../api/axios"

const KEY = "skybirds-playback-session"
const API_BASE = API.defaults.baseURL.replace(/\/+$/, "")

export function getPlaybackSessionId() {
  try {
    return localStorage.getItem(KEY) || ""
  } catch {
    return ""
  }
}

export function setPlaybackSessionId(id) {
  try {
    if (id) localStorage.setItem(KEY, id)
  } catch {
    // Storage blocked: the server issues a new ID with each lesson instead.
  }
}

// Frees this device's slot on logout. Plain fetch, so a failed call can't trigger the session-expired logout again.
export function endPlaybackSession(token) {
  const id = getPlaybackSessionId()
  if (!token || !id) return
  fetch(`${API_BASE}/customer/playback/session`, {
    method: "DELETE",
    keepalive: true,
    headers: { Authorization: `Bearer ${token}`, "X-Playback-Session": id },
  }).catch(() => {})
}
