import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { useUser } from "../context/UserContext";
import API from "../api/axios";
import { Lock, ShieldAlert, Maximize, Minimize } from "lucide-react";

// Same API address as the rest of the site (including its production fallback).
const API_BASE = API.defaults.baseURL.replace(/\/+$/, "");
const API_ORIGIN = API_BASE.replace(/\/api$/, "");
// Give up after this many back-to-back failed refreshes.
const MAX_REFRESH_ATTEMPTS = 3;

export default function ProtectedVideo({ title, courseId, videoId }) {
  const { user, token } = useUser();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [blocked, setBlocked] = useState(false);
  const [loadingStream, setLoadingStream] = useState(true);
  const [streamError, setStreamError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Signed Bunny Stream embed link for lessons hosted on Bunny; empty for legacy HLS lessons.
  const [embedUrl, setEmbedUrl] = useState("");
 

  useEffect(() => {
    let active = true;
    let hls;
    let refreshTimer;
    let refreshing = null;
    let failedRefreshes = 0;
    let nativeReloads = 0;
    // The latest playback token. hls.js sends it in the Authorization header,
    // which the API reads before the token in the URL.
    let currentToken = "";
    const video = videoRef.current;

    const showError = (error) => {
      if (!active) return;
      setLoadingStream(false);
      if (error.status === 401)
        setStreamError("Please log in again to continue.");
      else if (error.status === 403)
        setStreamError("You do not own this course.");
      else if (error.status === 404)
        setStreamError("This lesson is not available.");
      else
        setStreamError(error.message || "Unable to start secure playback.");
    };

    async function authorize() {
      const response = await fetch(
        `${API_BASE}/courses/${encodeURIComponent(courseId)}/videos/${encodeURIComponent(videoId)}/playback`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.message || "Playback authorization failed");
        error.status = response.status;
        throw error;
      }
      currentToken = data.token;
      return data;
    }

    function streamUrlFor(auth) {
      const masterUrl = new URL(auth.masterUrl, API_ORIGIN);
      masterUrl.searchParams.set("token", auth.token);
      return masterUrl.toString();
    }

    // Renew the token before it expires so long lessons keep playing.
    function scheduleRefresh(expiresInSeconds) {
      clearTimeout(refreshTimer);
      const seconds = Math.max(30, Number(expiresInSeconds || 300) * 0.8);
      refreshTimer = setTimeout(() => {
        refreshToken().catch(() => {});
      }, seconds * 1000);
    }

    // One refresh at a time; concurrent callers share it.
    function refreshToken() {
      if (!refreshing) {
        refreshing = authorize()
          .then((auth) => {
            failedRefreshes = 0;
            scheduleRefresh(auth.expiresIn);
            return auth;
          })
          .catch((error) => {
            failedRefreshes += 1;
            if (error.status === 401 || error.status === 403 || failedRefreshes >= MAX_REFRESH_ATTEMPTS) showError(error);
            else scheduleRefresh(10);
            throw error;
          })
          .finally(() => {
            refreshing = null;
          });
      }
      return refreshing;
    }

    // Safari/iOS play HLS natively; the token is in the URL, so reload the
    // stream with a fresh one and continue from the same second.
    async function reloadNative() {
      const position = video.currentTime;
      const wasPlaying = !video.paused;
      const auth = await refreshToken();
      if (!active) return;
      video.addEventListener(
        "loadedmetadata",
        () => {
          video.currentTime = position;
          if (wasPlaying) video.play().catch(() => {});
        },
        { once: true },
      );
      video.src = streamUrlFor(auth);
    }

    // A fresh token can't fix a stream that is broken for another reason, so stop
    // after a few reloads in a row that never reached the video's metadata.
    const onNativeLoaded = () => {
      nativeReloads = 0;
    };
    const onNativeError = () => {
      if (!active || failedRefreshes >= MAX_REFRESH_ATTEMPTS) return;
      if (nativeReloads >= MAX_REFRESH_ATTEMPTS) {
        clearTimeout(refreshTimer);
        video.removeEventListener("error", onNativeError);
        setStreamError("Unable to play the secure video stream.");
        return;
      }
      nativeReloads += 1;
      reloadNative().catch(() => {});
    };

    async function start() {
      if (!token || !courseId || !videoId) {
        setStreamError("This lesson is not configured for secure playback.");
        setLoadingStream(false);
        return;
      }

      setLoadingStream(true);
      setStreamError("");
      setEmbedUrl("");

      try {
        const auth = await authorize();
        if (!active) return;
        // Bunny lessons play in Bunny's player; it signs its own media requests.
        if (auth.provider === "bunny") {
          setEmbedUrl(auth.embedUrl);
          setLoadingStream(false);
          return;
        }
        if (!video) throw new Error("Video player is unavailable");
        const streamUrl = streamUrlFor(auth);

        // hls.js first: recent Chrome also reports native HLS, but its token and error handling live here.
        if (!Hls.isSupported() && video.canPlayType("application/vnd.apple.mpegurl")) {
          video.addEventListener("error", onNativeError);
          video.addEventListener("loadedmetadata", onNativeLoaded);
          video.src = streamUrl;
        } else if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            xhrSetup: (xhr) => {
              xhr.setRequestHeader("Authorization", `Bearer ${currentToken}`);
            },
          });
          hlsRef.current = hls;
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!active || !data?.fatal) return;
            const code = data.response?.code;
            if (code === 410 || code === 401) {
              // Token expired (for example after the computer slept): renew and resume.
              refreshToken()
                .then(() => {
                  if (active) hls.startLoad(video.currentTime);
                })
                .catch(() => {});
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              setStreamError("Unable to play the secure video stream.");
            }
          });
        } else {
          throw new Error("This browser does not support HLS playback.");
        }

        scheduleRefresh(auth.expiresIn);
        if (active) setLoadingStream(false);
      } catch (error) {
        showError(error);
      }
    }

    start();

    return () => {
      active = false;
      clearTimeout(refreshTimer);
      if (hls) hls.destroy();
      hlsRef.current = null;
      if (video) {
        video.removeEventListener("error", onNativeError);
        video.removeEventListener("loadedmetadata", onNativeLoaded);
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [courseId, videoId, token]);

  useEffect(() => {
    const blockContextMenu = (event) => {
      if (containerRef.current?.contains(event.target)) event.preventDefault();
    };

    const onKey = (event) => {
      const key = event.key.toLowerCase();
      const blockedKey =
        (event.ctrlKey && ["s", "p", "u"].includes(key)) ||
        (event.metaKey && ["s", "p"].includes(key)) ||
        key === "printscreen" ||
        key === "f12";

      if (
        blockedKey &&
        containerRef.current?.contains(document.activeElement)
      ) {
        event.preventDefault();
        setBlocked(true);
        if (videoRef.current) videoRef.current.pause();
        window.setTimeout(() => setBlocked(false), 2500);
      }
    };

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    } catch {
      // Browser may reject fullscreen; normal playback remains available.
    }
  };

  const watermarkText = `${user?.email || (user?.mobile ? `+91 ${user.mobile}` : "SkyBirds Learner")} • AUTHORIZED VIEWER`;

  return (
    <div className="select-none">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl bg-black shadow-2xl aspect-video w-full flex items-center justify-center"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        style={{ backgroundColor: "#000" }}
      >
        {embedUrl && (
          <iframe
            src={embedUrl}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; gyroscope; autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}

        {/* Always keep the <video> mounted so the ref is available when auth finishes */}
        <video
          ref={videoRef}
          controls
          controlsList="nodownload noremoteplayback nofullscreen"
          disablePictureInPicture
          disableRemotePlayback
          playsInline
          preload="metadata"
          className={`h-full w-full object-contain ${
            loadingStream || streamError || embedUrl ? "invisible absolute" : ""
          }`}
          onContextMenu={(e) => e.preventDefault()}
        />

        {loadingStream && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white/80">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <p className="text-xs font-medium">Authorizing secure video...</p>
          </div>
        )}

        {streamError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-white/75">
            <p className="text-sm font-semibold">{streamError}</p>
          </div>
        )}

        {/* Watermark stays inside the fullscreen element */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
          <div className="absolute inset-0 origin-center rotate-[-15deg] opacity-20 flex flex-col justify-around">
            {Array.from({ length: 8 }).map((_, index) => (
              <p
                key={index}
                className="whitespace-nowrap py-4 text-center text-[10px] sm:text-xs font-bold tracking-[0.25em] text-white drop-shadow"
              >
                {watermarkText}
              </p>
            ))}
          </div>
        </div>

        {!loadingStream && !streamError && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute right-3 top-3 z-20 rounded-lg bg-black/60 p-2 text-white backdrop-blur hover:bg-black/80"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        )}

        {blocked && (
          <div className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
            <ShieldAlert className="h-3.5 w-3.5" />
            Download shortcut blocked
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/60">
            <Lock className="h-3 w-3 text-leaf" />
            Protected streaming • purchase authorization • short-lived access
          </p>
        </div>
      </div>
    </div>
  );
}
