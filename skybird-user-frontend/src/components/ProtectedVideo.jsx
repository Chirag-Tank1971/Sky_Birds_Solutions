import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { useUser } from "../context/UserContext";
import { Lock, ShieldAlert, Maximize, Minimize } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

export default function ProtectedVideo({ title, courseId, videoId }) {
  const { user, token } = useUser();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [blocked, setBlocked] = useState(false);
  const [loadingStream, setLoadingStream] = useState(true);
  const [streamError, setStreamError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
 

  useEffect(() => {
    let active = true;
    let hls;

    async function start() {
      if (!token || !courseId || !videoId) {
        setStreamError("This lesson is not configured for secure playback.");
        setLoadingStream(false);
        return;
      }

      setLoadingStream(true);
      setStreamError("");

      try {
        const authResponse = await fetch(
          `${API_BASE}/courses/${encodeURIComponent(courseId)}/videos/${encodeURIComponent(videoId)}/playback`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          },
        );

        const authData = await authResponse.json().catch(() => ({}));
        if (!authResponse.ok) {
          const error = new Error(
            authData.message || "Playback authorization failed",
          );
          error.status = authResponse.status;
          throw error;
        }

        // ---- FIXED URL CONSTRUCTION ----
        const apiOrigin = API_BASE.replace(/\/api\/?$/, "");
        const masterUrl = new URL(authData.masterUrl, apiOrigin);
        masterUrl.searchParams.set("token", authData.token);
        const streamUrl = masterUrl.toString();
        // --------------------------------

        const video = videoRef.current;
        if (!video) throw new Error("Video player is unavailable");

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
        } else if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            xhrSetup: (xhr) => {
              xhr.setRequestHeader("Authorization", `Bearer ${authData.token}`);
            },
          });
          hlsRef.current = hls;
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!active || !data?.fatal) return;
            if (data.response?.code === 410) {
              setStreamError(
                "Playback authorization expired. Please reload the lesson.",
              );
            } else {
              setStreamError("Unable to play the secure video stream.");
            }
          });
        } else {
          throw new Error("This browser does not support HLS playback.");
        }

        if (active) setLoadingStream(false);
      } catch (error) {
        if (!active) return;
        setLoadingStream(false);
        if (error.status === 401)
          setStreamError("Please log in again to continue.");
        else if (error.status === 403)
          setStreamError("You do not own this course.");
        else if (error.status === 404)
          setStreamError("This lesson is not available.");
        else if (error.status === 410)
          setStreamError("Playback authorization expired. Reload the lesson.");
        else
          setStreamError(error.message || "Unable to start secure playback.");
      }
    }

    start();

    return () => {
      active = false;
      if (hls) hls.destroy();
      hlsRef.current = null;
      const video = videoRef.current;
      if (video) {
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
            loadingStream || streamError ? "invisible absolute" : ""
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
            className="absolute bottom-3 right-3 z-20 rounded-lg bg-black/60 p-2 text-white backdrop-blur hover:bg-black/80"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        )}

        {blocked && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
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
            Protected HLS streaming • purchase authorization • short-lived
            access
          </p>
        </div>
      </div>
    </div>
  );
}
