import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API, { assetUrl } from "../api/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Play,
  X,
  Pencil,
  Radio,
  Clock,
  Lock,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import Hls from "hls.js";
import { uploadToBunny } from "../api/bunnyUpload";
import CourseModules, { ConfirmModal, isLocked } from "../components/CourseModules";

const STATUS_BATCH = 50;

const VideoPreviewModal = ({ preview, onClose }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!preview || !videoRef.current) return undefined;

    const video = videoRef.current;
    const apiBase = (API.defaults.baseURL || "/api").replace(/\/$/, "");
    const masterUrl = new URL(
      `${preview.videoId}/master.m3u8?token=${encodeURIComponent(preview.token)}`,
      `${apiBase}/videos/`,
    ).toString();
    let hls;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = masterUrl;
    } else if (Hls.isSupported()) {
      hls = new Hls({
        xhrSetup: (xhr, url) => {
          // The API rewrites segment/key paths to /api/...; resolve those paths
          // against the API origin when the admin and API are hosted separately.
          try {
            const requestUrl = new URL(url, window.location.origin);
            if (requestUrl.pathname.startsWith("/api/")) {
              const apiOrigin = new URL(apiBase, window.location.origin).origin;
              xhr.open("GET", `${apiOrigin}${requestUrl.pathname}${requestUrl.search}`, true);
            }
          } catch {
            // Let Hls.js handle malformed URLs and surface its normal error.
          }
        },
      });
      hls.loadSource(masterUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) toast.error("Unable to play this video preview");
      });
    } else {
      toast.error("This browser does not support HLS video playback");
    }

    return () => {
      if (hls) hls.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [preview]);

  if (!preview) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label={`Preview ${preview.title}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-gray-900">{preview.title}</h2>
            <p className="text-xs text-gray-500">Admin video preview · secure stream</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close video preview" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="bg-black">
          {preview.embedUrl ? (
            <iframe
              src={preview.embedUrl}
              title={preview.title}
              className="aspect-video max-h-[75vh] w-full border-0"
              allow="accelerometer; gyroscope; autoplay; encrypted-media"
            />
          ) : (
            <video ref={videoRef} controls playsInline className="aspect-video max-h-[75vh] w-full" />
          )}
        </div>
      </div>
    </div>
  );
};

const DeleteLessonModal = ({ lesson, busy, onCancel, onConfirm }) => {
  if (!lesson) return null;
  const close = () => {
    if (!busy) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-lesson-title"
      aria-describedby="delete-lesson-text"
      onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
      onKeyDown={(event) => { if (event.key === "Escape") close(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="delete-lesson-title" className="text-lg font-semibold text-gray-900">Delete this lesson?</h2>
            <p className="mt-1 break-words text-sm font-medium text-gray-700">{lesson.title}</p>
            <p id="delete-lesson-text" className="mt-2 text-sm text-gray-500">
              The lesson and its video will be permanently removed from this course, including for learners who bought it. This can't be undone.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          {/* Cancel takes focus so pressing Enter can't delete by accident. */}
          <button
            type="button"
            autoFocus
            onClick={close}
            disabled={busy}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Deleting…" : "Delete lesson"}
          </button>
        </div>
      </div>
    </div>
  );
};

const VideoStatusLabel = ({ status, progress }) => {
  if (status === "processing") {
    return (
      <div className="flex items-center gap-1 mt-1 text-amber-600">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs font-medium">
          Processing video{progress ? ` ${progress}%` : ""}… you can keep editing and save
        </span>
      </div>
    );
  }
  if (status === "uploading") {
    return (
      <div className="flex items-center gap-1 mt-1 text-primary-700">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs font-medium">Uploading…</span>
      </div>
    );
  }
  if (status === "not_uploaded") {
    return (
      <div className="flex items-center gap-1 mt-1 text-amber-700">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Upload incomplete. Choose Resume and pick the same file.</span>
      </div>
    );
  }
  if (status === "missing") {
    return (
      <div className="flex items-center gap-1 mt-1 text-red-600">
        <X className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Video file not found on this server. Replace this video.</span>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="flex items-center gap-1 mt-1 text-red-600">
        <X className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Processing failed. Replace this video.</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 mt-1">
      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
      <span className="text-xs text-green-600 font-medium">Video ready</span>
    </div>
  );
};

const EMPTY_FORM = {
  id: "",
  platform: "",
  title: "",
  price: "",
  duration: "",
  lessons: 0,
  level: "Beginner",
  thumbnail: "",
  description: "",
  videos: [],
  modules: [],
  status: "unlive",
};

const STATUS_OPTIONS = [
  { value: "live", label: "Live", icon: Radio, tone: "border-green-300 bg-green-50 text-green-800", text: "Listed on the website and open for purchase." },
  { value: "upcoming", label: "Upcoming", icon: Clock, tone: "border-amber-300 bg-amber-50 text-amber-800", text: "Listed as \"Coming soon\". Visitors can't buy it yet." },
  { value: "private", label: "Private", icon: Lock, tone: "border-blue-300 bg-blue-50 text-blue-800", text: "Hidden from the list. Anyone with the link can view and buy." },
  { value: "unlive", label: "Unlive", icon: EyeOff, tone: "border-gray-300 bg-gray-100 text-gray-700", text: "Hidden and not for sale. Existing buyers keep access." },
];

const mapVideos = (videos) =>
  (videos || []).map((video) => ({
    id: video.id,
    title: video.title,
    duration: video.duration || "",
    videoId: video.videoId,
    provider: video.provider || "local",
    upcoming: Boolean(video.upcoming),
    moduleId: video.moduleId || "",
  }));

// Course details only: lessons, modules and status are saved on the server as soon as they change.
const detailsOf = ({ videos, modules, status, ...details }) => details;

const readDraft = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

const CourseForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cloudinary / Thumbnail upload state
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingLessonVideo, setUploadingLessonVideo] = useState(false);
  const [replaceTargetId, setReplaceTargetId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);
  const [uploadPercent, setUploadPercent] = useState(0);

  const thumbInputRef = useRef(null);
  const lessonVideoInputRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);

  // Unsaved changes survive a refresh: they are kept as a draft in this browser until the course is saved.
  const draftKey = `skybirds-course-draft:${id || "new"}`;
  const [baseline, setBaseline] = useState(null); // the form as loaded (JSON); null until loading finishes
  const [restoredDraft, setRestoredDraft] = useState(false);
  const leavingRef = useRef(false);
  const [editingLesson, setEditingLesson] = useState(null); // { id, title, duration } while renaming
  const [lessonBusy, setLessonBusy] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const [newVideo, setNewVideo] = useState({
    title: "",
    duration: "",
    videoId: "",
    provider: "",
    moduleId: "",
  });
  const [bulkUploading, setBulkUploading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [resumeTarget, setResumeTarget] = useState(null);
  const resumeInputRef = useRef(null);
  // Finished uploading in this session: only these announce their result, and Bunny may not list them as received yet.
  const uploadedIdsRef = useRef(new Set());
  // Videos uploaded to Bunny Stream in this session (their status is checked with Bunny).
  const [bunnyIds, setBunnyIds] = useState({});

  // Processing state of videos uploaded in this session: videoId -> "processing" | "ready" | "failed".
  // Videos already saved on the course have no entry and are treated as ready.
  const [videoStatus, setVideoStatus] = useState({});
  const [lessonToDelete, setLessonToDelete] = useState(null);
  // Encoding progress (0-100) reported by Bunny, and a tick that keeps polling while anything is processing.
  const [videoProgress, setVideoProgress] = useState({});
  const [pollTick, setPollTick] = useState(0);

  useEffect(() => {
    const pending = Object.keys(videoStatus).filter((videoId) => videoStatus[videoId] === "processing");
    if (pending.length === 0) return undefined;
    const timer = setTimeout(async () => {
      // Skip while the tab is hidden; the next tick checks again.
      if (document.hidden) {
        setPollTick((tick) => tick + 1);
        return;
      }
      const updates = {};
      const progress = {};
      const bunnyPending = pending.filter((videoId) => bunnyIds[videoId]);
      for (let start = 0; start < bunnyPending.length; start += STATUS_BATCH) {
        try {
          const { data } = await API.post("/admin/videos/bunny/status", { ids: bunnyPending.slice(start, start + STATUS_BATCH) });
          Object.entries(data.data).forEach(([videoId, video]) => {
            if (video.progress) progress[videoId] = video.progress;
            if (video.status !== "processing") updates[videoId] = video.status;
            else if (video.rawStatus === 0 && !uploadedIdsRef.current.has(videoId)) updates[videoId] = "not_uploaded";
          });
        } catch (err) {
          // Keep polling; a temporary network error should not mark the videos failed.
          if (err.response?.status === 503) toast.error(err.response.data?.message || "Video service is not available", { id: "video-status-error" });
        }
      }
      for (const videoId of pending.filter((id) => !bunnyIds[id])) {
        try {
          const { data } = await API.get(`/admin/videos/${videoId}/status`);
          if (data.progress) progress[videoId] = data.progress;
          if (data.status === "ready") updates[videoId] = "ready";
          else if (data.status === "failed" || data.status === "missing") updates[videoId] = "failed";
        } catch {
          // Keep polling; a temporary network error should not mark the video failed.
        }
      }
      const announced = Object.entries(updates).filter(([videoId]) => uploadedIdsRef.current.has(videoId));
      const finished = announced.filter(([, status]) => status === "ready").length;
      if (finished) toast.success(finished === 1 ? "A lesson video finished processing" : `${finished} lesson videos finished processing`);
      if (announced.length > finished) toast.error("A lesson video failed to process. Please upload it again.");
      if (Object.keys(progress).length) setVideoProgress((prev) => ({ ...prev, ...progress }));
      if (Object.keys(updates).length) setVideoStatus((prev) => ({ ...prev, ...updates }));
      // Schedule the next check even when nothing changed yet.
      setPollTick((tick) => tick + 1);
    }, pollTick === 0 ? 500 : 10000);
    return () => clearTimeout(timer);
  }, [videoStatus, bunnyIds, pollTick]);

  // Older API versions processed uploads before replying and sent no status.
  const trackUpload = (data) => {
    const status = data.status === "processing" ? "processing" : "ready";
    if (data.provider === "bunny") setBunnyIds((prev) => ({ ...prev, [data.videoId]: true }));
    uploadedIdsRef.current.add(data.videoId);
    setVideoStatus((prev) => ({ ...prev, [data.videoId]: status }));
    return status;
  };

  const statusOf = (videoId) => videoStatus[videoId] || "ready";

  const dirty = baseline !== null && (JSON.stringify(detailsOf(form)) !== baseline || Boolean(newVideo.videoId || newVideo.title));

  useEffect(() => {
    if (baseline === null) return;
    try {
      if (dirty) localStorage.setItem(draftKey, JSON.stringify({ form: detailsOf(form), newVideo, savedAt: Date.now() }));
      else localStorage.removeItem(draftKey);
    } catch {
      // Storage unavailable (private mode): the leave warning below still protects unsaved work.
    }
  }, [form, newVideo, baseline, dirty, draftKey]);

  useEffect(() => {
    if (!dirty && !uploadingLessonVideo && !bulkUploading) return undefined;
    const warn = (event) => {
      if (leavingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, uploadingLessonVideo, bulkUploading]);

  const discardDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // Nothing stored.
    }
    leavingRef.current = true;
    window.location.reload();
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const platRes = await API.get("/admin/platforms");
        if (platRes.data.success) {
          setPlatforms(platRes.data.data.filter((p) => p.isActive));
        }

        let loadedForm = EMPTY_FORM;
        if (isEdit) {
          const { data } = await API.get(`/admin/courses/${id}`);
          if (data.success) {
            const c = data.data;
            loadedForm = {
              id: c.id,
              platform: c.platform,
              title: c.title,
              price: c.price,
              duration: c.duration || "",
              lessons: c.lessons || 0,
              level: c.level || "Beginner",
              thumbnail: c.thumbnail || "",
              description: c.description || "",
              videos: mapVideos(c.videos),
              modules: c.modules || [],
              status: c.status || "live",
            };
            setForm(loadedForm);
            // Check Bunny lessons right away so the editor shows which are still encoding.
            const bunny = loadedForm.videos.filter((video) => video.provider === "bunny" && video.videoId);
            setBunnyIds(Object.fromEntries(bunny.map((video) => [video.videoId, true])));
            setVideoStatus(Object.fromEntries(bunny.map((video) => [video.videoId, "processing"])));
            // Local lessons live on this server's disk, so confirm each file is really there.
            loadedForm.videos
              .filter((video) => video.provider !== "bunny" && video.videoId)
              .forEach(async ({ videoId }) => {
                try {
                  const { data } = await API.get(`/admin/videos/${videoId}/status`);
                  if (data.status !== "ready") {
                    setVideoStatus((prev) => ({ ...prev, [videoId]: data.status === "queued" ? "processing" : data.status }));
                  }
                } catch {
                  // Couldn't check; leave the lesson as it is rather than flag it wrongly.
                }
              });
          }
        }

        const draft = readDraft(draftKey);
        if (draft?.form) {
          setForm({ ...loadedForm, ...detailsOf(draft.form) });
          if (draft.newVideo?.videoId) {
            setNewVideo(draft.newVideo);
            if (draft.newVideo.provider === "bunny") {
              setBunnyIds((prev) => ({ ...prev, [draft.newVideo.videoId]: true }));
              setVideoStatus((prev) => ({ ...prev, [draft.newVideo.videoId]: "processing" }));
            }
          }
          setRestoredDraft(true);
        }
        setBaseline(JSON.stringify(detailsOf(loadedForm)));
      } catch (err) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Thumbnail Cloudinary Upload Handler
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("thumbnail", file);

    setUploadingThumb(true);
    try {
      const { data } = await API.post("/admin/upload/thumbnail", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, thumbnail: data.url }));
        toast.success("Thumbnail uploaded successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload thumbnail");
    } finally {
      setUploadingThumb(false);
      if (thumbInputRef.current) thumbInputRef.current.value = "";
    }
  };

  // New uploads go straight from this browser to Bunny Stream (resumable TUS); the API only signs them.
  // Falls back to the legacy server upload when Bunny isn't configured on the API (503).
  const uploadVideoFile = async (file, title) => {
    let signed;
    try {
      ({ data: signed } = await API.post("/admin/videos/bunny/uploads", { title }));
    } catch (err) {
      if (err.response?.status !== 503) throw err;
      const formData = new FormData();
      formData.append("video", file);
      const { data } = await API.post("/admin/upload/video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => event.total && setUploadPercent(Math.round((event.loaded / event.total) * 100)),
      });
      return { ...data, provider: "local" };
    }

    await uploadToBunny(file, signed, title, setUploadPercent).promise;
    return { success: true, videoId: signed.videoId, provider: "bunny", status: "processing" };
  };

  // Continue an interrupted upload. The same file carries on where it stopped; a different one starts over.
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    const lesson = resumeTarget;
    e.target.value = "";
    setResumeTarget(null);
    if (!file || !lesson) return;
    setUploadingLessonVideo(true);
    setUploadPercent(0);
    try {
      const { data: signed } = await API.post(`/admin/videos/bunny/${lesson.videoId}/upload-signature`);
      setVideoStatus((prev) => ({ ...prev, [lesson.videoId]: "uploading" }));
      await uploadToBunny(file, signed, lesson.title, setUploadPercent).promise;
      toast.success("Upload finished. Processing in the background…");
      trackUpload({ videoId: lesson.videoId, provider: "bunny", status: "processing" });
    } catch (err) {
      if (err.response?.status === 409) trackUpload({ videoId: lesson.videoId, provider: "bunny", status: "processing" });
      else {
        setVideoStatus((prev) => ({ ...prev, [lesson.videoId]: "not_uploaded" }));
        lessonError(err, "Upload failed. Try again.");
      }
    } finally {
      setUploadingLessonVideo(false);
    }
  };

  // Individual Lesson Video Upload Handler
  const handleLessonVideoUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }

    setUploadingLessonVideo(true);
    setUploadPercent(0);

    try {
      const replacing = form.videos.find((video) => video.id === replaceTargetId);
      const data = await uploadVideoFile(file, replacing?.title || newVideo.title || file.name);

      if (data.success && data.videoId) {
        const status = trackUpload(data);
        if (status === "processing") toast.success("Video uploaded. Processing in the background…");
        if (replaceTargetId) {
          const { data: saved } = await API.put(`/admin/courses/${id}/videos/${replaceTargetId}`, {
            videoId: data.videoId,
            provider: data.provider,
          });
          applyCourse(saved.data);
          toast.success(saved.message || "Lesson video replaced.");
          setReplaceTargetId(null);
        } else {
          setNewVideo((prev) => ({
            ...prev,
            videoId: data.videoId,
            provider: data.provider,
          }));
          if (status === "ready") toast.success("Lesson video processed successfully");
        }
      } else {
        toast.error(data.message || "Video processing failed");
      }
    } catch (err) {
      console.error("Lesson video upload error:", err);

      toast.error(
        err.response?.data?.message || "Failed to upload lesson video",
      );
    } finally {
      setUploadingLessonVideo(false);

      if (lessonVideoInputRef.current) {
        lessonVideoInputRef.current.value = "";
      }
    }
  };

  // Take the server's copy of lessons and status after every change.
  const applyCourse = (course) => {
    if (course) setForm((prev) => ({ ...prev, videos: mapVideos(course.videos), modules: course.modules || [], status: course.status || prev.status }));
  };

  const lessonError = (err, fallback) => toast.error(err.response?.data?.message || fallback);

  const handlePreviewVideo = async (video) => {
    if (!video?.videoId) {
      toast.error("Upload a video before previewing it");
      return;
    }
    setLoadingPreviewId(video.id);
    try {
      if (video.provider === "bunny") {
        const { data } = await API.post(`/admin/videos/bunny/${video.videoId}/preview`);
        setPreview({ title: video.title, embedUrl: data.embedUrl });
        return;
      }
      const { data } = await API.post(`/admin/videos/${video.videoId}/preview-token`);
      if (!data.success || !data.token) throw new Error(data.message || "Preview authorization failed");
      setPreview({ title: video.title, videoId: video.videoId, token: data.token });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Unable to preview video");
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const moveVideo = async (videoId, direction) => {
    if (lessonBusy) return;
    // Swap with its neighbour in the same group; lessons keep one overall order.
    const groupOf = (video) => (form.modules.some((item) => item.id === video.moduleId) ? video.moduleId : "");
    const current = form.videos.find((video) => video.id === videoId);
    const group = form.videos.filter((video) => groupOf(video) === groupOf(current));
    const neighbour = group[group.indexOf(current) + direction];
    if (!neighbour) return;
    const index = form.videos.indexOf(current);
    const nextIndex = form.videos.indexOf(neighbour);
    const videos = [...form.videos];
    [videos[index], videos[nextIndex]] = [videos[nextIndex], videos[index]];
    const previous = form.videos;
    setForm((prev) => ({ ...prev, videos }));
    setLessonBusy(true);
    try {
      const { data } = await API.put(`/admin/courses/${id}/videos/order`, { order: videos.map((video) => video.id) });
      applyCourse(data.data);
    } catch (err) {
      setForm((prev) => ({ ...prev, videos: previous }));
      lessonError(err, "Couldn't reorder lessons");
    } finally {
      setLessonBusy(false);
    }
  };

  const saveLessonEdit = async () => {
    if (!editingLesson?.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    setLessonBusy(true);
    try {
      const { data } = await API.put(`/admin/courses/${id}/videos/${editingLesson.id}`, {
        title: editingLesson.title,
        duration: editingLesson.duration,
      });
      applyCourse(data.data);
      setEditingLesson(null);
      toast.success("Lesson updated");
    } catch (err) {
      lessonError(err, "Couldn't update the lesson");
    } finally {
      setLessonBusy(false);
    }
  };

  const updateLesson = async (lesson, changes, success, fallback) => {
    setLessonBusy(true);
    try {
      const { data } = await API.put(`/admin/courses/${id}/videos/${lesson.id}`, changes);
      applyCourse(data.data);
      toast.success(success);
    } catch (err) {
      lessonError(err, fallback);
    } finally {
      setLessonBusy(false);
      setConfirm(null);
    }
  };

  const toggleUpcoming = (lesson) => {
    if (lesson.upcoming) {
      updateLesson(lesson, { upcoming: false }, "Lesson published", "Couldn't publish the lesson");
      return;
    }
    setConfirm({
      title: `Unpublish ${lesson.title}?`,
      message: "It locks for everyone, including people who already bought the course, until you publish it again.",
      label: "Unpublish lesson",
      onConfirm: () => updateLesson(lesson, { upcoming: true }, "Lesson unpublished", "Couldn't change the lesson"),
    });
  };

  const moveToModule = (lesson, moduleId) => {
    const move = () => updateLesson(lesson, { moduleId }, "Lesson moved", "Couldn't move the lesson");
    const target = form.modules.find((item) => item.id === moduleId);
    if (!isLocked(form.modules, lesson) && target?.upcoming) {
      setConfirm({
        title: `Move ${lesson.title}?`,
        message: `${target.title} isn't published, so this lesson will lock for everyone, including buyers, until you publish that module.`,
        label: "Move lesson",
        onConfirm: move,
      });
      return;
    }
    move();
  };

  const markBlockedLessons = (lessons) => {
    const known = { processing: "processing", not_uploaded: "not_uploaded", failed: "failed", missing: "missing" };
    const updates = {};
    lessons.forEach((blocked) => {
      const videoId = form.videos.find((video) => video.id === blocked.id)?.videoId;
      if (videoId && known[blocked.state]) updates[videoId] = known[blocked.state];
    });
    setVideoStatus((prev) => ({ ...prev, ...updates }));
  };

  const markCreated = (videoIds) => {
    setBunnyIds((prev) => ({ ...prev, ...Object.fromEntries(videoIds.map((videoId) => [videoId, true])) }));
    setVideoStatus((prev) => ({ ...prev, ...Object.fromEntries(videoIds.map((videoId) => [videoId, "uploading"])) }));
  };

  const markUploaded = (videoId) => {
    uploadedIdsRef.current.add(videoId);
    setVideoStatus((prev) => ({ ...prev, [videoId]: "processing" }));
  };

  const changeStatus = async (status) => {
    if (status === form.status || statusSaving) return;
    setStatusSaving(true);
    try {
      const { data } = await API.patch(`/admin/courses/${id}/status`, { status });
      applyCourse(data.data);
      toast.success(`Course is now ${STATUS_OPTIONS.find((option) => option.value === status)?.label || status}`);
    } catch (err) {
      lessonError(err, "Couldn't change the status");
    } finally {
      setStatusSaving(false);
    }
  };

  const addVideo = async () => {
    if (!newVideo.title) {
      toast.error("Lesson title is required");
      return;
    }

    setLessonBusy(true);
    try {
      const { data } = await API.post(`/admin/courses/${id}/videos`, {
        title: newVideo.title,
        duration: newVideo.duration || "",
        videoId: newVideo.videoId,
        provider: newVideo.provider || "local",
        moduleId: newVideo.moduleId || "",
        upcoming: true,
      });
      applyCourse(data.data);
      toast.success("Lesson added. It stays hidden until you publish it.");
    } catch (err) {
      lessonError(err, "Couldn't add the lesson");
      return;
    } finally {
      setLessonBusy(false);
    }

    setNewVideo((prev) => ({
      title: "",
      duration: "",
      videoId: "",
      provider: "",
      moduleId: prev.moduleId,
    }));
  };

  const removeVideo = (lesson) => setLessonToDelete(lesson);

  const confirmRemoveVideo = async () => {
    const lesson = lessonToDelete;
    setLessonBusy(true);
    try {
      const { data } = await API.delete(`/admin/courses/${id}/videos/${lesson.id}`);
      applyCourse(data.data);
      toast.success("Lesson removed");
    } catch (err) {
      lessonError(err, "Couldn't remove the lesson");
    } finally {
      setLessonBusy(false);
      setLessonToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const payload = {
        id: form.id,
        platform: form.platform,
        title: form.title,
        price: Number(form.price),
        duration: form.duration,
        level: form.level,
        thumbnail: form.thumbnail,
        description: form.description,
      };

      if (isEdit) {
        await API.put(`/admin/courses/${id}`, payload);
        toast.success("Course details saved");
      } else {
        await API.post("/admin/courses", payload);
        toast.success("Course created. Now add its lessons.");
      }

      try {
        localStorage.removeItem(draftKey);
      } catch {
        // Nothing stored.
      }
      if (isEdit) {
        setBaseline(JSON.stringify(detailsOf(form)));
        setRestoredDraft(false);
      } else {
        leavingRef.current = true;
        navigate(`/courses/edit/${encodeURIComponent(form.id)}`);
      }
    } catch (err) {
      console.error("Course save error:", err);

      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const renderLesson = (v, idx, count) => {
    const lessonModule = form.modules.find((item) => item.id === v.moduleId);
    return (
                <div
                  key={v.id}
                  className="flex flex-wrap items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-400 w-6 text-center">#{idx + 1}</span>
                    <button type="button" onClick={() => moveVideo(v.id, -1)} disabled={idx === 0 || lessonBusy} aria-label={`Move ${v.title} up`} title="Move up" className="p-1 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => moveVideo(v.id, 1)} disabled={idx === count - 1 || lessonBusy} aria-label={`Move ${v.title} down`} title="Move down" className="p-1 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-[12rem]">
                    {editingLesson?.id === v.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={editingLesson.title}
                          onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") saveLessonEdit(); if (e.key === "Escape") setEditingLesson(null); }}
                          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Lesson title"
                          autoFocus
                        />
                        <input
                          value={editingLesson.duration}
                          onChange={(e) => setEditingLesson({ ...editingLesson, duration: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") saveLessonEdit(); if (e.key === "Escape") setEditingLesson(null); }}
                          className="w-28 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="15m 30s"
                        />
                        <button type="button" onClick={saveLessonEdit} disabled={lessonBusy} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50">Save</button>
                        <button type="button" onClick={() => setEditingLesson(null)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <span className="truncate">{v.title}</span>
                          {(v.upcoming || lessonModule?.upcoming) && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              <Lock className="h-3 w-3" /> Upcoming
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {v.duration || "Video Lesson"}
                        </p>
                      </>
                    )}

                    {v.videoId ? (
                      <>
                        <VideoStatusLabel status={statusOf(v.videoId)} progress={videoProgress[v.videoId]} />
                        <p className="text-[11px] text-gray-400 font-mono mt-1 break-all">Video ID: {v.videoId}</p>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">No video yet. Upload one, then publish the lesson.</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {form.modules.length > 0 && (
                      <select
                        value={lessonModule ? v.moduleId : ""}
                        onChange={(e) => moveToModule(v, e.target.value)}
                        disabled={lessonBusy}
                        aria-label={`Module for ${v.title}`}
                        className="max-w-[9rem] rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Course content</option>
                        {form.modules.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => handlePreviewVideo(v)}
                      disabled={!v.videoId || loadingPreviewId === v.id || statusOf(v.videoId) !== "ready"}
                      title="Play this lesson video"
                      className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition disabled:opacity-50"
                    >
                      {loadingPreviewId === v.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Play
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLesson({ id: v.id, title: v.title, duration: v.duration || "" })}
                      title="Rename this lesson"
                      className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    {statusOf(v.videoId) === "not_uploaded" && (
                      <button
                        type="button"
                        onClick={() => { setResumeTarget(v); resumeInputRef.current?.click(); }}
                        disabled={uploadingLessonVideo}
                        title="Pick the same file to continue where it stopped"
                        className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" /> Resume
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setReplaceTargetId(v.id); lessonVideoInputRef.current?.click(); }}
                      disabled={uploadingLessonVideo}
                      title="Replace this lesson's video"
                      className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> {v.videoId ? "Replace" : "Upload video"}
                    </button>
                    {/* A locked module publishes as a whole, from its card. */}
                    {!lessonModule?.upcoming && (
                    <button
                      type="button"
                      onClick={() => toggleUpcoming(v)}
                      disabled={lessonBusy || (v.upcoming && (!v.videoId || statusOf(v.videoId) !== "ready"))}
                      title={v.upcoming ? "Make this lesson available to learners" : "Show as upcoming (locked) to learners"}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-lg transition disabled:opacity-50 ${
                        v.upcoming ? "text-green-700 bg-green-50 hover:bg-green-100" : "text-amber-700 bg-amber-50 hover:bg-amber-100"
                      }`}
                    >
                      {v.upcoming ? <><Radio className="w-3.5 h-3.5" /> Publish</> : <><Lock className="w-3.5 h-3.5" /> Mark upcoming</>}
                    </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeVideo(v)}
                      disabled={lessonBusy}
                      title="Remove lesson"
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-16">
      <button
        onClick={() => navigate("/courses")}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </button>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? form.title || "Edit course" : "Create new course"}</h1>
        {isEdit && (
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_OPTIONS.find((option) => option.value === form.status)?.tone || ""}`}>
            {STATUS_OPTIONS.find((option) => option.value === form.status)?.label || form.status}
          </span>
        )}
      </div>
      {!isEdit && (
        <p className="-mt-6 mb-8 text-sm text-gray-500">
          Step 1 of 2: add the course details. Next you'll add lessons and choose when it goes live.
        </p>
      )}

      {restoredDraft && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            Your unsaved changes were restored from this browser. Save the course to keep them.
          </p>
          <button type="button" onClick={discardDraft} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-amber-800 hover:bg-amber-100">
            Discard draft
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course ID (slug)
              </label>
              <input
                name="id"
                value={form.id}
                onChange={handleChange}
                disabled={isEdit}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100"
                placeholder="amz-fba-mastery"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marketplace Platform
              </label>
              <select
                name="platform"
                value={form.platform}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none capitalize"
              >
                <option value="">Select marketplace platform</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Amazon Ads & ROAS Optimization Masterclass"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Duration
              </label>
              <input
                name="duration"
                value={form.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="4h 30m"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level
              </label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          {/* Thumbnail with Cloudinary Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Thumbnail (Cloudinary / Image File or URL)
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  name="thumbnail"
                  value={form.thumbnail}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  placeholder="https://res.cloudinary.com/... or upload below"
                />
                <input
                  type="file"
                  ref={thumbInputRef}
                  onChange={handleThumbnailUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  disabled={uploadingThumb}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-sm font-medium transition disabled:opacity-60"
                >
                  {uploadingThumb ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload to Cloudinary
                    </>
                  )}
                </button>
              </div>

              {form.thumbnail && (
                <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={assetUrl(form.thumbnail)}
                    alt="Thumbnail Preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                    Preview
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Detailed description of what sellers will learn in this marketplace training..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-60 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : isEdit ? "Save details" : "Create course & add lessons"}
          </button>
        </div>
      </form>

      {isEdit && (
        <div className="mt-8 space-y-8">
        {/* Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Visibility</h2>
            {statusSaving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {STATUS_OPTIONS.map(({ value, label, icon: Icon, tone, text }) => {
              const selected = form.status === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeStatus(value)}
                  disabled={statusSaving}
                  aria-pressed={selected}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition disabled:opacity-60 ${selected ? `${tone} ring-2 ring-offset-1 ring-primary-500/30` : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>
                    <span className="block text-sm font-semibold">{label}{selected ? " · current" : ""}</span>
                    <span className="mt-0.5 block text-xs opacity-80">{text}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">Live and Private need at least one published lesson with a video. Upcoming lessons are shown locked.</p>
        </div>

        {/* Course Lessons / Videos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Lessons & Curriculum ({form.videos.length})
            </h2>
            <span className="text-xs text-gray-500">
              Changes here are saved instantly
            </span>
          </div>

          <CourseModules
            courseId={id}
            modules={form.modules}
            lessons={form.videos}
            statusOf={statusOf}
            renderLesson={renderLesson}
            onCourse={applyCourse}
            onCreated={markCreated}
            onUploaded={markUploaded}
            onBlocked={markBlockedLessons}
            onBusyChange={setBulkUploading}
            onPlay={handlePreviewVideo}
          />

          {/* Add video form */}
          <div className="border border-dashed border-gray-300 rounded-xl p-5 space-y-4 bg-gray-50/50">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Add New Lesson
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Enter a title and optionally upload the video. The lesson is saved straight away and stays hidden until you publish it.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lesson title */}
              <input
                value={newVideo.title}
                onChange={(e) =>
                  setNewVideo({
                    ...newVideo,
                    title: e.target.value,
                  })
                }
                placeholder="Lesson Title"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />

              {/* Duration */}
              <input
                value={newVideo.duration}
                onChange={(e) =>
                  setNewVideo({
                    ...newVideo,
                    duration: e.target.value,
                  })
                }
                placeholder="Duration (e.g. 15m 30s)"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
            </div>

            {form.modules.length > 0 && (
              <select
                value={newVideo.moduleId}
                onChange={(e) => setNewVideo({ ...newVideo, moduleId: e.target.value })}
                aria-label="Module for the new lesson"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Course content (no module)</option>
                {form.modules.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            )}

            {/* Video upload */}
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg">
                {newVideo.videoId ? (
                  <VideoStatusLabel status={statusOf(newVideo.videoId)} progress={videoProgress[newVideo.videoId]} />
                ) : (
                  <span className="text-sm text-gray-400">
                    No video uploaded
                  </span>
                )}
              </div>

              <input
                type="file"
                ref={resumeInputRef}
                onChange={handleResumeUpload}
                accept="video/*"
                className="hidden"
              />

              <input
                type="file"
                ref={lessonVideoInputRef}
                onChange={handleLessonVideoUpload}
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => { setReplaceTargetId(null); lessonVideoInputRef.current?.click(); }}
                disabled={uploadingLessonVideo}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition disabled:opacity-60"
              >
                {uploadingLessonVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading… {uploadPercent}%
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Video
                  </>
                )}
              </button>
            </div>

            {replaceTargetId && (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 px-3 py-2">
                <p className="text-xs text-blue-700">Choose a replacement file for the selected lesson. It replaces the video as soon as the upload finishes.</p>
                <button type="button" onClick={() => setReplaceTargetId(null)} className="text-xs font-semibold text-blue-700 hover:underline">Cancel replace</button>
              </div>
            )}

            <button
              type="button"
              onClick={addVideo}
              disabled={
                Boolean(replaceTargetId) || !newVideo.title || uploadingLessonVideo || lessonBusy
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Lesson
            </button>
          </div>
        </div>

        </div>
      )}
      <ConfirmModal confirm={confirm} busy={lessonBusy} onCancel={() => setConfirm(null)} />
      <VideoPreviewModal preview={preview} onClose={() => setPreview(null)} />
      <DeleteLessonModal
        lesson={lessonToDelete}
        busy={lessonBusy}
        onCancel={() => setLessonToDelete(null)}
        onConfirm={confirmRemoveVideo}
      />
    </div>
  );
};

// A fresh form per course: going from "new" to the created course must not carry state (or a draft) across.
const CourseFormPage = () => {
  const { id } = useParams();
  return <CourseForm key={id || "new"} />;
};

export default CourseFormPage;
