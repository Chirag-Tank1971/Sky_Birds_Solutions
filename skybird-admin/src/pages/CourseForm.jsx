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
} from "lucide-react";
import Hls from "hls.js";

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
          <video ref={videoRef} controls playsInline className="aspect-video max-h-[75vh] w-full" />
        </div>
      </div>
    </div>
  );
};

const VideoStatusLabel = ({ status }) => {
  if (status === "processing") {
    return (
      <div className="flex items-center gap-1 mt-1 text-amber-600">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="text-xs font-medium">Processing video… you can keep editing and save</span>
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
      <span className="text-xs text-green-600 font-medium">Secure HLS video ready</span>
    </div>
  );
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

  const thumbInputRef = useRef(null);
  const lessonVideoInputRef = useRef(null);

  const [form, setForm] = useState({
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
  });

  const [newVideo, setNewVideo] = useState({
    title: "",
    duration: "",
    videoId: "",
  });

  // Processing state of videos uploaded in this session: videoId -> "processing" | "ready" | "failed".
  // Videos already saved on the course have no entry and are treated as ready.
  const [videoStatus, setVideoStatus] = useState({});

  useEffect(() => {
    const pending = Object.keys(videoStatus).filter((videoId) => videoStatus[videoId] === "processing");
    if (pending.length === 0) return undefined;
    const timer = setTimeout(async () => {
      const updates = {};
      for (const videoId of pending) {
        try {
          const { data } = await API.get(`/admin/videos/${videoId}/status`);
          if (data.status === "ready") {
            updates[videoId] = "ready";
            toast.success("A lesson video finished processing");
          } else if (data.status === "failed" || data.status === "missing") {
            updates[videoId] = "failed";
            toast.error(data.error || "A lesson video failed to process. Please upload it again.");
          }
        } catch {
          // Keep polling; a temporary network error should not mark the video failed.
        }
      }
      if (Object.keys(updates).length) setVideoStatus((prev) => ({ ...prev, ...updates }));
    }, 4000);
    return () => clearTimeout(timer);
  }, [videoStatus]);

  // Older API versions processed uploads before replying and sent no status.
  const trackUpload = (data) => {
    const status = data.status === "processing" ? "processing" : "ready";
    setVideoStatus((prev) => ({ ...prev, [data.videoId]: status }));
    return status;
  };

  const statusOf = (videoId) => videoStatus[videoId] || "ready";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const platRes = await API.get("/admin/platforms");
        if (platRes.data.success) {
          setPlatforms(platRes.data.data.filter((p) => p.isActive));
        }

        if (isEdit) {
          const { data } = await API.get(`/courses/${id}`);
          if (data.success) {
            const c = data.data;
            setForm({
              id: c.id,
              platform: c.platform,
              title: c.title,
              price: c.price,
              duration: c.duration || "",
              lessons: c.lessons || 0,
              level: c.level || "Beginner",
              thumbnail: c.thumbnail || "",
              description: c.description || "",
              videos: (c.videos || []).map((video) => ({
                id: video.id,
                title: video.title,
                duration: video.duration || "",
                videoId: video.videoId,
              })),
            });
          }
        }
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

  // Individual Lesson Video Upload Handler
  const handleLessonVideoUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);

    setUploadingLessonVideo(true);

    try {
      const { data } = await API.post("/admin/upload/video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success && data.videoId) {
        const status = trackUpload(data);
        if (status === "processing") toast.success("Video uploaded. Processing in the background…");
        if (replaceTargetId) {
          setForm((prev) => ({
            ...prev,
            videos: prev.videos.map((video) =>
              video.id === replaceTargetId
                ? { ...video, videoId: data.videoId }
                : video,
            ),
          }));
          toast.success("Lesson video replaced. Save the course to publish the change.");
          setReplaceTargetId(null);
        } else {
          setNewVideo((prev) => ({
            ...prev,
            videoId: data.videoId,
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

  const handlePreviewVideo = async (video) => {
    if (!video?.videoId) {
      toast.error("Upload a video before previewing it");
      return;
    }
    setLoadingPreviewId(video.id);
    try {
      const { data } = await API.post(`/admin/videos/${video.videoId}/preview-token`);
      if (!data.success || !data.token) throw new Error(data.message || "Preview authorization failed");
      setPreview({ title: video.title, videoId: video.videoId, token: data.token });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Unable to preview video");
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const moveVideo = (videoId, direction) => {
    setForm((prev) => {
      const index = prev.videos.findIndex((video) => video.id === videoId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.videos.length) return prev;
      const videos = [...prev.videos];
      [videos[index], videos[nextIndex]] = [videos[nextIndex], videos[index]];
      return { ...prev, videos };
    });
  };

  const addVideo = () => {
    if (!newVideo.title) {
      toast.error("Lesson title is required");
      return;
    }

    if (!newVideo.videoId) {
      toast.error("Please upload a lesson video first");
      return;
    }

    const video = {
      id: `vid-${Date.now()}`,
      title: newVideo.title,
      duration: newVideo.duration || "",
      videoId: newVideo.videoId,
    };

    setForm((prev) => ({
      ...prev,
      videos: [...prev.videos, video],
      lessons: prev.videos.length + 1,
    }));

    setNewVideo({
      title: "",
      duration: "",
      videoId: "",
    });
  };

  const removeVideo = (videoId) => {
    setForm((prev) => ({
      ...prev,
      videos: prev.videos.filter((v) => v.id !== videoId),
      lessons: prev.videos.length - 1,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.videos.length === 0) {
      toast.error("Please add at least one lesson");
      return;
    }

    if (form.videos.some((video) => statusOf(video.videoId) === "failed")) {
      toast.error("A lesson video failed to process. Replace it before saving.");
      return;
    }

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

        videos: form.videos.map((video) => ({
          id: video.id,
          title: video.title,
          duration: video.duration,
          videoId: video.videoId,
        })),

        lessons: form.videos.length,
      };

      if (isEdit) {
        await API.put(`/admin/courses/${id}`, payload);

        toast.success("Course updated");
      } else {
        await API.post("/admin/courses", payload);

        toast.success("Course created");
      }

      navigate("/courses");
    } catch (err) {
      console.error("Course save error:", err);

      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
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

      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {isEdit ? "Edit Course" : "Create New Course"}
      </h1>

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

        {/* Course Lessons / Videos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Lessons & Curriculum ({form.videos.length})
            </h2>
            <span className="text-xs text-gray-500">
              Add sequential chapters for this course
            </span>
          </div>

          {/* Existing videos */}
          {form.videos.length > 0 && (
            <div className="space-y-3">
              {form.videos.map((v, idx) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-400 w-6 text-center">#{idx + 1}</span>
                    <button type="button" onClick={() => moveVideo(v.id, -1)} disabled={idx === 0} aria-label={`Move ${v.title} up`} title="Move up" className="p-1 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => moveVideo(v.id, 1)} disabled={idx === form.videos.length - 1} aria-label={`Move ${v.title} down`} title="Move down" className="p-1 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {v.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {v.duration || "Video Lesson"}
                    </p>

                    <VideoStatusLabel status={statusOf(v.videoId)} />
                    <p className="text-[11px] text-gray-400 font-mono mt-1 break-all">Video ID: {v.videoId || "Missing video ID"}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
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
                      onClick={() => { setReplaceTargetId(v.id); lessonVideoInputRef.current?.click(); }}
                      disabled={uploadingLessonVideo}
                      title="Replace this lesson's video"
                      className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVideo(v.id)}
                      title="Remove lesson"
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add video form */}
          <div className="border border-dashed border-gray-300 rounded-xl p-5 space-y-4 bg-gray-50/50">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Add New Lesson
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Upload a video. It will be converted to secure encrypted HLS
                before being attached to the course.
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

            {/* Video upload */}
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg">
                {newVideo.videoId ? (
                  <VideoStatusLabel status={statusOf(newVideo.videoId)} />
                ) : (
                  <span className="text-sm text-gray-400">
                    No video uploaded
                  </span>
                )}
              </div>

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
                    Uploading...
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
                <p className="text-xs text-blue-700">Choose a replacement file for the selected lesson. Save the course after upload to publish the change.</p>
                <button type="button" onClick={() => setReplaceTargetId(null)} className="text-xs font-semibold text-blue-700 hover:underline">Cancel replace</button>
              </div>
            )}

            <button
              type="button"
              onClick={addVideo}
              disabled={
                Boolean(replaceTargetId) || !newVideo.title || !newVideo.videoId || uploadingLessonVideo
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Lesson
            </button>
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
            {saving
              ? "Saving Course..."
              : isEdit
                ? "Update Course"
                : "Create Course"}
          </button>
        </div>
      </form>
      <VideoPreviewModal preview={preview} onClose={() => setPreview(null)} />
    </div>
  );
};

export default CourseForm;
